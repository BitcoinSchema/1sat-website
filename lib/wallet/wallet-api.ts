"use client";

import { Hash, Utils } from "@bsv/sdk";
import type { Chain } from "@bsv/wallet-toolbox/out/src/sdk/types";
import { WalletError } from "@bsv/wallet-toolbox/out/src/sdk/WalletError";
import type {
	BlockHeader,
	GetMerklePathResult,
	GetRawTxResult,
	GetScriptHashHistoryResult,
	GetStatusForTxidsResult,
	GetUtxoStatusOutputFormat,
	GetUtxoStatusResult,
	PostBeefResult,
	ServicesCallHistory,
	WalletServices,
} from "@bsv/wallet-toolbox/out/src/sdk/WalletServices.interfaces";
import type { TableOutput } from "@bsv/wallet-toolbox/out/src/storage/schema/tables/TableOutput";
import { ChainService } from "./chain-service";

export class WalletAPI implements WalletServices {
	chain: Chain;
	private chainService: ChainService;

	constructor(network: "mainnet" | "testnet") {
		this.chain = network === "mainnet" ? "main" : "test";
		this.chainService = new ChainService(network);
	}

	async getChainTracker(): ReturnType<WalletServices["getChainTracker"]> {
		// Helper to get current chain tip
		const info = await this.chainService.getChainInfo();
		if (!info) throw new Error("Failed to get chain info");

		// Create a basic tracker (placeholder)
		// Real impl needs headers.
		// For now we might throw or return basic.
		// wallet-toolbox might need this for verification.
		throw new Error("ChainTracker not implemented");
	}

	async getHeaderForHeight(height: number): Promise<number[]> {
		// WOC doesn't give raw header easily?
		// /block/:hash/header returns hex.
		// We need block hash by height first.
		// This chain hopping is expensive.
		// Use a custom indexer if possible.
		throw new Error(`getHeaderForHeight not implemented (height=${height})`);
	}

	async getHeight(): Promise<number> {
		return this.chainService.getCurrentBlockHeight();
	}

	async getBsvExchangeRate(): Promise<number> {
		// Todo: Implement
		return 0;
	}

	async getFiatExchangeRate(
		currency: "USD" | "GBP" | "EUR",
		base?: "USD" | "GBP" | "EUR",
	): Promise<number> {
		void currency;
		void base;
		return 0;
	}

	async getRawTx(txid: string, useNext?: boolean): Promise<GetRawTxResult> {
		void useNext;
		try {
			const rawTx = await this.chainService.getRawTransaction(txid);
			if (!rawTx) {
				return {
					txid,
					error: new WalletError("FETCH_FAILED", "Transaction not found"),
				};
			}
			return {
				txid,
				name: "whatsonchain",
				rawTx: Utils.toArray(rawTx, "hex"),
			};
		} catch (e) {
			return { txid, error: new WalletError("NETWORK_ERROR", String(e)) };
		}
	}

	async getMerklePath(
		txid: string,
		useNext?: boolean,
	): Promise<GetMerklePathResult> {
		void useNext;
		// WOC /tx/:txid/proof
		const proof = await this.chainService.getMerkleProof(txid);
		if (!proof) {
			return {
				name: "whatsonchain",
				error: new WalletError("FETCH_FAILED", "Proof not found"),
			};
		}
		// Convert WOC proof to MerklePath object?
		// This is complex mapping.
		// For now, throw to fallback?
		throw new Error("getMerklePath not fully implemented for WOC");
	}

	async postBeef(
		...args: Parameters<WalletServices["postBeef"]>
	): ReturnType<WalletServices["postBeef"]> {
		const [beef, txids] = args;
		// Broadcast BEEF? WOC takes raw tx.
		// Extract transactions from BEEF and broadcast?
		// For simple txs, we can broadcast the target tx.
		// This method is specific to BRC-100 internalization.
		// Fallback to broadcasting raw txs if possible.

		const results: PostBeefResult[] = [];
		for (const txid of txids) {
			const beefTx = beef.findTxid(txid);
			if (beefTx?.tx) {
				const res = await this.chainService.broadcastTransaction(
					Utils.toHex(beefTx.tx.toBinary()),
				);
				results.push({
					name: "whatsonchain",
					status: res.success ? "success" : "error",
					error: res.error
						? new WalletError("BROADCAST_FAILED", res.error)
						: undefined,
					txidResults: [{ txid, status: res.success ? "success" : "error" }],
				});
			}
		}
		return results;
	}

	hashOutputScript(script: string): string {
		const scriptBin = Utils.toArray(script, "hex");
		return Utils.toHex(Hash.sha256(scriptBin).reverse());
	}

	async getStatusForTxids(
		txids: string[],
		useNext?: boolean,
	): Promise<GetStatusForTxidsResult> {
		void txids;
		void useNext;
		// WOC supports batch check? No.
		// Loop?
		throw new Error("getStatusForTxids not implemented");
	}

	async isUtxo(output: TableOutput): Promise<boolean> {
		void output;
		// Check if output is unspent
		// TableOutput has lockingScript, not script
		// This is hard without address. WOC needs address for UTXOs.
		// For now, return false as placeholder
		return false;
	}

	async getUtxoStatus(
		output: string,
		outputFormat?: GetUtxoStatusOutputFormat,
		outpoint?: string,
		useNext?: boolean,
	): Promise<GetUtxoStatusResult> {
		void output;
		void outputFormat;
		void outpoint;
		void useNext;
		// output is script hex?
		throw new Error("getUtxoStatus not implemented");
	}

	async getScriptHashHistory(
		hash: string,
		useNext?: boolean,
	): Promise<GetScriptHashHistoryResult> {
		void useNext;
		// WOC: /script/:hash/history
		// We can implement this!
		const url =
			this.chainService.getNetwork() === "mainnet"
				? `https://api.whatsonchain.com/v1/bsv/main/script/${hash}/history`
				: `https://api.whatsonchain.com/v1/bsv/test/script/${hash}/history`;

		try {
			const res = await fetch(url);
			const data = await res.json();
			// Map data to history
			return {
				name: "whatsonchain",
				status: "success" as const,
				history: data.map((item: { tx_hash: string; height: number }) => ({
					txId: item.tx_hash,
					height: item.height,
				})),
			};
		} catch (e) {
			return {
				name: "whatsonchain",
				status: "error" as const,
				error: new WalletError("FETCH_FAILED", String(e)),
				history: [],
			};
		}
	}

	async hashToHeader(hash: string): Promise<BlockHeader> {
		void hash;
		throw new Error("hashToHeader not implemented");
	}

	async nLockTimeIsFinal(
		...args: Parameters<WalletServices["nLockTimeIsFinal"]>
	): ReturnType<WalletServices["nLockTimeIsFinal"]> {
		void args;
		return true; // Simplified
	}

	async getBeefForTxid(
		...args: Parameters<WalletServices["getBeefForTxid"]>
	): ReturnType<WalletServices["getBeefForTxid"]> {
		void args;
		throw new Error("getBeefForTxid not implemented");
	}

	getServicesCallHistory(reset?: boolean): ServicesCallHistory {
		void reset;
		return {
			version: 1,
			getMerklePath: { serviceName: "getMerklePath", historyByProvider: {} },
			getRawTx: { serviceName: "getRawTx", historyByProvider: {} },
			postBeef: { serviceName: "postBeef", historyByProvider: {} },
			getUtxoStatus: { serviceName: "getUtxoStatus", historyByProvider: {} },
			getStatusForTxids: {
				serviceName: "getStatusForTxids",
				historyByProvider: {},
			},
			getScriptHashHistory: {
				serviceName: "getScriptHashHistory",
				historyByProvider: {},
			},
			updateFiatExchangeRates: {
				serviceName: "updateFiatExchangeRates",
				historyByProvider: {},
			},
		};
	}
}
