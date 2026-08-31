import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import {
	BigNumber,
	Hash,
	Point,
	PrivateKey,
	ProtoWallet,
	PublicKey,
	Schnorr,
	Utils,
	WalletError,
	type WalletProtocol,
} from "@bsv/sdk";
import type { WalletPermissionsManager } from "@bsv/wallet-toolbox-client";
import { CWIRelay } from "../../lib/cwi/relay";
import {
	CWI_STANDARD_METHODS,
	type CWIChannelResponseMessage,
	type CWIChannelSessionAcceptMessage,
	createSessionBase,
	createSessionEnvelope,
	toCWIErrorFields,
} from "../../lib/cwi/types";
import { ACTION_METHODS } from "./wallet-action-corpus";
import {
	STANDARD_METHODS,
	STANDARD_PUBLIC_KEY_FIXTURES,
	STANDARD_VECTORS,
	type StandardMethod,
	type StandardVector,
	type StandardWallet,
	validateStandardArgs,
} from "./wallet-standard-corpus";

const BROWSER_ORIGIN = "https://sub.app.example:8443";
const ORIGIN = "sub.app.example";
const SESSION_TOKEN = "a".repeat(43);
const originalBroadcastChannel = globalThis.BroadcastChannel;
const originalNodeEnv = process.env.NODE_ENV;
const mutableEnv = process.env as Record<string, string | undefined>;

afterEach(() => {
	Object.defineProperty(globalThis, "BroadcastChannel", {
		configurable: true,
		writable: true,
		value: originalBroadcastChannel,
	});
	mutableEnv.NODE_ENV = originalNodeEnv;
});

interface RecordedCall {
	method: StandardMethod;
	args: object;
	originator?: string;
}

type TestOutcome =
	| { status: "success"; result: object }
	| { status: "error"; description: string; code: number };

class FakeBroadcastChannel {
	static current: FakeBroadcastChannel;
	readonly sent: unknown[] = [];
	private listener?: (event: MessageEvent) => void;

	constructor(_name: string) {
		FakeBroadcastChannel.current = this;
	}

	addEventListener(_type: string, listener: (event: MessageEvent) => void) {
		this.listener = listener;
	}

	removeEventListener() {
		this.listener = undefined;
	}

	postMessage(message: unknown) {
		this.sent.push(structuredClone(message));
	}

	close() {}

	emit(data: unknown) {
		this.listener?.({ data: structuredClone(data) } as MessageEvent);
	}
}

const recordingWallet = (
	vector: Pick<StandardVector, "method" | "result">,
	calls: RecordedCall[],
	error?: Error,
): StandardWallet =>
	new Proxy(
		{},
		{
			get: (_target, property) => {
				if (property !== vector.method) return undefined;
				return async (args: object, originator?: string) => {
					calls.push({
						method: vector.method,
						args: structuredClone(args),
						originator,
					});
					validateStandardArgs(vector.method, args);
					if (error) throw error;
					return structuredClone(vector.result);
				};
			},
		},
	) as StandardWallet;

const directInvoke = async (
	wallet: StandardWallet,
	vector: Pick<StandardVector, "method" | "args">,
): Promise<TestOutcome> => {
	try {
		const method = wallet[vector.method] as (
			args: object,
			originator?: string,
		) => Promise<object>;
		return {
			status: "success",
			result: await method(vector.args, ORIGIN),
		};
	} catch (error) {
		return { status: "error", ...toCWIErrorFields(error, false) };
	}
};

const relayInvoke = async (
	wallet: StandardWallet,
	vector: Pick<StandardVector, "id" | "method" | "args">,
): Promise<TestOutcome> => {
	Object.defineProperty(globalThis, "BroadcastChannel", {
		configurable: true,
		writable: true,
		value: FakeBroadcastChannel,
	});
	const relay = new CWIRelay({
		getWallet: () => wallet as unknown as WalletPermissionsManager,
		getStatus: () => "unlocked",
	});
	relay.start();
	const channel = FakeBroadcastChannel.current;
	const session = {
		sessionId: `session-${vector.id}`,
		sessionToken: SESSION_TOKEN,
		browserOrigin: BROWSER_ORIGIN,
		originator: ORIGIN,
	};
	channel.emit({
		...createSessionBase(session),
		type: "cwi-session-open",
	});
	await new Promise((resolve) => setImmediate(resolve));
	const accepted = channel.sent.findLast(
		(message): message is CWIChannelSessionAcceptMessage =>
			typeof message === "object" &&
			message !== null &&
			(message as { type?: unknown }).type === "cwi-session-accept",
	);
	assert.ok(accepted, `relay session accepted for ${vector.id}`);
	channel.emit({
		...createSessionEnvelope({ ...session, leaderId: accepted.leaderId }),
		type: "cwi-request",
		id: vector.id,
		call: vector.method,
		args: vector.args,
		originator: ORIGIN,
	});
	await new Promise((resolve) => setImmediate(resolve));
	const response = channel.sent.findLast(
		(message): message is CWIChannelResponseMessage =>
			typeof message === "object" &&
			message !== null &&
			(message as { type?: unknown }).type === "cwi-response",
	);
	relay.stop();
	assert.ok(response, `relay response for ${vector.id}`);
	assert.equal(response.browserOrigin, BROWSER_ORIGIN);
	assert.equal(response.originator, ORIGIN);
	assert.equal(response.sessionId, session.sessionId);
	return response.status === "success"
		? { status: "success", result: (response.result ?? {}) as object }
		: {
				status: "error",
				description: response.description,
				code: response.code,
			};
};

describe("remaining BRC-100 WalletInterface conformance corpus", () => {
	test("pins exactly 21 remaining SDK registry methods", () => {
		const actionMethods = new Set<string>(ACTION_METHODS);
		const remainingRegistry = CWI_STANDARD_METHODS.filter(
			(method) => !actionMethods.has(method),
		);
		assert.deepEqual(remainingRegistry, STANDARD_METHODS);
		assert.equal(STANDARD_VECTORS.length, 21);
		assert.deepEqual(
			STANDARD_VECTORS.map(({ method }) => method),
			STANDARD_METHODS,
		);
		assert.equal(new Set(STANDARD_METHODS).size, 21);
		const registry = new Set<string>(CWI_STANDARD_METHODS);
		for (const nonstandard of ["getBalance", "connect", "pay"]) {
			assert.equal(registry.has(nonstandard), false);
		}
		for (const publicKey of Object.values(STANDARD_PUBLIC_KEY_FIXTURES)) {
			assert.equal(PublicKey.fromString(publicKey).toString(), publicKey);
		}
	});

	test("preserves all 21 public request/result shapes through direct and relay adapters", async () => {
		mutableEnv.NODE_ENV = "production";

		for (const vector of STANDARD_VECTORS) {
			const directCalls: RecordedCall[] = [];
			const direct = await directInvoke(
				recordingWallet(vector, directCalls),
				vector,
			);
			assert.deepEqual(direct, {
				status: "success",
				result: vector.result,
			});
			assert.deepEqual(directCalls, [
				{ method: vector.method, args: vector.args, originator: ORIGIN },
			]);

			const relayCalls: RecordedCall[] = [];
			const relayed = await relayInvoke(
				recordingWallet(vector, relayCalls),
				vector,
			);
			assert.deepEqual(relayed, direct, vector.id);
			assert.deepEqual(relayCalls, directCalls, `${vector.id} forwarding`);
		}
	});

	test("preserves validator, denial, and unexpected failures", async () => {
		mutableEnv.NODE_ENV = "production";
		const acquire = STANDARD_VECTORS.find(
			(vector) => vector.method === "acquireCertificate",
		);
		const baseline = STANDARD_VECTORS[0];
		assert.ok(acquire);

		const invalid = {
			...acquire,
			id: "invalid-direct-certificate",
			args: {
				type: "not-base64",
				certifier: "bad-key",
				acquisitionProtocol: "direct",
				fields: {},
			},
		};
		const invalidDirect = await directInvoke(
			recordingWallet(invalid, []),
			invalid,
		);
		const invalidRelay = await relayInvoke(
			recordingWallet(invalid, []),
			invalid,
		);
		assert.deepEqual(invalidRelay, invalidDirect);
		assert.equal(invalidDirect.status, "error");
		assert.equal(invalidDirect.code, 6);

		for (const [id, error, code] of [
			["denied", new WalletError("Permission denied by user", 3), 3],
			["unexpected", new Error("unexpected adapter failure"), 1],
		] as const) {
			const failure = { ...baseline, id };
			const direct = await directInvoke(
				recordingWallet(failure, [], error),
				failure,
			);
			const relay = await relayInvoke(
				recordingWallet(failure, [], error),
				failure,
			);
			assert.deepEqual(relay, direct, id);
			assert.equal(direct.status, "error");
			assert.equal(direct.code, code);
		}
	});

	test("executes installed BRC-2, BRC-3, BRC-42, BRC-56, BRC-69, BRC-72, BRC-94, and BRC-97 primitives", async () => {
		const alicePrivateKey = PrivateKey.fromHex("01".repeat(32));
		const bobPrivateKey = PrivateKey.fromHex("02".repeat(32));
		const verifierPrivateKey = PrivateKey.fromHex("03".repeat(32));
		const alice = new ProtoWallet(alicePrivateKey);
		const bob = new ProtoWallet(bobPrivateKey);
		const verifier = new ProtoWallet(verifierPrivateKey);
		const aliceKey = (await alice.getPublicKey({ identityKey: true }))
			.publicKey;
		const bobKey = (await bob.getPublicKey({ identityKey: true })).publicKey;
		const verifierKey = (await verifier.getPublicKey({ identityKey: true }))
			.publicKey;
		const protocolID: WalletProtocol = [2, "conformance primitives"];
		const keyID = "fixture-1";
		const plaintext = [0, 1, 127, 128, 254, 255];
		const derivedCounterpartyKey = await alice.getPublicKey({
			protocolID,
			keyID,
			counterparty: bobKey,
		});
		assert.deepEqual(
			derivedCounterpartyKey,
			await bob.getPublicKey({
				protocolID,
				keyID,
				counterparty: aliceKey,
				forSelf: true,
			}),
		);
		assert.notEqual(derivedCounterpartyKey.publicKey, bobKey);

		const { ciphertext } = await alice.encrypt({
			protocolID,
			keyID,
			counterparty: bobKey,
			plaintext,
		});
		assert.ok(ciphertext.length > plaintext.length);
		assert.deepEqual(
			await bob.decrypt({
				protocolID,
				keyID,
				counterparty: aliceKey,
				ciphertext,
			}),
			{ plaintext },
		);

		const data = [255, 0, 128, 1];
		const { hmac } = await alice.createHmac({ protocolID, keyID, data });
		assert.deepEqual(
			await alice.verifyHmac({ protocolID, keyID, data, hmac }),
			{ valid: true },
		);

		const { signature } = await alice.createSignature({
			protocolID,
			keyID,
			counterparty: bobKey,
			data,
		});
		assert.deepEqual(
			await bob.verifySignature({
				protocolID,
				keyID,
				counterparty: aliceKey,
				data,
				signature,
			}),
			{ valid: true },
		);

		const counterpartyLinkage = await alice.revealCounterpartyKeyLinkage({
			counterparty: bobKey,
			verifier: verifierKey,
		});
		assert.equal(counterpartyLinkage.prover, aliceKey);
		assert.equal(counterpartyLinkage.verifier, verifierKey);
		const linkageProtocol: WalletProtocol = [
			2,
			"counterparty linkage revelation",
		];
		const { plaintext: counterpartySecret } = await verifier.decrypt({
			ciphertext: counterpartyLinkage.encryptedLinkage,
			protocolID: linkageProtocol,
			keyID: counterpartyLinkage.revelationTime,
			counterparty: aliceKey,
		});
		const expectedCounterpartySecret = alicePrivateKey
			.deriveSharedSecret(bobPrivateKey.toPublicKey())
			.encode(true);
		assert.deepEqual(counterpartySecret, expectedCounterpartySecret);
		const { plaintext: counterpartyProof } = await verifier.decrypt({
			ciphertext: counterpartyLinkage.encryptedLinkageProof,
			protocolID: linkageProtocol,
			keyID: counterpartyLinkage.revelationTime,
			counterparty: aliceKey,
		});
		assert.ok(counterpartyProof.length > 66);
		assert.equal(
			new Schnorr().verifyProof(
				alicePrivateKey.toPublicKey(),
				bobPrivateKey.toPublicKey(),
				Point.fromDER(counterpartySecret),
				{
					R: Point.fromDER(counterpartyProof.slice(0, 33)),
					SPrime: Point.fromDER(counterpartyProof.slice(33, 66)),
					z: new BigNumber(counterpartyProof.slice(66)),
				},
			),
			true,
		);

		const specificLinkage = await alice.revealSpecificKeyLinkage({
			counterparty: bobKey,
			verifier: verifierKey,
			protocolID,
			keyID,
		});
		const specificProtocol: WalletProtocol = [
			2,
			`specific linkage revelation ${protocolID[0]} ${protocolID[1]}`,
		];
		const { plaintext: specificSecret } = await verifier.decrypt({
			ciphertext: specificLinkage.encryptedLinkage,
			protocolID: specificProtocol,
			keyID,
			counterparty: aliceKey,
		});
		const expectedSpecificSecret = Hash.sha256hmac(
			expectedCounterpartySecret,
			Utils.toArray(`${protocolID[0]}-${protocolID[1]}-${keyID}`, "utf8"),
		);
		assert.deepEqual(specificSecret, expectedSpecificSecret);
		const { plaintext: specificProof } = await verifier.decrypt({
			ciphertext: specificLinkage.encryptedLinkageProof,
			protocolID: specificProtocol,
			keyID,
			counterparty: aliceKey,
		});
		assert.equal(specificLinkage.proofType, 0);
		assert.deepEqual(specificProof, [0]);
		assert.deepEqual(specificLinkage.protocolID, protocolID);
	});
});
