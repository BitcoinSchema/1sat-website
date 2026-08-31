import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { WalletError } from "@bsv/sdk";
import WalletWireCalls from "@bsv/sdk/wallet/substrates/WalletWireCalls";
import type { WalletPermissionsManager } from "@bsv/wallet-toolbox-client";
import { CWIBridge } from "../lib/cwi/bridge";
import {
	buildCWIRedirectUrl,
	CWI_REDIRECT_METHODS,
	decryptResultPayload,
	encryptResultPayload,
	isValidRedirectMethod,
	normalizeArgsAndHash,
} from "../lib/cwi/redirect-utils";
import { CWIRelay } from "../lib/cwi/relay";
import {
	CWI_STANDARD_METHODS,
	createSessionBase,
	createSessionEnvelope,
	isCWIStandardMethod,
	toCWIErrorFields,
} from "../lib/cwi/types";

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

describe("CWI BRC-100 ABI", () => {
	test("derives exactly the SDK's 28 standard wallet methods", () => {
		const sdkMethods = Object.keys(WalletWireCalls).filter(
			(key) =>
				typeof WalletWireCalls[key as keyof typeof WalletWireCalls] ===
				"number",
		);

		assert.deepEqual(CWI_STANDARD_METHODS, sdkMethods);
		assert.deepEqual(CWI_REDIRECT_METHODS, sdkMethods);
		assert.equal(CWI_STANDARD_METHODS.length, 28);
		assert.equal(isCWIStandardMethod("createAction"), true);
		assert.equal(isValidRedirectMethod("getBalance"), false);
	});

	test("normalizes numeric wallet errors and suppresses production stacks", () => {
		const error = new WalletError("insufficient funds", 7, "private stack");

		assert.deepEqual(toCWIErrorFields(error, true), {
			description: "insufficient funds",
			code: 7,
			stack: "private stack",
		});
		assert.deepEqual(toCWIErrorFields(error, false), {
			description: "insufficient funds",
			code: 7,
		});
		assert.equal(toCWIErrorFields({ code: 1.5 }, true).code, 1);
	});

	test("preserves BRC-100 bytes through redirect JSON encryption", () => {
		process.env.CWI_REDIRECT_SECRET = "cwi-abi-test-secret";
		const payload = {
			tx: new Uint8Array([0, 1, 254, 255]),
			nested: { ciphertext: new Uint8Array([9, 8, 7]) },
			opaque: { 0: "not", 1: "bytes" },
		};

		assert.deepEqual(decryptResultPayload(encryptResultPayload(payload)), {
			tx: [0, 1, 254, 255],
			nested: { ciphertext: [9, 8, 7] },
			opaque: { 0: "not", 1: "bytes" },
		});

		const typed = normalizeArgsAndHash({ data: new Uint8Array([3, 2, 1]) });
		const portable = normalizeArgsAndHash({ data: [3, 2, 1] });
		assert.deepEqual(typed.stableArgs, portable.stableArgs);
		assert.equal(typed.argsHash, portable.argsHash);
	});

	test("carries redirect error code and optional development stack", () => {
		mutableEnv.NODE_ENV = "development";
		const redirect = new URL(
			buildCWIRedirectUrl({
				redirectUri: "https://app.example/cwi",
				state: "state-1",
				error: "wallet_execution_failed",
				errorDescription: "insufficient funds",
				errorCode: 7,
				errorStack: "private stack",
			}),
		);

		assert.equal(redirect.searchParams.get("error_code"), "7");
		assert.equal(
			redirect.searchParams.get("error_description"),
			"insufficient funds",
		);
		assert.equal(redirect.searchParams.get("error_stack"), "private stack");

		mutableEnv.NODE_ENV = "production";
		const productionRedirect = new URL(
			buildCWIRedirectUrl({
				redirectUri: "https://app.example/cwi",
				state: "state-1",
				errorStack: "private stack",
			}),
		);
		assert.equal(productionRedirect.searchParams.has("error_stack"), false);
	});

	test("bridge rejects extensions and preserves structured-clone bytes", () => {
		const responses: unknown[] = [];
		const channelMessages: unknown[] = [];
		let sessionResets = 0;
		const parent = {
			postMessage: (message: unknown) =>
				responses.push(structuredClone(message)),
		};
		const previousWindow = globalThis.window;
		Object.defineProperty(globalThis, "window", {
			configurable: true,
			value: { parent },
		});

		try {
			const bridge = new CWIBridge({
				onStatusChange: () => undefined,
				onPermissionRequest: () => undefined,
				onSessionReset: () => {
					sessionResets += 1;
				},
			});
			const internals = bridge as unknown as {
				channel: {
					postMessage: (message: unknown) => void;
					close: () => void;
				};
				handleDAppMessage: (event: MessageEvent) => void;
				handleChannelMessage: (event: MessageEvent) => void;
			};
			internals.channel = {
				postMessage: (message) =>
					channelMessages.push(structuredClone(message)),
				close: () => undefined,
			};

			internals.handleDAppMessage({
				isTrusted: true,
				source: parent,
				origin: "https://app.example",
				data: {
					type: "CWI",
					isInvocation: true,
					id: "binary",
					call: "encrypt",
					args: { plaintext: new Uint8Array([0, 255]) },
				},
			} as unknown as MessageEvent);

			const opened = channelMessages.find(
				(message) => (message as { type?: string }).type === "cwi-session-open",
			) as {
				version: 3;
				sessionId: string;
				sessionToken: string;
				browserOrigin: string;
				originator: string;
			};
			internals.handleChannelMessage({
				data: { ...opened, type: "cwi-session-accept", leaderId: "leader" },
			} as MessageEvent);
			const forwarded = channelMessages.find(
				(message) => (message as { type?: string }).type === "cwi-request",
			) as { args: { plaintext: Uint8Array } } & typeof opened & {
					leaderId: string;
				};
			assert.deepEqual(Array.from(forwarded.args.plaintext), [0, 255]);

			internals.handleChannelMessage({
				data: {
					...forwarded,
					type: "cwi-response",
					args: undefined,
					call: undefined,
					id: "binary",
					status: "success",
					result: { ciphertext: new Uint8Array([255, 0]) },
				},
			} as MessageEvent);

			const success = responses[0] as {
				status: string;
				result: { ciphertext: Uint8Array };
			};
			assert.equal(success.status, "success");
			assert.deepEqual(Array.from(success.result.ciphertext), [255, 0]);

			internals.handleDAppMessage({
				isTrusted: true,
				source: parent,
				origin: "https://app.example",
				data: {
					type: "CWI",
					isInvocation: true,
					id: "leader-loss",
					call: "getVersion",
					args: {},
				},
			} as unknown as MessageEvent);
			internals.handleChannelMessage({
				data: { ...forwarded, type: "cwi-leader-lost" },
			} as MessageEvent);
			assert.match(
				(responses[1] as { description: string }).description,
				/retry the request/,
			);
			assert.equal((responses[1] as { code: number }).code, 1);
			assert.equal(sessionResets, 1);

			internals.handleDAppMessage({
				isTrusted: true,
				source: parent,
				origin: "https://app.example",
				data: {
					type: "CWI",
					isInvocation: true,
					id: "extension",
					call: "getBalance",
					args: {},
				},
			} as unknown as MessageEvent);
			assert.equal((responses[2] as { status: string }).status, "error");
			bridge.stop();
		} finally {
			Object.defineProperty(globalThis, "window", {
				configurable: true,
				value: previousWindow,
			});
		}
	});

	test("relay emits explicit success and production-safe wallet errors", async () => {
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

		Object.defineProperty(globalThis, "BroadcastChannel", {
			configurable: true,
			writable: true,
			value: FakeBroadcastChannel,
		});

		let encrypt = async (args: { plaintext: Uint8Array }) => ({
			ciphertext: args.plaintext,
		});
		const wallet = {
			encrypt: (args: { plaintext: Uint8Array }) => encrypt(args),
		} as unknown as WalletPermissionsManager;
		const relay = new CWIRelay({
			getWallet: () => wallet,
			getStatus: () => "unlocked",
		});
		relay.start();
		await new Promise((resolve) => setImmediate(resolve));
		const channel = FakeBroadcastChannel.current;
		const session = {
			sessionId: "session",
			sessionToken: "a".repeat(43),
			browserOrigin: "https://app.example",
			originator: "app.example",
		};
		channel.emit({ ...createSessionBase(session), type: "cwi-session-open" });
		const accepted = channel.sent.at(-1) as { leaderId: string };
		const request = (id: string) => ({
			...createSessionEnvelope({ ...session, leaderId: accepted.leaderId }),
			type: "cwi-request",
			id,
			call: "encrypt",
			args: { plaintext: new Uint8Array([4, 5, 6]) },
		});

		channel.emit(request("success"));
		await new Promise((resolve) => setImmediate(resolve));
		const success = channel.sent.at(-1) as {
			status: string;
			result: { ciphertext: Uint8Array };
		};
		assert.equal(success.status, "success");
		assert.deepEqual(Array.from(success.result.ciphertext), [4, 5, 6]);

		encrypt = async () => {
			throw new WalletError("insufficient funds", 7, "private stack");
		};
		mutableEnv.NODE_ENV = "development";
		channel.emit(request("development-error"));
		await new Promise((resolve) => setImmediate(resolve));
		assert.deepEqual(channel.sent.at(-1), {
			type: "cwi-response",
			id: "development-error",
			status: "error",
			description: "insufficient funds",
			code: 7,
			stack: "private stack",
			...createSessionEnvelope({ ...session, leaderId: accepted.leaderId }),
		});

		mutableEnv.NODE_ENV = "production";
		channel.emit(request("production-error"));
		await new Promise((resolve) => setImmediate(resolve));
		assert.equal(
			"stack" in (channel.sent.at(-1) as Record<string, unknown>),
			false,
		);
		relay.stop();
	});
});
