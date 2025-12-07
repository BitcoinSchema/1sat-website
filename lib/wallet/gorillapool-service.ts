"use client";

export interface Ordinal {
	txid: string;
	vout: number;
	satoshis: number;
	script: string;
	owner: string;
	data?: any; // Refine based on usage
}

export class GorillaPoolService {
	private baseUrl = "https://ordinals.gorillapool.io/api";

	async getOrdinals(address: string): Promise<Ordinal[]> {
		try {
			const response = await fetch(
				`${this.baseUrl}/txos/address/${address}/unspent?script=true`,
			);
			if (!response.ok) {
				console.error(
					`GorillaPool fetch failed: ${response.status} ${response.statusText}`,
				);
				return [];
			}
			const data = await response.json();
			return Array.isArray(data) ? data : [];
		} catch (error) {
			console.error("GorillaPool fetch failed:", error);
			return [];
		}
	}

	// Add other methods from yours-wallet like getBsv20Balances
}
