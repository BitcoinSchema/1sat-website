"use client";

import type { ChainInfo, FeeRate } from "./types";

interface ChainUTXO {
	txid: string;
	vout: number;
	satoshis: number;
	lockingScript: string;
	blockHeight?: number;
}

interface ChainTransaction {
	txid: string;
	blockHeight?: number;
	blockHash?: string;
	timestamp?: Date;
	confirmations?: number;
}

export class ChainService {
	private baseUrl: string;
	private network: "mainnet" | "testnet";

	constructor(network: "mainnet" | "testnet" = "mainnet") {
		this.network = network;
		// Using WhatsOnChain API
		this.baseUrl =
			network === "mainnet"
				? "https://api.whatsonchain.com/v1/bsv/main"
				: "https://api.whatsonchain.com/v1/bsv/test";
	}

	// Get UTXOs for an address
	async getUTXOs(address: string): Promise<ChainUTXO[]> {
		try {
			const response = await fetch(
				`${this.baseUrl}/address/${address}/unspent`,
			);
			if (!response.ok) {
				throw new Error(`Failed to fetch UTXOs: ${response.statusText}`);
			}

			interface WhatsOnChainUTXO {
				tx_hash: string;
				tx_pos: number;
				value: number;
				script?: string;
				height: number;
			}
			const data: WhatsOnChainUTXO[] = await response.json();
			return data.map((utxo) => ({
				txid: utxo.tx_hash,
				vout: utxo.tx_pos,
				satoshis: utxo.value,
				lockingScript: utxo.script || "", // May need to fetch separately
				blockHeight: utxo.height === 0 ? undefined : utxo.height,
			}));
		} catch (error) {
			console.error("Error fetching UTXOs:", error);
			// Return empty array on error to allow offline operation
			return [];
		}
	}

	// Get transaction details
	async getTransaction(txid: string): Promise<ChainTransaction | null> {
		try {
			const response = await fetch(`${this.baseUrl}/tx/${txid}`);
			if (!response.ok) {
				if (response.status === 404) return null;
				throw new Error(`Failed to fetch transaction: ${response.statusText}`);
			}

			const data = await response.json();
			return {
				txid: data.txid,
				blockHeight: data.blockheight === 0 ? undefined : data.blockheight,
				blockHash: data.blockhash,
				timestamp: data.time ? new Date(data.time * 1000) : undefined,
				confirmations: data.confirmations,
			};
		} catch (error) {
			console.error("Error fetching transaction:", error);
			return null;
		}
	}

	// Broadcast transaction
	async broadcastTransaction(
		txHex: string,
	): Promise<{ success: boolean; txid?: string; error?: string }> {
		try {
			const response = await fetch(`${this.baseUrl}/tx/raw`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ txhex: txHex }),
			});

			if (!response.ok) {
				const errorText = await response.text();
				return {
					success: false,
					error: `Broadcast failed: ${errorText}`,
				};
			}

			const txid = await response.text();
			return {
				success: true,
				txid: txid.replace(/['"]/g, ""), // Clean up response
			};
		} catch (error) {
			console.error("Error broadcasting transaction:", error);
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	// Get current chain info
	async getChainInfo(): Promise<ChainInfo | null> {
		try {
			const response = await fetch(`${this.baseUrl}/chain/info`);
			if (!response.ok) {
				throw new Error(`Failed to fetch chain info: ${response.statusText}`);
			}

			const data = await response.json();
			return {
				height: data.blocks,
				hash: data.bestblockhash,
				time: Date.now(), // Current time as approximation
			};
		} catch (error) {
			console.error("Error fetching chain info:", error);
			return null;
		}
	}

	// Get fee rates
	async getFeeRates(): Promise<FeeRate> {
		// WhatsOnChain doesn't provide fee rates directly
		// Return conservative defaults
		return {
			standard: 50, // 50 sats/kb
			data: 50, // 50 sats/kb
		};
	}

	// Get address balance
	async getBalance(address: string): Promise<{
		confirmed: number;
		unconfirmed: number;
	}> {
		try {
			const response = await fetch(
				`${this.baseUrl}/address/${address}/balance`,
			);
			if (!response.ok) {
				throw new Error(`Failed to fetch balance: ${response.statusText}`);
			}

			const data = await response.json();
			return {
				confirmed: data.confirmed,
				unconfirmed: data.unconfirmed,
			};
		} catch (error) {
			console.error("Error fetching balance:", error);
			return {
				confirmed: 0,
				unconfirmed: 0,
			};
		}
	}

	// Get address history
	async getAddressHistory(
		address: string,
		limit = 100,
	): Promise<Array<{ txid: string; height: number }>> {
		try {
			const response = await fetch(
				`${this.baseUrl}/address/${address}/history?limit=${limit}`,
			);
			if (!response.ok) {
				throw new Error(`Failed to fetch history: ${response.statusText}`);
			}

			interface WhatsOnChainHistoryItem {
				tx_hash: string;
				height: number;
			}
			const data: WhatsOnChainHistoryItem[] = await response.json();
			return data.map((item) => ({
				txid: item.tx_hash,
				height: item.height,
			}));
		} catch (error) {
			console.error("Error fetching address history:", error);
			return [];
		}
	}

	// Get raw transaction
	async getRawTransaction(txid: string): Promise<string | null> {
		try {
			const response = await fetch(`${this.baseUrl}/tx/${txid}/hex`);
			if (!response.ok) {
				if (response.status === 404) return null;
				throw new Error(
					`Failed to fetch raw transaction: ${response.statusText}`,
				);
			}

			return await response.text();
		} catch (error) {
			console.error("Error fetching raw transaction:", error);
			return null;
		}
	}

	// Get block height
	async getCurrentBlockHeight(): Promise<number> {
		try {
			const info = await this.getChainInfo();
			return info?.height || 0;
		} catch (error) {
			console.error("Error fetching block height:", error);
			return 0;
		}
	}

	// Check if transaction is confirmed
	async isTransactionConfirmed(
		txid: string,
		requiredConfirmations = 6,
	): Promise<boolean> {
		try {
			const tx = await this.getTransaction(txid);
			if (!tx) return false;
			return (tx.confirmations || 0) >= requiredConfirmations;
		} catch (error) {
			console.error("Error checking transaction confirmation:", error);
			return false;
		}
	}

	// Get merkle proof for a transaction
	async getMerkleProof(txid: string): Promise<Record<string, unknown> | null> {
		try {
			const response = await fetch(`${this.baseUrl}/tx/${txid}/proof`);
			if (!response.ok) {
				if (response.status === 404) return null;
				throw new Error(`Failed to fetch merkle proof: ${response.statusText}`);
			}

			return await response.json();
		} catch (error) {
			console.error("Error fetching merkle proof:", error);
			return null;
		}
	}

	// Estimate fee for transaction size
	estimateFee(bytes: number): Promise<number> {
		// Simple fee estimation
		// Using 50 sats/kb as default
		const kb = Math.ceil(bytes / 1000);
		return Promise.resolve(kb * 50);
	}

	// Validate address
	isValidAddress(address: string): boolean {
		try {
			// Basic validation - can be improved
			const base58Regex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
			return base58Regex.test(address);
		} catch {
			return false;
		}
	}

	// Get network
	getNetwork(): "mainnet" | "testnet" {
		return this.network;
	}

	// Switch network
	switchNetwork(network: "mainnet" | "testnet"): void {
		this.network = network;
		this.baseUrl =
			network === "mainnet"
				? "https://api.whatsonchain.com/v1/bsv/main"
				: "https://api.whatsonchain.com/v1/bsv/test";
	}
}
