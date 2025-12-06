"use client";

import {
	PrivateKey,
	Script,
	Transaction,
	P2PKH,
	Utils,
} from "@bsv/sdk";
import { SATS_PER_BYTE, SATS_PER_KB } from "@/constants";
import { encryptionKey, ordPk, payPk, utxos } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import {
	type BridgeEnvelope,
	type BridgeMethod,
	type BridgeResponseEnvelope,
	type BridgeRequestEnvelope,
	type FundTxParams,
	type FundTxResult,
	type LegacyBridgeEnvelope,
	type BridgeStatus,
	type BridgeErrorCode,
} from "@/types/bridge";
import { encryptData, decryptData } from "@/utils/encryption";
import { notifyIndexer } from "@/utils/indexer";
import { oneSatBroadcaster } from "js-1sat-ord";
import { bridgePrompt, bridgeResolver } from "@/signals/wallet/bridge";
import { getAuthToken } from "bitcoin-auth";

type PendingEvent = {
	source: MessageEventSource | null;
	origin: string;
};

const BRIDGE_VERSION = "1sat-bridge@1";
const legacyTypes = new Set([
	"CHECK_READY",
	"READY",
	"MIGRATE_KEYS",
	"ALREADY_LOGGED_IN",
]);

const allowedOrigins: string[] = ["*", "https://1sat.market", "https://1satordinals.com"];

const respond = (
	pending: PendingEvent,
	envelope: BridgeResponseEnvelope,
) => {
	if (!pending.source) return;
	if ("postMessage" in pending.source) {
		const target = pending.origin || "*";
		if (pending.source instanceof MessagePort || pending.source instanceof ServiceWorker) {
			pending.source.postMessage(envelope);
		} else {
			(pending.source as Window).postMessage(envelope, target);
		}
	}
};

const errorEnvelope = (
	id: string,
	message: string,
	code: BridgeErrorCode,
	details?: Record<string, unknown>,
): BridgeResponseEnvelope => ({
	id,
	version: BRIDGE_VERSION,
	ok: false,
	error: { code, message, details },
});

const buildStatus = (): BridgeStatus => ({
	locked: !payPk.value || !ordPk.value,
	hasKeys: !!payPk.value && !!ordPk.value,
	network: "main",
	features: [
		"wallet.status",
		"wallet.connect",
		"wallet.signMessage",
		"wallet.signTx",
		"wallet.fundTx",
		"wallet.encrypt",
		"wallet.decrypt",
		"wallet.bapAlias",
	],
	addresses: {
		pay: fundingAddress.value?.toString(),
		ord: ordAddress.value?.toString(),
	},
});

const estimateFee = (inputs: number, outputs: number, extraScriptBytes = 0) => {
	const base = 10;
	const inputSize = 148;
	const outputBase = 9; // value(8) + script length varint(1) approx
	const size = base + inputs * inputSize + outputs * outputBase + extraScriptBytes;
	return Math.ceil((size * SATS_PER_BYTE) || (size * SATS_PER_KB) / 1000);
};

const requestApproval = (payload: {
	id: string;
	method: BridgeMethod;
	origin: string;
	intent?: string;
	meta?: Record<string, unknown>;
}) =>
	new Promise<boolean>((resolve) => {
		bridgePrompt.value = {
			id: payload.id,
			method: payload.method,
			origin: payload.origin,
			intent: payload.intent,
			meta: payload.meta,
		};
		bridgeResolver.value = (ok: boolean) => {
			resolve(ok);
		};
	});

const selectUtxos = (need: number) => {
	const available = utxos.value || [];
	let total = 0;
	const picked: typeof available = [];
	for (const u of available.sort((a, b) => b.satoshis - a.satoshis)) {
		picked.push(u);
		total += u.satoshis;
		if (total >= need) break;
	}
	return { picked, total };
};

const ensureBapAliasShape = (rawtx: string) => {
	const tx = Transaction.fromHex(rawtx);
	const opReturn = tx.outputs.find(
		(o) => o.lockingScript?.toASM().startsWith("OP_0 OP_RETURN") || o.lockingScript?.toASM().startsWith("OP_RETURN"),
	);
	if (!opReturn) {
		throw new Error("BAP alias intent missing OP_RETURN output");
	}
};

const fundTx = async (params: FundTxParams): Promise<FundTxResult> => {
	if (!payPk.value) {
		throw new Error("Wallet locked");
	}
	if (!fundingAddress.value) {
		throw new Error("Funding address unavailable");
	}

	const base = Transaction.fromHex(params.rawtx);
	const tx = new Transaction();

	base.inputs.forEach((i) => tx.addInput(i));
	base.outputs.forEach((o) => tx.addOutput(o));

	const outputScriptBytes = base.outputs.reduce(
		(acc, o) => acc + (o.lockingScript?.toBinary().length || 0) + 1 + 8,
		0,
	);

	const target = base.outputs.reduce(
		(acc, o) => acc + (o.satoshis || 0),
		0,
	);

	const inputsSoFar = base.inputs.length;
	const feeGuess = estimateFee(inputsSoFar + 1, base.outputs.length + 1, outputScriptBytes + 25);
	const { picked, total } = selectUtxos(target + feeGuess);
	const changeBudget = total - target - feeGuess;
	if (!picked.length || changeBudget < 0) {
		throw new Error("Insufficient balance to fund transaction");
	}

	const payKey = PrivateKey.fromWif(payPk.value);
	const p2pkh = new P2PKH();
	picked.forEach((u) => {
		const lockingScript = Script.fromHex(u.script);
		const template = p2pkh.unlock(payKey, "all", false, u.satoshis, lockingScript);
		tx.addInput({
			sourceTXID: u.txid,
			sourceOutputIndex: u.vout,
			unlockingScriptTemplate: template,
		});
	});

	const change = total - target - feeGuess;
	if (change > 0) {
		tx.addOutput({
			satoshis: change,
			lockingScript: p2pkh.lock(fundingAddress.value.toString()),
			change: true,
		});
	}

	await tx.sign();

	const rawtx = tx.toHex();
	const full = Transaction.fromHex(rawtx);
	let feeSats = 0;
	try {
		feeSats = Number(full.getFee());
	} catch (_err) {
		feeSats = Math.ceil(full.toBinary().length * SATS_PER_BYTE);
	}
	const size = full.toBinary().length;

	if (params.broadcast) {
		const { txid, status } = await full.broadcast(oneSatBroadcaster());
		if (status !== "success") {
			throw new Error("Broadcast failed");
		}
		notifyIndexer(txid);
		return { rawtx, txid, size, feeSats, broadcast: true };
	}

	return { rawtx, txid: full.id("hex"), size, feeSats, broadcast: false };
};

const handleEncrypt = async (data: string) => {
	if (!encryptionKey.value) throw new Error("Wallet not unlocked for encryption");
	const iv = crypto.getRandomValues(new Uint8Array(16));
	const encrypted = await encryptData(
		new Uint8Array(Buffer.from(data, "utf-8")),
		encryptionKey.value,
		iv,
	);
	const payload = Buffer.concat([Buffer.from(iv), Buffer.from(encrypted)]).toString(
		"base64",
	);
	return payload;
};

const handleDecrypt = async (cipher: string) => {
	if (!encryptionKey.value) throw new Error("Wallet not unlocked for decryption");
	const buf = Buffer.from(cipher, "base64");
	const decrypted = await decryptData(new Uint8Array(buf), encryptionKey.value);
	return Buffer.from(decrypted).toString("utf-8");
};

const handleSignMessage = async (message: string) => {
	if (!ordPk.value) throw new Error("Wallet locked");
	const decodedMessage = Utils.toUTF8(Utils.toArray(message, "base64"));
	const [requestPath, timestamp] = decodedMessage.split("|");
	const authToken = getAuthToken({
		privateKeyWif: ordPk.value,
		requestPath,
		timestamp,
		scheme: "bsm",
	});
	return { authToken };
};

const route = async (
	envelope: BridgeEnvelope,
	_event: MessageEvent,
	pending: PendingEvent,
) => {
	if ("type" in envelope && legacyTypes.has(envelope.type)) {
		// legacy passthrough (migration)
		respond(pending, {
			id: envelope.type,
			version: BRIDGE_VERSION,
			ok: true,
			result: envelope.payload ?? {},
		});
		return;
	}

	if (!("method" in envelope)) return;
	const { id, method, params, intent, meta } = envelope as BridgeRequestEnvelope;

	try {
		let result: unknown;
		switch (method as BridgeMethod) {
			case "wallet.status":
			case "wallet.connect":
				result = buildStatus();
				break;
			case "wallet.signMessage": {
				const approved = await requestApproval({
					id,
					method: method as BridgeMethod,
					origin: pending.origin,
					intent,
					meta,
				});
				if (!approved) {
					throw new Error("User rejected request");
				}
				result = await handleSignMessage((params as { message: string }).message);
				break;
			}
			case "wallet.signTx":
				throw new Error("wallet.signTx not yet supported in bridge");
			case "wallet.fundTx":
			case "wallet.bapAlias": {
				const approved = await requestApproval({
					id,
					method: method as BridgeMethod,
					origin: pending.origin,
					intent,
					meta,
				});
				if (!approved) {
					throw new Error("User rejected request");
				}
				if (method === "wallet.bapAlias") {
					ensureBapAliasShape((params as FundTxParams).rawtx);
				}
				result = await fundTx(params as FundTxParams);
				break;
			}
			case "wallet.encrypt":
			case "wallet.decrypt": {
				const approved = await requestApproval({
					id,
					method: method as BridgeMethod,
					origin: pending.origin,
					intent,
					meta,
				});
				if (!approved) {
					throw new Error("User rejected request");
				}
				if (method === "wallet.encrypt") {
					result = await handleEncrypt((params as { data: string }).data);
				} else {
					result = await handleDecrypt((params as { data: string }).data);
				}
				break;
			}
			default:
				throw new Error(`Unsupported method ${method}`);
		}
		respond(pending, {
			id,
			version: BRIDGE_VERSION,
			ok: true,
			result,
		});
	} catch (err) {
		const message =
			err instanceof Error ? err.message : "Unknown bridge error";
		respond(
			pending,
			errorEnvelope(id, message, "bridge_error", {
				method,
			}),
		);
	}
};

export const initWalletBridge = () => {
	if (typeof window === "undefined") return;
	if ((window as any).__1satBridgeReady) return;

	const handler = (event: MessageEvent) => {
		const origin = event.origin || "*";
		if (!allowedOrigins.includes("*") && !allowedOrigins.includes(origin)) {
			return;
		}
		const data = event.data as BridgeEnvelope;
		if (!data || !("version" in data || "type" in data)) return;
		const pending: PendingEvent = { source: event.source, origin };
		route(data, event, pending);
	};

	window.addEventListener("message", handler);
	(window as any).__1satBridgeReady = true;
};

