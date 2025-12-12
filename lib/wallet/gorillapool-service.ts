"use client";

import type { WalletOrdinal } from "@/lib/types/ordinals";

export type Ordinal = WalletOrdinal;

export interface CategorizedUtxos {
	ordinals: Ordinal[];
	bsv20Tokens: Ordinal[];
	bsv21Tokens: Ordinal[];
	funding: Ordinal[];
}

type GorillaPoolResponseItem = Omit<Ordinal, "outpoint" | "owner"> & {
	outpoint?: string;
	owner?: string;
};

export class GorillaPoolService {
	private baseUrl = "https://ordinals.gorillapool.io/api";

	/**
	 * Get all unspent outputs for an address
	 */
	async getUnspentOutputs(address: string, limit = 1000): Promise<Ordinal[]> {
		try {
			const response = await fetch(
				`${this.baseUrl}/txos/address/${address}/unspent?limit=${limit}`,
			);
			if (!response.ok) {
				console.error(
					`GorillaPool fetch failed: ${response.status} ${response.statusText}`,
				);
				return [];
			}
			const data = (await response.json()) as GorillaPoolResponseItem[];
			if (!Array.isArray(data)) return [];

			return data.map((item) => ({
				...item,
				outpoint: item.outpoint || `${item.txid}_${item.vout}`,
				owner: item.owner || address,
			}));
		} catch (error) {
			console.error("GorillaPool fetch failed:", error);
			return [];
		}
	}

	/**
	 * Categorize UTXOs into ordinals, tokens, and funding
	 * Uses origin.data to determine if an output is a token
	 */
	categorizeUtxos(utxos: Ordinal[]): CategorizedUtxos {
		const ordinals: Ordinal[] = [];
		const bsv20Tokens: Ordinal[] = [];
		const bsv21Tokens: Ordinal[] = [];
		const funding: Ordinal[] = [];

		for (const utxo of utxos) {
			const originData = utxo.origin?.data;

			if (originData?.bsv21) {
				bsv21Tokens.push(utxo);
			} else if (originData?.bsv20) {
				bsv20Tokens.push(utxo);
			} else if (originData?.insc || utxo.origin?.outpoint) {
				ordinals.push(utxo);
			} else {
				funding.push(utxo);
			}
		}

		return { ordinals, bsv20Tokens, bsv21Tokens, funding };
	}

	/**
	 * Get categorized UTXOs for an address
	 */
	async getCategorizedUtxos(address: string): Promise<CategorizedUtxos> {
		const utxos = await this.getUnspentOutputs(address);
		const categorized = this.categorizeUtxos(utxos);

		console.log(
			`[GorillaPool] Address ${address.slice(0, 8)}...: ` +
				`${categorized.ordinals.length} ordinals, ` +
				`${categorized.bsv20Tokens.length} BSV20, ` +
				`${categorized.bsv21Tokens.length} BSV21, ` +
				`${categorized.funding.length} funding`,
		);

		return categorized;
	}

	async getOrdinals(address: string): Promise<Ordinal[]> {
		const categorized = await this.getCategorizedUtxos(address);
		return categorized.ordinals;
	}

	async getBsv20Tokens(address: string): Promise<Ordinal[]> {
		const categorized = await this.getCategorizedUtxos(address);
		return categorized.bsv20Tokens;
	}

	async getBsv21Tokens(address: string): Promise<Ordinal[]> {
		const categorized = await this.getCategorizedUtxos(address);
		return categorized.bsv21Tokens;
	}
}
