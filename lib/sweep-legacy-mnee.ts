"use client";

/**
 * Sweep MNEE from legacy (pre-BRC-100) addresses to a P1SAT deposit address.
 *
 * Legacy wallets used raw pay/ord keys, so MNEE UTXOs at those addresses
 * can't be signed with BRC-29 derivations. This signs each input with the
 * matching raw legacy PrivateKey instead, then submits to the MNEE cosigner
 * API for the approver signature + broadcast. Ported from yours-wallet's
 * sweepLegacyMnee, extended to select the signing key per input owner.
 */
import type { MneeClient, MneeConfig, MneeUtxo } from "@1sat/client";
import {
	BigNumber,
	ECDSA,
	Hash,
	LockingScript,
	OP,
	type PrivateKey,
	PublicKey,
	Transaction,
	TransactionSignature,
	UnlockingScript,
	Utils,
} from "@bsv/sdk";

const MNEE_ATOMIC_MULTIPLIER = 100_000;

// ─── Cosign tx helpers (mirrored from @1sat/actions/mnee) ────

function cosignLock(
	userAddress: string,
	approverPubKey: PublicKey,
): LockingScript {
	const hash = Utils.fromBase58Check(userAddress);
	const pkhash = hash.data as number[];
	const script = new LockingScript();
	script
		.writeOpCode(OP.OP_DUP)
		.writeOpCode(OP.OP_HASH160)
		.writeBin(pkhash)
		.writeOpCode(OP.OP_EQUALVERIFY)
		.writeOpCode(OP.OP_CHECKSIGVERIFY)
		.writeBin(approverPubKey.encode(true) as number[])
		.writeOpCode(OP.OP_CHECKSIG);
	return script;
}

function applyInscription(
	lockingScript: LockingScript,
	inscription: { dataB64: string; contentType: string },
): LockingScript {
	const ordHex = Utils.toHex(Utils.toArray("ord", "utf8"));
	const fileHex = Utils.toHex(Utils.toArray(inscription.dataB64, "base64"));
	const mimeHex = Utils.toHex(Utils.toArray(inscription.contentType, "utf8"));
	const ordAsm = `OP_0 OP_IF ${ordHex} OP_1 ${mimeHex} OP_0 ${fileHex} OP_ENDIF`;
	return LockingScript.fromASM(`${ordAsm} ${lockingScript.toASM()}`);
}

function createInscriptionOutput(
	recipient: string,
	atomicAmount: number,
	config: MneeConfig,
): { lockingScript: LockingScript; satoshis: number } {
	const inscriptionData = {
		p: "bsv-20",
		op: "transfer",
		id: config.tokenId,
		amt: atomicAmount.toString(),
	};
	const dataB64 = Utils.toBase64(
		Utils.toArray(JSON.stringify(inscriptionData), "utf8"),
	);
	const cosignScript = cosignLock(
		recipient,
		PublicKey.fromString(config.approver),
	);
	return {
		lockingScript: applyInscription(cosignScript, {
			dataB64,
			contentType: "application/bsv-20",
		}),
		satoshis: 1,
	};
}

/** Sign a cosign input with a raw PrivateKey (legacy path — no BRC-29). */
function signCosignInputLegacy(
	tx: Transaction,
	inputIndex: number,
	privateKey: PrivateKey,
): string {
	const input = tx.inputs[inputIndex];
	const sourceLockingScript =
		input.sourceTransaction?.outputs[input.sourceOutputIndex]?.lockingScript;
	if (!sourceLockingScript) {
		throw new Error(`Missing source locking script for input ${inputIndex}`);
	}

	const sourceTXID = input.sourceTXID ?? input.sourceTransaction?.id("hex");
	if (!sourceTXID) {
		throw new Error(`Missing source TXID for input ${inputIndex}`);
	}

	const sourceSatoshis =
		input.sourceTransaction?.outputs[input.sourceOutputIndex]?.satoshis ?? 1;

	const scope =
		TransactionSignature.SIGHASH_ALL |
		TransactionSignature.SIGHASH_ANYONECANPAY |
		TransactionSignature.SIGHASH_FORKID;

	const preimage = TransactionSignature.format({
		sourceTXID,
		sourceOutputIndex: input.sourceOutputIndex,
		sourceSatoshis,
		transactionVersion: tx.version,
		otherInputs: tx.inputs
			.filter((_, idx) => idx !== inputIndex)
			.map((inp) => ({
				sourceTXID: inp.sourceTXID ?? inp.sourceTransaction?.id("hex") ?? "",
				sourceOutputIndex: inp.sourceOutputIndex,
				sequence: inp.sequence ?? 0xffffffff,
			})),
		inputIndex,
		outputs: tx.outputs,
		inputSequence: input.sequence ?? 0xffffffff,
		subscript: sourceLockingScript,
		lockTime: tx.lockTime,
		scope,
	});

	const sighash = Hash.sha256(Hash.sha256(preimage));
	const signature = ECDSA.sign(new BigNumber(sighash), privateKey, true);
	const sigDER = signature.toDER() as number[];
	const sigWithHashtype = [...sigDER, scope];
	const pubKeyBytes = privateKey.toPublicKey().encode(true) as number[];

	return new UnlockingScript()
		.writeBin(sigWithHashtype)
		.writeBin(pubKeyBytes)
		.toHex();
}

const utxoOwner = (utxo: MneeUtxo): string | undefined =>
	utxo.data.cosign?.address ?? utxo.owners[0];

// ─── Public API ──────────────────────────────────────────────

export interface SweepLegacyMneeParams {
	/** MneeClient instance (services.mnee) */
	mneeClient: MneeClient;
	/** Legacy private keys (pay / ord / identity) — signer chosen per input owner */
	legacyKeys: PrivateKey[];
	/** P1SAT deposit address of the BRC-100 wallet */
	destinationAddress: string;
	onProgress?: (message: string) => void;
}

export interface SweepLegacyMneeResult {
	txid?: string;
	ticketId?: string;
	/** Amount swept in MNEE (decimal) */
	amount?: number;
	error?: string;
}

/**
 * Total MNEE balance (decimal) across the given legacy addresses.
 * Returns 0 on lookup failure.
 */
export async function getLegacyMneeBalance(
	mneeClient: MneeClient,
	addresses: string[],
): Promise<number> {
	try {
		const balances = await mneeClient.getBalances(addresses);
		return (balances ?? []).reduce((sum, b) => sum + b.precised, 0);
	} catch (err) {
		console.error("[getLegacyMneeBalance]", err);
		return 0;
	}
}

/**
 * Sweep all MNEE from the legacy addresses to a P1SAT deposit address.
 */
export async function sweepLegacyMnee(
	params: SweepLegacyMneeParams,
): Promise<SweepLegacyMneeResult> {
	const { mneeClient, legacyKeys, destinationAddress, onProgress } = params;

	const keyByAddress = new Map<string, PrivateKey>();
	for (const key of legacyKeys) {
		keyByAddress.set(key.toPublicKey().toAddress(), key);
	}
	const legacyAddresses = [...keyByAddress.keys()];

	try {
		onProgress?.("Fetching MNEE configuration...");
		const config = await mneeClient.getConfig();
		if (!config?.approver) return { error: "Failed to get MNEE config" };

		onProgress?.("Scanning legacy addresses for MNEE...");
		const allUtxos = await mneeClient.getAllUtxos(legacyAddresses);
		if (!allUtxos?.length) {
			return { error: "No MNEE found at legacy addresses" };
		}

		let tokensIn = 0;
		for (const utxo of allUtxos) {
			tokensIn += utxo.data.bsv21?.amt ?? 0;
		}
		if (tokensIn <= 0) {
			return { error: "No MNEE token balance at legacy addresses" };
		}

		// Fee tier covers a single-recipient sweep of the whole balance
		const fee =
			config.fees.find((f) => tokensIn >= f.min && tokensIn <= f.max)?.fee ?? 0;
		const sweepAmount = tokensIn - fee;
		if (sweepAmount <= 0) {
			return { error: "MNEE balance too small to cover fees" };
		}

		onProgress?.("Building MNEE transaction...");
		const tx = new Transaction(1, [], [], 0);

		for (const utxo of allUtxos) {
			const rawHex = await mneeClient.fetchRawTx(utxo.txid);
			if (!rawHex) return { error: `Failed to fetch source tx: ${utxo.txid}` };

			tx.addInput({
				sourceTXID: utxo.txid,
				sourceOutputIndex: utxo.vout,
				sourceTransaction: Transaction.fromHex(rawHex),
				unlockingScript: new UnlockingScript(),
				sequence: 0xffffffff,
			});
		}

		tx.addOutput(
			createInscriptionOutput(destinationAddress, sweepAmount, config),
		);
		if (fee > 0) {
			tx.addOutput(createInscriptionOutput(config.feeAddress, fee, config));
		}

		onProgress?.("Signing MNEE transaction...");
		for (let i = 0; i < tx.inputs.length; i++) {
			const owner = utxoOwner(allUtxos[i]);
			const key = owner ? keyByAddress.get(owner) : undefined;
			if (!key) {
				return {
					error: `No legacy key for MNEE output ${allUtxos[i].outpoint} (owner: ${owner ?? "unknown"})`,
				};
			}
			tx.inputs[i].unlockingScript = UnlockingScript.fromHex(
				signCosignInputLegacy(tx, i, key),
			);
		}

		onProgress?.("Submitting to MNEE cosigner...");
		const submitResult = await mneeClient.submitRawTx(tx.toHex(), {
			broadcast: true,
		});
		if (!submitResult.ticketId) {
			return { error: "No ticket ID returned from MNEE" };
		}

		const ticketId = submitResult.ticketId;
		onProgress?.("Waiting for MNEE confirmation...");
		for (let attempt = 0; attempt < 30; attempt++) {
			await new Promise((r) => setTimeout(r, 2000));
			try {
				const status = await mneeClient.getTxStatus(ticketId);
				if (status.status === "FAILED") {
					return { ticketId, error: status.errors ?? "Transaction failed" };
				}
				if (status.status === "SUCCESS" || status.status === "MINED") {
					return {
						txid: status.tx_id,
						ticketId,
						amount: sweepAmount / MNEE_ATOMIC_MULTIPLIER,
					};
				}
			} catch {
				// transient poll error — keep trying
			}
		}

		return { ticketId, error: "Timed out waiting for MNEE confirmation" };
	} catch (err) {
		console.error("[sweepLegacyMnee]", err);
		return { error: err instanceof Error ? err.message : "Unknown error" };
	}
}
