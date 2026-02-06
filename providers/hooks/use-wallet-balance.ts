"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TxoData } from "@/lib/types/ordinals";
import type { Ordinal } from "@/lib/wallet/gorillapool-service";
import { GorillaPoolService } from "@/lib/wallet/gorillapool-service";

type Wallet = {
	balance: () => Promise<number>;
};

interface WalletBalance {
	confirmed: number;
	unconfirmed: number;
	total: number;
}

interface TokenBalance {
	outpoint: string;
	txid: string;
	vout: number;
	data?: TxoData;
	height?: number;
}

interface BalanceQueryResult {
	balance: WalletBalance;
	ordinals: Ordinal[];
	bsv20Tokens: TokenBalance[];
	bsv21Tokens: TokenBalance[];
}

interface UseWalletBalanceOptions {
	wallet: Wallet | null;
	isInitialized: boolean;
	chain: "main" | "test";
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
	ordinals: Ordinal[];
	bsv20Tokens: TokenBalance[];
	bsv21Tokens: TokenBalance[];
	isBalanceLoading: boolean;
	balanceError: Error | null;
	refreshBalance: () => void;
	syncStatus: SyncStatus;
	balanceQueryKey: readonly [string, string, string | null, string];
}

export function useWalletBalance({
	wallet,
	isInitialized,
	chain,
	identityKey,
	trackedAddresses,
}: UseWalletBalanceOptions): WalletBalanceResult {
	const queryClient = useQueryClient();
	const gorillaPoolRef = useRef(new GorillaPoolService());

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
			if (!wallet || !isInitialized || trackedAddresses.length === 0) {
				throw new Error("Wallet not initialized");
			}

			console.log("[WalletToolbox] Starting wallet scan request...");
			const gp = gorillaPoolRef.current;

			const results = await Promise.all(
				trackedAddresses.map(async (address) => {
					console.log(
						`[WalletToolbox] Scanning receive address ${address.slice(0, 10)}...`,
					);
					return gp.getCategorizedUtxos(address);
				}),
			);

			const [fundOutputs, ...utxoResults] = await Promise.all([
				wallet.balance(),
				...results,
			]);
			const total = fundOutputs ?? 0;

			const categorized = utxoResults[0] ?? {
				ordinals: [],
				bsv20Tokens: [],
				bsv21Tokens: [],
				funding: [],
			};
			for (let i = 1; i < utxoResults.length; i++) {
				categorized.ordinals.push(...utxoResults[i].ordinals);
				categorized.bsv20Tokens.push(...utxoResults[i].bsv20Tokens);
				categorized.bsv21Tokens.push(...utxoResults[i].bsv21Tokens);
			}

			console.log(
				`[WalletToolbox] Balance: ${total}, Ordinals: ${categorized.ordinals.length}, BSV20: ${categorized.bsv20Tokens.length}, BSV21: ${categorized.bsv21Tokens.length}`,
			);

			return {
				balance: { confirmed: total, unconfirmed: 0, total },
				ordinals: categorized.ordinals,
				bsv20Tokens: categorized.bsv20Tokens.map((o) => ({
					outpoint: o.outpoint,
					txid: o.txid,
					vout: o.vout,
					height: o.height,
					data: o.data,
				})),
				bsv21Tokens: categorized.bsv21Tokens.map((o) => ({
					outpoint: o.outpoint,
					txid: o.txid,
					vout: o.vout,
					height: o.height,
					data: o.data,
				})),
			};
		},
		enabled: isInitialized && !!wallet && trackedAddresses.length > 0,
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
		bsv20Tokens: balanceQuery.data?.bsv20Tokens ?? [],
		bsv21Tokens: balanceQuery.data?.bsv21Tokens ?? [],
		isBalanceLoading: balanceQuery.isLoading,
		balanceError: balanceQuery.error,
		refreshBalance,
		syncStatus,
		balanceQueryKey,
	};
}
