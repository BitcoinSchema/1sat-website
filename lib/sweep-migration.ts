"use client";

import {
	createContext,
	type SweepBsv21Input,
	type SweepInput,
	type SweepOrdinalInput,
	sweepBsv,
	sweepBsv21,
	sweepOrdinals,
} from "@1sat/actions";
import type { OneSatServices } from "@1sat/wallet-browser";
import type { WalletInterface } from "@bsv/sdk";
import type { WalletOrdinal } from "@/lib/types/ordinals";
import { GorillaPoolService } from "@/lib/wallet/gorillapool-service";

export interface MigrationSweepParams {
	wallet: WalletInterface;
	services: OneSatServices;
	legacyPayWif: string;
	legacyOrdWif: string;
	legacyPayAddress: string;
	legacyOrdAddress: string;
	onProgress: (stage: string) => void;
	// Pre-scanned assets (if all three provided, skip scanning)
	fundingUtxos?: WalletOrdinal[];
	ordinalUtxos?: WalletOrdinal[];
	bsv21Utxos?: WalletOrdinal[];
}

interface CategorizedUtxos {
	ordinals: WalletOrdinal[];
	bsv20Tokens: WalletOrdinal[];
	bsv21Tokens: WalletOrdinal[];
	funding: WalletOrdinal[];
}

async function scanLegacyAddresses(
	params: MigrationSweepParams,
): Promise<CategorizedUtxos> {
	const { legacyPayAddress, legacyOrdAddress, onProgress } = params;
	const gp = new GorillaPoolService();

	onProgress("Scanning legacy addresses...");
	const addresses = [legacyOrdAddress];
	if (legacyPayAddress !== legacyOrdAddress) {
		addresses.push(legacyPayAddress);
	}

	const allUtxoResults = await Promise.all(
		addresses.map((addr) => gp.getCategorizedUtxos(addr)),
	);

	return {
		ordinals: allUtxoResults.flatMap((r) => r.ordinals),
		bsv20Tokens: allUtxoResults.flatMap((r) => r.bsv20Tokens),
		bsv21Tokens: allUtxoResults.flatMap((r) => r.bsv21Tokens),
		funding: allUtxoResults.flatMap((r) => r.funding),
	};
}

export interface SweepResult {
	bsvTxid?: string;
	ordinalTxids: string[];
	bsv21Txids: string[];
	errors: string[];
}

export async function executeMigrationSweep(
	params: MigrationSweepParams,
): Promise<SweepResult> {
	const {
		wallet,
		services,
		legacyPayWif,
		legacyOrdWif,
		legacyPayAddress,
		onProgress,
	} = params;

	const result: SweepResult = {
		ordinalTxids: [],
		bsv21Txids: [],
		errors: [],
	};

	const ctx = createContext(wallet, { services, chain: "main" });

	// 1. Use pre-scanned assets if all provided, otherwise scan
	const merged: CategorizedUtxos =
		params.fundingUtxos && params.ordinalUtxos && params.bsv21Utxos
			? {
					ordinals: params.ordinalUtxos,
					bsv20Tokens: [] as WalletOrdinal[],
					bsv21Tokens: params.bsv21Utxos,
					funding: params.fundingUtxos,
				}
			: await scanLegacyAddresses(params);

	const totalAssets =
		merged.ordinals.length + merged.bsv21Tokens.length + merged.funding.length;

	if (totalAssets === 0) {
		onProgress("No assets found at legacy addresses");
		return result;
	}

	// 2. Sweep BSV funding UTXOs
	if (merged.funding.length > 0) {
		onProgress(`Sweeping ${merged.funding.length} BSV UTXOs...`);
		try {
			const fundingInputs: SweepInput[] = merged.funding.map((u) => ({
				outpoint: u.outpoint,
				satoshis: u.satoshis,
				lockingScript: u.script,
			}));

			const bsvResult = await sweepBsv.execute(ctx, {
				inputs: fundingInputs,
				wif: legacyPayWif,
			});

			if (bsvResult.error) {
				result.errors.push(`BSV sweep: ${bsvResult.error}`);
			} else if (bsvResult.txid) {
				result.bsvTxid = bsvResult.txid;
			}
		} catch (error) {
			result.errors.push(
				`BSV sweep: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	// 3. Sweep ordinals
	if (merged.ordinals.length > 0) {
		onProgress(`Sweeping ${merged.ordinals.length} ordinals...`);
		try {
			const ordinalInputs: SweepOrdinalInput[] = merged.ordinals.map((u) => ({
				outpoint: u.outpoint,
				satoshis: u.satoshis,
				lockingScript: u.script,
				contentType: u.origin?.data?.insc?.file?.type,
				origin: u.origin?.outpoint,
				name: u.origin?.map?.name as string | undefined,
			}));

			// Determine which WIF controls each ordinal based on owner address
			const ordWif =
				merged.ordinals[0].owner === legacyPayAddress
					? legacyPayWif
					: legacyOrdWif;

			const ordResult = await sweepOrdinals.execute(ctx, {
				inputs: ordinalInputs,
				wif: ordWif,
			});

			if (ordResult.error) {
				result.errors.push(`Ordinal sweep: ${ordResult.error}`);
			} else if (ordResult.txid) {
				result.ordinalTxids.push(ordResult.txid);
			}
		} catch (error) {
			result.errors.push(
				`Ordinal sweep: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	// 4. Sweep BSV-21 tokens (grouped by tokenId)
	if (merged.bsv21Tokens.length > 0) {
		const tokenGroups = new Map<string, typeof merged.bsv21Tokens>();
		for (const token of merged.bsv21Tokens) {
			const tokenId =
				token.origin?.data?.bsv21?.id ?? token.data?.bsv21?.id ?? "";
			if (!tokenId) continue;
			const group = tokenGroups.get(tokenId) ?? [];
			group.push(token);
			tokenGroups.set(tokenId, group);
		}

		for (const [tokenId, tokens] of tokenGroups) {
			onProgress(
				`Sweeping ${tokens.length} tokens (${tokenId.slice(0, 8)}...)...`,
			);
			try {
				const tokenInputs: SweepBsv21Input[] = tokens.map((u) => ({
					outpoint: u.outpoint,
					satoshis: u.satoshis,
					lockingScript: u.script,
					tokenId,
					amount: u.data?.bsv21?.amt ?? u.origin?.data?.bsv21?.amt ?? "0",
				}));

				const tokenWif =
					tokens[0].owner === legacyPayAddress ? legacyPayWif : legacyOrdWif;

				const tokenResult = await sweepBsv21.execute(ctx, {
					inputs: tokenInputs,
					wif: tokenWif,
				});

				if (tokenResult.error) {
					result.errors.push(
						`BSV-21 sweep (${tokenId.slice(0, 8)}): ${tokenResult.error}`,
					);
				} else if (tokenResult.txid) {
					result.bsv21Txids.push(tokenResult.txid);
				}
			} catch (error) {
				result.errors.push(
					`BSV-21 sweep (${tokenId.slice(0, 8)}): ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}
	}

	onProgress("Migration sweep complete");
	return result;
}
