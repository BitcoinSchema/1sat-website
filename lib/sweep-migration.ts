"use client";

import {
	createContext,
	prepareSweepInputs,
	sweepBsv,
	sweepBsv21,
	sweepOrdinals,
	type TokenBalance,
} from "@1sat/actions";
import type { IndexedOutput } from "@1sat/types";
import type { OneSatServices } from "@1sat/wallet-browser";
import { PrivateKey, type WalletInterface } from "@bsv/sdk";

export interface SweepResult {
	bsvTxid?: string;
	ordinalTxids: string[];
	bsv21Txids: string[];
	errors: string[];
}

export interface MigrationSweepParams {
	wallet: WalletInterface;
	services: OneSatServices;
	chain?: "main" | "test";
	legacyPayWif: string;
	legacyOrdWif: string;
	legacyIdentityWif?: string;
	onProgress: (stage: string) => void;
	funding: IndexedOutput[];
	ordinals: IndexedOutput[];
	bsv21Tokens: TokenBalance[];
}

const getOwner = (output: IndexedOutput): string | undefined =>
	output.events?.find((e) => e.startsWith("own:"))?.slice(4);

// Resolve the signing key for each output from its own: event. A missing
// key is a hard error BEFORE building the tx — signing with the wrong key
// used to fail the whole sweep with no diagnostic.
const buildKeys = (
	outputs: IndexedOutput[],
	keyMap: Map<string, PrivateKey>,
): PrivateKey[] =>
	outputs.map((output) => {
		const owner = getOwner(output);
		const key = owner ? keyMap.get(owner) : undefined;
		if (!key) {
			throw new Error(
				`No key for output ${output.outpoint} (owner: ${owner ?? "unknown"})`,
			);
		}
		return key;
	});

/**
 * Sweep legacy assets into the BRC-100 wallet. Mirrors the yours-wallet /
 * @1sat/sweep-ui sweeper: BEEF-derived locking scripts via
 * prepareSweepInputs, per-output key resolution from own: events, and
 * per-token overlay-validated BSV-21 amounts.
 */
export async function executeMigrationSweep(
	params: MigrationSweepParams,
): Promise<SweepResult> {
	const {
		wallet,
		services,
		chain = "main",
		legacyPayWif,
		legacyOrdWif,
		legacyIdentityWif,
		onProgress,
		funding,
		ordinals,
		bsv21Tokens,
	} = params;

	const ctx = createContext(wallet, { services, chain });

	const keyMap = new Map<string, PrivateKey>();
	for (const wif of [legacyPayWif, legacyOrdWif, legacyIdentityWif]) {
		if (!wif) continue;
		try {
			const key = PrivateKey.fromWif(wif);
			keyMap.set(key.toPublicKey().toAddress(), key);
		} catch {
			// skip malformed keys; buildKeys errors identify affected outputs
		}
	}

	const result: SweepResult = {
		ordinalTxids: [],
		bsv21Txids: [],
		errors: [],
	};

	const totalAssets =
		funding.length +
		ordinals.length +
		bsv21Tokens.reduce((sum, t) => sum + t.outputs.length, 0);
	if (totalAssets === 0) {
		onProgress("No assets found at legacy addresses");
		return result;
	}

	// 1. BSV funding
	if (funding.length > 0) {
		onProgress(`Sweeping ${funding.length} BSV UTXOs...`);
		try {
			const inputs = await prepareSweepInputs(ctx, funding);
			const bsvResult = await sweepBsv.execute(ctx, {
				inputs,
				keys: buildKeys(funding, keyMap),
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

	// 2. Ordinals (listed ordinals are swept via OrdLock cancel inside the
	// action; BSV-20 content is refused by the action's guard)
	if (ordinals.length > 0) {
		onProgress(`Sweeping ${ordinals.length} ordinals...`);
		try {
			const inputs = await prepareSweepInputs(ctx, ordinals);
			const ordResult = await sweepOrdinals.execute(ctx, {
				inputs,
				keys: buildKeys(ordinals, keyMap),
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

	// 3. BSV-21 tokens — one tx per token, amounts from the overlay-validated
	// map (never the origin mint amount), inactive tokens skipped
	for (const token of bsv21Tokens) {
		const label = token.symbol ?? token.tokenId.slice(0, 8);
		if (!token.isActive) {
			result.errors.push(`Token ${label}: not active on the overlay — skipped`);
			continue;
		}
		if (token.outputs.length === 0) continue;
		onProgress(`Sweeping ${label} (${token.outputs.length} outputs)...`);
		try {
			const sweepInputs = await prepareSweepInputs(ctx, token.outputs);
			const sweepInputMap = new Map(sweepInputs.map((s) => [s.outpoint, s]));

			const inputs = token.outputs.map((out) => {
				const base = sweepInputMap.get(out.outpoint);
				if (!base) {
					throw new Error(`Missing sweep input for ${out.outpoint}`);
				}
				return {
					...base,
					tokenId: token.tokenId,
					amount: token.amounts.get(out.outpoint) ?? "0",
				};
			});

			const tokenResult = await sweepBsv21.execute(ctx, {
				inputs,
				keys: buildKeys(token.outputs, keyMap),
			});
			if (tokenResult.error) {
				result.errors.push(`Token ${label}: ${tokenResult.error}`);
			} else if (tokenResult.txid) {
				result.bsv21Txids.push(tokenResult.txid);
			}
		} catch (error) {
			result.errors.push(
				`Token ${label}: ${error instanceof Error ? error.message : String(error)}`,
			);
		}
	}

	onProgress("Sweep complete");
	return result;
}
