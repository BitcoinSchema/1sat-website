import type { JsonObject, JsonValue } from "@/lib/types/json";
import type { Origin } from "@/lib/types/ordinals";
import type { WalletServices } from "./TransactionParser";
import {
	type IndexData,
	Indexer,
	type IndexSummary,
	type ParseContext,
} from "./types";

/**
 * OriginIndexer identifies 1Sat ordinal outputs and tracks their origin chain.
 *
 * Basket: "1sat"
 * Tags: type:{mimeType}, origin:{outpoint}
 */
export class OriginIndexer extends Indexer {
	tag = "origin";
	name = "Origins";

	constructor(
		public owners = new Set<string>(),
		public network: "mainnet" | "testnet" = "mainnet",
		private walletServices?: WalletServices,
	) {
		super(owners, network);
	}

	async parse(ctx: ParseContext, vout: number): Promise<IndexData | undefined> {
		const txo = ctx.txos[vout];

		// Only parse 1-satoshi outputs
		if (txo.satoshis !== 1n) return;

		// Calculate the satoshi position for this output
		let outSat = 0n;
		for (let i = 0; i < vout; i++) {
			outSat += ctx.txos[i].satoshis;
		}

		// Start with empty origin
		const origin: Origin = {
			outpoint: "",
			nonce: 0,
			sigma: Array.isArray(txo.data.sigma?.data)
				? (txo.data.sigma.data as JsonValue[])
				: undefined,
		};

		// Track accumulated input satoshis to find which input contains our satoshi
		let satsIn = 0n;
		let sourceOutpoint: string | undefined;

		for (const spend of ctx.spends) {
			// Check if this input's satoshi range contains our output's satoshi
			if (satsIn === outSat && spend.satoshis === 1n) {
				// This input contains our satoshi - fetch its origin data from OrdFS
				sourceOutpoint = spend.outpoint.toString();
				break;
			}

			satsIn += spend.satoshis;

			// If we've passed our satoshi position, this is a new origin
			if (satsIn > outSat) {
				origin.outpoint = txo.outpoint.toString();
				break;
			}
		}

		// If we found a source input, fetch its metadata from OrdFS
		if (sourceOutpoint && this.walletServices?.getOrdfsMetadata) {
			const metadata = await this.walletServices.getOrdfsMetadata(
				sourceOutpoint,
				true,
			);
			if (metadata) {
				// Use origin and sequence from the source
				origin.outpoint = metadata.origin || sourceOutpoint;
				origin.nonce = metadata.sequence + 1;

				// Get inscription metadata from OrdFS
				if (metadata.contentType) {
					origin.insc = {
						file: {
							hash: "",
							size: 0,
							type: metadata.contentType,
							content: [],
						},
					};
				}

				// Use MAP data from source
				origin.map = metadata.map || {};
			} else {
				// OrdFS doesn't know about this outpoint - treat as new origin
				origin.outpoint = txo.outpoint.toString();
			}
		}

		// Merge MAP data from current output with inherited MAP data
		const inheritedMap = origin.map ?? {};
		const currentMap =
			typeof txo.data.map?.data === "object" &&
			txo.data.map.data !== null &&
			!Array.isArray(txo.data.map.data)
				? (txo.data.map.data as JsonObject)
				: {};
		origin.map = { ...inheritedMap, ...currentMap };

		// If current output has inscription, use it (overwrites inherited inscription)
		if (
			txo.data.insc?.data &&
			typeof txo.data.insc.data === "object" &&
			!Array.isArray(txo.data.insc.data)
		) {
			origin.insc = txo.data.insc.data as Origin["insc"];
		}

		// Clear large file content to save space
		if (origin.insc?.file?.size && origin.insc.file.size > 4096) {
			origin.insc.file.content = [];
		}

		const tags: string[] = [];
		if (txo.owner && this.owners.has(txo.owner)) {
			tags.push(`origin:${origin.outpoint || ""}`);
			if (origin.insc?.file?.type) {
				tags.push("type");
				tags.push(`type:${origin.insc.file.type}`);
			}
		}

		// Set basket for 1sat ordinals
		txo.basket = "1sat";

		return {
			data: origin,
			tags,
		};
	}

	async summerize(ctx: ParseContext): Promise<IndexSummary | undefined> {
		let balance = 0;
		let hasTag = false;
		let icon: string | undefined;
		let id = "";

		// Check inputs
		for (const spend of ctx.spends) {
			if (spend.data[this.tag]) {
				const origin = spend.data[this.tag].data as Origin;
				if (spend.owner && this.owners.has(spend.owner)) {
					hasTag = true;
					balance--;
					if (!icon && origin?.insc?.file?.type?.startsWith("image/")) {
						icon = origin?.outpoint;
						const nameValue = origin.map?.name;
						id = typeof nameValue === "string" ? nameValue : "";
					}
				}
			}
		}

		// Check outputs
		for (const txo of ctx.txos) {
			if (txo.data[this.tag]) {
				if (txo.owner && this.owners.has(txo.owner)) {
					hasTag = true;
					balance++;
					const origin = txo.data.origin?.data as Origin;
					if (!icon && origin?.insc?.file?.type?.startsWith("image/")) {
						icon = origin?.outpoint;
					}
				}
			}
		}

		if (hasTag) {
			return {
				id,
				amount: balance,
				icon,
			};
		}
	}
}
