"use client";

import {
	getOrdinals,
	type OneSatContext,
	type WalletOutput,
} from "@1sat/actions";
import { specOpWalletBalance } from "@bsv/wallet-toolbox/out/src/sdk/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface WalletBalance {
	confirmed: number;
	unconfirmed: number;
	total: number;
}

interface LegacyFundingUtxo {
	outpoint: string;
	satoshis: number;
}

interface BalanceQueryResult {
	balance: WalletBalance;
	ordinals: WalletOutput[];
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

			console.log("[WalletToolbox] Starting wallet scan request...");

			// Legacy balance hint from the stack index (display-only — the
			// migrate flow does its own forced re-sync before sweeping).
			// Funding = plain sats>1 outputs without token/lock event tags.
			const legacyResults = await Promise.all(
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
					} catch (error) {
						console.warn(
							`[WalletToolbox] Legacy scan failed for ${address.slice(0, 10)}:`,
							error,
						);
						return [];
					}
				}),
			);

			const [balanceResult, ordinalsResult] = await Promise.all([
				ctx.wallet.listOutputs({ basket: specOpWalletBalance }),
				getOrdinals.execute(ctx, {}),
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

			console.log(
				`[WalletToolbox] Balance: ${total}, Legacy: ${legacyBalance}, Ordinals: ${ordinalsResult.outputs.length}`,
			);

			return {
				balance: { confirmed: total, unconfirmed: 0, total },
				ordinals: ordinalsResult.outputs,
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
			error: balanceQuery.error?.message ?? null,
		}),
		[balanceQuery.isFetching, balanceQuery.error, lastSync],
	);

	return {
		balance: balanceQuery.data?.balance ?? null,
		ordinals: balanceQuery.data?.ordinals ?? [],
		legacyBalance: balanceQuery.data?.legacyBalance ?? 0,
		legacyFundingUtxos: balanceQuery.data?.legacyFundingUtxos ?? [],
		isBalanceLoading: balanceQuery.isLoading,
		balanceError: balanceQuery.error,
		refreshBalance,
		syncStatus,
		balanceQueryKey,
	};
}
