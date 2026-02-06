"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ORDFS } from "@/lib/constants";
import type { WalletOrdinal } from "@/lib/types/ordinals";
import { GorillaPoolService } from "@/lib/wallet/gorillapool-service";

export interface OrdinalWithMeta extends WalletOrdinal {
	contentType?: string;
	name?: string;
	contentUrl: string;
}

export interface TokenBalance {
	tokenId: string;
	symbol?: string;
	icon?: string;
	decimals: number;
	totalAmount: string;
	outputs: WalletOrdinal[];
}

export interface LegacyAssets {
	loading: boolean;
	error: string | null;
	funding: WalletOrdinal[];
	ordinals: OrdinalWithMeta[];
	bsv21Tokens: TokenBalance[];
	bsv20Tokens: WalletOrdinal[];
	totalBsv: number;
	rescan: () => void;
}

function enrichOrdinal(utxo: WalletOrdinal): OrdinalWithMeta {
	const contentType = utxo.origin?.data?.insc?.file?.type;
	const name =
		(utxo.origin?.map?.name as string | undefined) ??
		(utxo.origin?.data?.map?.name as string | undefined);
	const contentUrl = `${ORDFS}/${utxo.origin?.outpoint || utxo.outpoint}`;

	return { ...utxo, contentType, name, contentUrl };
}

function groupBsv21Tokens(utxos: WalletOrdinal[]): TokenBalance[] {
	const groups = new Map<
		string,
		{ outputs: WalletOrdinal[]; symbol?: string; decimals: number }
	>();

	for (const utxo of utxos) {
		const bsv21 = utxo.origin?.data?.bsv21 ?? utxo.data?.bsv21;
		const tokenId = bsv21?.id;
		if (!tokenId) continue;

		let group = groups.get(tokenId);
		if (!group) {
			group = {
				outputs: [],
				symbol: bsv21.sym,
				decimals: bsv21.dec ?? 0,
			};
			groups.set(tokenId, group);
		}
		group.outputs.push(utxo);
	}

	const balances: TokenBalance[] = [];
	for (const [tokenId, group] of groups) {
		let totalAmount = BigInt(0);
		for (const utxo of group.outputs) {
			const bsv21 = utxo.origin?.data?.bsv21 ?? utxo.data?.bsv21;
			const amt = bsv21?.amt;
			if (amt) {
				totalAmount += BigInt(amt);
			}
		}

		balances.push({
			tokenId,
			symbol: group.symbol,
			icon: `${ORDFS}/${tokenId}`,
			decimals: group.decimals,
			totalAmount: totalAmount.toString(),
			outputs: group.outputs,
		});
	}

	return balances;
}

export function useLegacyAssets(
	legacyPayAddress: string | null,
	legacyOrdAddress: string | null,
): LegacyAssets {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [funding, setFunding] = useState<WalletOrdinal[]>([]);
	const [ordinals, setOrdinals] = useState<OrdinalWithMeta[]>([]);
	const [bsv21Tokens, setBsv21Tokens] = useState<TokenBalance[]>([]);
	const [bsv20Tokens, setBsv20Tokens] = useState<WalletOrdinal[]>([]);
	const [totalBsv, setTotalBsv] = useState(0);

	const serviceRef = useRef(new GorillaPoolService());

	const [scanTrigger, setScanTrigger] = useState(0);

	const rescan = useCallback(() => {
		setScanTrigger((prev) => prev + 1);
	}, []);

	useEffect(() => {
		if (!legacyPayAddress && !legacyOrdAddress) return;

		let cancelled = false;
		const service = serviceRef.current;

		async function scan() {
			setLoading(true);
			setError(null);

			try {
				const addresses = new Set<string>();
				if (legacyPayAddress) addresses.add(legacyPayAddress);
				if (legacyOrdAddress) addresses.add(legacyOrdAddress);

				const results = await Promise.all(
					[...addresses].map((addr) => service.getCategorizedUtxos(addr)),
				);

				if (cancelled) return;

				const mergedFunding: WalletOrdinal[] = [];
				const mergedOrdinals: WalletOrdinal[] = [];
				const mergedBsv21: WalletOrdinal[] = [];
				const mergedBsv20: WalletOrdinal[] = [];

				for (const result of results) {
					mergedFunding.push(...result.funding);
					mergedOrdinals.push(...result.ordinals);
					mergedBsv21.push(...result.bsv21Tokens);
					mergedBsv20.push(...result.bsv20Tokens);
				}

				const enrichedOrdinals = mergedOrdinals.map(enrichOrdinal);
				const groupedBsv21 = groupBsv21Tokens(mergedBsv21);
				const bsvTotal = mergedFunding.reduce(
					(sum, utxo) => sum + utxo.satoshis,
					0,
				);

				setFunding(mergedFunding);
				setOrdinals(enrichedOrdinals);
				setBsv21Tokens(groupedBsv21);
				setBsv20Tokens(mergedBsv20);
				setTotalBsv(bsvTotal);
			} catch (err) {
				if (cancelled) return;
				const message =
					err instanceof Error
						? err.message
						: "Failed to scan legacy addresses";
				setError(message);
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		scan();

		return () => {
			cancelled = true;
		};
		// biome-ignore lint/correctness/useExhaustiveDependencies: scanTrigger triggers rescan
	}, [legacyPayAddress, legacyOrdAddress, scanTrigger]);

	return {
		loading,
		error,
		funding,
		ordinals,
		bsv21Tokens,
		bsv20Tokens,
		totalBsv,
		rescan,
	};
}
