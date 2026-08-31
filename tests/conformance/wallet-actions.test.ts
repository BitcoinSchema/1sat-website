import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import { Validation, WalletError } from "@bsv/sdk";
import {
	applyBrc153ReferenceLabel,
	getListOutputsSpecOp,
	makeBrc114ActionTimeLabel,
	makeBrc153ReferenceLabel,
	parseBrc114ActionTimeLabels,
	parseBrc153ReferenceLabel,
	sdk,
	Wallet,
	type WalletPermissionsManager,
} from "@bsv/wallet-toolbox-client";
import { CWIRelay } from "../../lib/cwi/relay";
import {
	type CWIChannelResponseMessage,
	type CWIChannelSessionAcceptMessage,
	createSessionBase,
	createSessionEnvelope,
	toCWIErrorFields,
} from "../../lib/cwi/types";
import {
	ACTION_VECTORS,
	type ActionMethod,
	type ActionVector,
	type ActionWallet,
	validateActionArgs,
} from "./wallet-action-corpus";

const BROWSER_ORIGIN = "https://app.example:8443";
const ORIGIN = "app.example";
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
	method: ActionMethod;
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
	vector: Pick<ActionVector, "method" | "result">,
	calls: RecordedCall[],
	error?: Error,
): ActionWallet =>
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
					validateActionArgs(vector.method, args);
					if (error) throw error;
					return structuredClone(vector.result);
				};
			},
		},
	) as ActionWallet;

const directInvoke = async (
	wallet: ActionWallet,
	vector: Pick<ActionVector, "method" | "args">,
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
		return {
			status: "error",
			...toCWIErrorFields(error, false),
		};
	}
};

const relayInvoke = async (
	wallet: ActionWallet,
	vector: Pick<ActionVector, "id" | "method" | "args">,
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
	return response.status === "success"
		? { status: "success", result: (response.result ?? {}) as object }
		: {
				status: "error",
				description: response.description,
				code: response.code,
			};
};

describe("BRC-100 action/output conformance corpus", () => {
	test("validates and preserves every executable vector through direct and relay adapters", async () => {
		mutableEnv.NODE_ENV = "production";

		for (const vector of ACTION_VECTORS) {
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

	test("preserves invalid, denied, and unexpected error outcomes", async () => {
		mutableEnv.NODE_ENV = "production";
		const baseline = ACTION_VECTORS[0];
		const cases: Array<{
			id: string;
			args: object;
			error?: Error;
			expected: TestOutcome;
		}> = [
			{
				id: "invalid",
				args: { description: "bad" },
				expected: {
					status: "error",
					description: "The description parameter must be at least 5 length.",
					code: 6,
				},
			},
			{
				id: "denied",
				args: baseline.args,
				error: new WalletError("Permission denied by user", 3, "private stack"),
				expected: {
					status: "error",
					description: "Permission denied by user",
					code: 3,
				},
			},
			{
				id: "unexpected",
				args: baseline.args,
				error: new Error("unexpected adapter failure"),
				expected: {
					status: "error",
					description: "unexpected adapter failure",
					code: 1,
				},
			},
		];

		for (const failure of cases) {
			const vector = { ...baseline, id: failure.id, args: failure.args };
			const direct = await directInvoke(
				recordingWallet(vector, [], failure.error),
				vector,
			);
			const relay = await relayInvoke(
				recordingWallet(vector, [], failure.error),
				vector,
			);
			assert.deepEqual(direct, failure.expected, `${failure.id} direct`);
			assert.deepEqual(relay, failure.expected, `${failure.id} relay`);
		}
	});

	test("executes installed BRC-114 and BRC-153 codecs", () => {
		assert.deepEqual(
			parseBrc114ActionTimeLabels([
				"ordinary",
				"action time from 1700000000000",
				"action time to 1800000000000",
			]),
			{
				from: 1700000000000,
				to: 1800000000000,
				timeFilterRequested: true,
				remainingLabels: ["ordinary"],
			},
		);
		assert.equal(
			makeBrc114ActionTimeLabel(1750000000000),
			"action time 1750000000000",
		);
		assert.throws(
			() =>
				parseBrc114ActionTimeLabels([
					"action time from 1800000000000",
					"action time to 1700000000000",
				]),
			/from must be less than action time to/,
		);
		assert.throws(
			() => parseBrc114ActionTimeLabels(["action time from nope"]),
			/Invalid action time from timestamp/,
		);

		const referenceLabel = makeBrc153ReferenceLabel("AQID");
		assert.equal(referenceLabel, "reference 010203");
		assert.equal(parseBrc153ReferenceLabel(referenceLabel), "AQID");
		assert.equal(parseBrc153ReferenceLabel("reference 0xz"), undefined);
		assert.deepEqual(
			applyBrc153ReferenceLabel(
				["ordinary", "reference deadbeef", "reference stale"],
				"AQID",
			),
			["ordinary", "reference 010203"],
		);
	});

	test("executes installed BRC-112 normalization and aggregation", async () => {
		const storageCalls: Array<Record<string, unknown>> = [];
		const wallet = Object.create(Wallet.prototype) as Wallet &
			Record<string, unknown>;
		Object.assign(wallet, {
			identityKey: `02${"11".repeat(32)}`,
			autoKnownTxids: false,
			telemetry: { enabled: false },
			actionBatch: {
				hasWorkspace: false,
				overlayListOutputs: (result: object) => result,
			},
			storage: {
				listOutputs: async (args: Record<string, unknown>) => {
					storageCalls.push(args);
					return { totalOutputs: 0, outputs: [] };
				},
			},
		});

		await wallet.listOutputs(
			{
				basket: "balance conformance outputs",
				tags: ["id:fixture-1"],
				limit: 1,
				offset: 5,
			},
			"app.example",
		);
		assert.equal(storageCalls[0].basket, "conformance outputs");
		const tags = storageCalls[0].tags as string[];
		assert.ok(tags.includes("id:fixture-1"));
		assert.ok(tags.includes(sdk.specOpWalletBalance));

		const operation = getListOutputsSpecOp(
			storageCalls[0].basket as string,
			tags,
		);
		assert.equal(operation.specOp?.ignoreLimit, true);
		assert.equal(operation.specOp?.totalOutputsIsSumOfSatoshis, true);
		assert.deepEqual(operation.tags, ["id:fixture-1"]);
		const aggregate = await operation.specOp?.resultFromOutputs?.(
			{} as never,
			{} as never,
			storageCalls[0] as never,
			[],
			[{ satoshis: 20 }, { satoshis: 22 }] as never,
		);
		assert.deepEqual(aggregate, { totalOutputs: 42, outputs: [] });
	});

	test("executes BRC-164 as an ordinary case-folded tag", () => {
		const listed = Validation.validateListOutputsArgs({
			basket: "Conformance Outputs",
			tags: ["ID:Fixture-1"],
			includeTags: true,
		});
		assert.equal(listed.basket, "conformance outputs");
		assert.deepEqual(listed.tags, ["id:fixture-1"]);

		const inserted = Validation.validateInternalizeOutput({
			outputIndex: 0,
			protocol: "basket insertion",
			insertionRemittance: {
				basket: "Conformance Outputs",
				tags: ["ID:Fixture-1"],
			},
		});
		assert.deepEqual(inserted.insertionRemittance?.tags, ["id:fixture-1"]);
	});
});
