"use client";

import {
	type Bsv21Balance,
	getBsv21Balances,
	listOrdinals,
	type OneSatContext,
	type WalletOutput,
} from "@1sat/actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { reportDiagnostic } from "@/lib/runtime-diagnostics";

interface WalletBalance {
	confirmed: number;
	unconfirmed: number;
	total: number;
}

// Wallet Toolbox's BRC-100 balance pseudo-basket. Kept local because the
// client package intentionally does not expose its internal SDK constants.
const WALLET_BALANCE_BASKET =
	"893b7646de0e1c9f741bd6e9169b76a8847ae34adef7bef1e6a285371206d2e8";

interface LegacyFundingUtxo {
	outpoint: string;
	satoshis: number;
}

interface BalanceQueryResult {
	balance: WalletBalance;
	ordinals: WalletOutput[];
	bsv21Balances: Bsv21Balance[];
	legacyBalance: number;
	legacyFundingUtxos: LegacyFundingUtxo[];
}

interface UseWalletBalanceOptions {
	ctx: OneSatContext | null;
	isInitialized: boolean;
	identityKey: string | null;
	trackedAddresses: string[];
}

interface SyncStatus {
	isSyncing: boolean;
	progress: null;
	lastSync: Date | null;
	error: string | null;
}

export interface WalletBalanceResult {
	balance: WalletBalance | null;
	ordinals: WalletOutput[];
	bsv21Balances: Bsv21Balance[];
	legacyBalance: number;
	legacyFundingUtxos: LegacyFundingUtxo[];
	isBalanceLoading: boolean;
	balanceError: Error | null;
	refreshBalance: () => void;
	syncStatus: SyncStatus;
	balanceQueryKey: readonly [string, string, string | null, string];
}

export function useWalletBalance({
	ctx,
	isInitialized,
	identityKey,
	trackedAddresses,
}: UseWalletBalanceOptions): WalletBalanceResult {
	const queryClient = useQueryClient();

	const chain = ctx?.chain ?? "main";

	const addressesKey = useMemo(
		() => trackedAddresses.join(","),
		[trackedAddresses],
	);
	const balanceQueryKey = useMemo(
		() => ["wallet-balance", chain, identityKey, addressesKey] as const,
		[chain, identityKey, addressesKey],
	);

	const balanceQuery = useQuery({
		queryKey: balanceQueryKey,
		queryFn: async (): Promise<BalanceQueryResult> => {
			if (!ctx || !isInitialized || trackedAddresses.length === 0) {
				throw new Error("Wallet not initialized");
			}

			// Legacy balance hint from the stack index (display-only — the
			// migrate flow does its own forced re-sync before sweeping).
			// Funding = plain sats>1 outputs without token/lock event tags.
			const legacyResultsPromise = Promise.all(
				trackedAddresses.map(async (address) => {
					try {
						const outputs =
							(await ctx.services?.txo.search(`own:${address}`, {
								unspent: true,
								events: true,
								sats: true,
								limit: 0,
							})) ?? [];
						return outputs.filter((out) => {
							const events = out.events ?? [];
							if ((out.satoshis ?? 0) <= 1) return false;
							return !events.some(
								(e) =>
									e.startsWith("bsv21:") ||
									e.startsWith("lock:") ||
									e === "type:application/bsv-20" ||
									e === "type:Token",
							);
						});
					} catch {
						reportDiagnostic({
							category: "provider",
							code: "provider.failed",
							operation: "wallet.balance.legacy-scan",
							recoverable: true,
							context: { retryable: true },
						});
						return [];
					}
				}),
			);

			const [legacyResults, balanceResult, ordinalsResult, bsv21Balances] =
				await Promise.all([
					legacyResultsPromise,
					ctx.wallet.listOutputs({ basket: WALLET_BALANCE_BASKET }),
					listOrdinals.execute(ctx, {}),
					getBsv21Balances.execute(ctx, {}),
				]);
			const total = balanceResult.totalOutputs;

			const legacyFundingUtxos = legacyResults.flat().map((u) => ({
				outpoint: u.outpoint,
				satoshis: u.satoshis ?? 0,
			}));
			const legacyBalance = legacyFundingUtxos.reduce(
				(sum, u) => sum + u.satoshis,
				0,
			);

			return {
				balance: { confirmed: total, unconfirmed: 0, total },
				ordinals: ordinalsResult.outputs,
				bsv21Balances,
				legacyBalance,
				legacyFundingUtxos,
			};
		},
		enabled: isInitialized && !!ctx && trackedAddresses.length > 0,
		staleTime: 30_000,
		gcTime: 5 * 60_000,
	});

	const refreshBalance = useCallback(() => {
		queryClient.invalidateQueries({
			queryKey: ["wallet-balance", chain, identityKey],
		});
	}, [queryClient, chain, identityKey]);

	const [lastSync, setLastSync] = useState<Date | null>(null);
	const wasFetchingRef = useRef(false);
	useEffect(() => {
		if (
			wasFetchingRef.current &&
			!balanceQuery.isFetching &&
			balanceQuery.isSuccess
		) {
			setLastSync(new Date());
		}
		wasFetchingRef.current = balanceQuery.isFetching;
	}, [balanceQuery.isFetching, balanceQuery.isSuccess]);

	const syncStatus = useMemo<SyncStatus>(
		() => ({
			isSyncing: balanceQuery.isFetching,
			progress: null,
			lastSync,
			error: balanceQuery.error ? "Balance refresh failed. Try again." : null,
		}),
		[balanceQuery.isFetching, balanceQuery.error, lastSync],
	);

	return {
		balance: balanceQuery.data?.balance ?? null,
		ordinals: balanceQuery.data?.ordinals ?? [],
		bsv21Balances: balanceQuery.data?.bsv21Balances ?? [],
		legacyBalance: balanceQuery.data?.legacyBalance ?? 0,
		legacyFundingUtxos: balanceQuery.data?.legacyFundingUtxos ?? [],
		isBalanceLoading: balanceQuery.isLoading,
		balanceError: balanceQuery.error
			? new Error("Balance refresh failed. Try again.")
			: null,
		refreshBalance,
		syncStatus,
		balanceQueryKey,
	};
}
