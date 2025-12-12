/**
 * WalletAPI Service
 *
 * Implements WalletServices interface for network operations.
 * Based on yours-wallet's WalletServices.service.ts
 *
 * Endpoints:
 * - ORDFS (ordfs.network) - Block headers, merkle proofs, raw transactions, metadata
 * - ordinals.1sat.app - Transaction broadcasting
 */

import { MerklePath, Utils } from "@bsv/sdk";
import { ORDFS } from "../constants";
import type {
	OrdfsMetadata,
	WalletServices,
} from "../indexers/TransactionParser";

export class WalletAPI implements WalletServices {
	private ordfsBaseUrl: string;
	private onesatBaseUrl: string;

	constructor(network: "mainnet" | "testnet" = "mainnet", ordfsUrl?: string) {
		this.ordfsBaseUrl = ordfsUrl || ORDFS;
		this.onesatBaseUrl =
			network === "mainnet"
				? "https://ordinals.1sat.app"
				: "https://testnet.ordinals.gorillapool.io";
	}

	async getRawTx(txid: string): Promise<{ rawTx?: number[]; error?: Error }> {
		try {
			const resp = await fetch(`${this.ordfsBaseUrl}/v2/tx/${txid}`);
			if (!resp.ok) {
				return {
					error: new Error(`Failed to fetch transaction: ${resp.statusText}`),
				};
			}
			const arrayBuffer = await resp.arrayBuffer();
			const rawTx = Array.from(new Uint8Array(arrayBuffer));
			return { rawTx };
		} catch (error) {
			return {
				error: error instanceof Error ? error : new Error("Unknown error"),
			};
		}
	}

	async getMerklePath(
		txid: string,
	): Promise<{ merklePath?: MerklePath; error?: Error }> {
		try {
			const resp = await fetch(`${this.ordfsBaseUrl}/v2/tx/${txid}/proof`);
			if (!resp.ok) {
				return {
					error: new Error(`Failed to fetch merkle proof: ${resp.statusText}`),
				};
			}
			const arrayBuffer = await resp.arrayBuffer();
			const proofBytes = Array.from(new Uint8Array(arrayBuffer));
			const merklePath = MerklePath.fromBinary(proofBytes);
			return { merklePath };
		} catch (error) {
			return {
				error: error instanceof Error ? error : new Error("Unknown error"),
			};
		}
	}

	async getOrdfsMetadata(
		outpoint: string,
		includeMap = false,
	): Promise<OrdfsMetadata | undefined> {
		try {
			const url = new URL(`${this.ordfsBaseUrl}/v2/metadata/${outpoint}`);
			if (includeMap) {
				url.searchParams.set("map", "true");
			}
			const resp = await fetch(url.toString());
			if (!resp.ok) {
				if (resp.status === 404) {
					return undefined;
				}
				throw new Error(`Failed to fetch OrdFS metadata: ${resp.statusText}`);
			}
			return await resp.json();
		} catch (error) {
			if (error instanceof Error && error.message.includes("Failed to fetch")) {
				throw error;
			}
			return undefined;
		}
	}

	async getOrdfsContent(outpoint: string): Promise<number[] | undefined> {
		try {
			const resp = await fetch(`${this.ordfsBaseUrl}/content/${outpoint}`);
			if (!resp.ok) {
				if (resp.status === 404) {
					return undefined;
				}
				throw new Error(`Failed to fetch OrdFS content: ${resp.statusText}`);
			}
			const arrayBuffer = await resp.arrayBuffer();
			return Array.from(new Uint8Array(arrayBuffer));
		} catch {
			return undefined;
		}
	}

	async getHeight(): Promise<number> {
		const resp = await fetch(`${this.ordfsBaseUrl}/v2/chain/height`);
		if (!resp.ok) {
			throw new Error(`Failed to fetch chain height: ${resp.statusText}`);
		}
		const data = await resp.json();
		return data.height;
	}

	async broadcastTx(txHex: string): Promise<{ txid?: string; error?: Error }> {
		try {
			const resp = await fetch(`${this.onesatBaseUrl}/v5/tx`, {
				method: "POST",
				headers: {
					"Content-Type": "application/octet-stream",
				},
				body: new Uint8Array(Utils.toArray(txHex, "hex")),
			});

			const body = await resp.json();

			if (resp.status === 200) {
				return { txid: body.txid };
			} else {
				return { error: new Error(body.error || resp.statusText) };
			}
		} catch (error) {
			return {
				error: error instanceof Error ? error : new Error("Unknown error"),
			};
		}
	}
}
