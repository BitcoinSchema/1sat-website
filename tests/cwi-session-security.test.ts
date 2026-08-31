import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import type { WalletPermissionsManager } from "@bsv/wallet-toolbox-client";
import { CWIRelay } from "../lib/cwi/relay";
import {
	CWI_MAX_PAYLOAD_BYTES,
	createSessionBase,
	createSessionEnvelope,
	isWithinCWIPayloadLimit,
	parseBrowserOrigin,
} from "../lib/cwi/types";

const originalBroadcastChannel = globalThis.BroadcastChannel;

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
	emit(message: unknown) {
		this.listener?.({ data: structuredClone(message) } as MessageEvent);
	}
}

afterEach(() => {
	Object.defineProperty(globalThis, "BroadcastChannel", {
		configurable: true,
		writable: true,
		value: originalBroadcastChannel,
	});
});

const tick = () => new Promise((resolve) => setImmediate(resolve));

function makeRelay(wallet: WalletPermissionsManager) {
	Object.defineProperty(globalThis, "BroadcastChannel", {
		configurable: true,
		writable: true,
		value: FakeBroadcastChannel,
	});
	return new CWIRelay({
		getWallet: () => wallet,
		getStatus: () => "unlocked",
	});
}

function openSession(
	channel: FakeBroadcastChannel,
	sessionId: string,
	browserOrigin: string,
) {
	const parsed = parseBrowserOrigin(browserOrigin);
	assert.ok(parsed);
	const session = {
		sessionId,
		sessionToken: `${sessionId}-`.padEnd(43, "x"),
		browserOrigin: parsed.browserOrigin,
		originator: parsed.originator,
	};
	channel.emit({ ...createSessionBase(session), type: "cwi-session-open" });
	const accepted = channel.sent.find(
		(message) =>
			(message as { type?: string; sessionId?: string }).type ===
				"cwi-session-accept" &&
			(message as { sessionId?: string }).sessionId === sessionId,
	) as { leaderId: string } | undefined;
	assert.ok(accepted);
	return { ...session, leaderId: accepted.leaderId };
}

function request(
	session: ReturnType<typeof openSession>,
	id: string,
	args: unknown = {},
) {
	return {
		...createSessionEnvelope(session),
		type: "cwi-request",
		id,
		call: "getVersion",
		args,
	};
}

describe("hosted CWI session security", () => {
	test("isolates two full browser origins and passes only canonical FQDNs", async () => {
		const calls: string[] = [];
		const wallet = {
			getVersion: async (_args: unknown, originator: string) => {
				calls.push(originator);
				return { version: originator };
			},
		} as unknown as WalletPermissionsManager;
		const relay = makeRelay(wallet);
		relay.start();
		await tick();
		const channel = FakeBroadcastChannel.current;
		const one = openSession(channel, "one", "https://app.example:8443");
		const two = openSession(channel, "two", "https://other.example");

		channel.emit(request(one, "same-id"));
		channel.emit(request(two, "same-id"));
		await tick();
		await tick();

		assert.deepEqual(calls, ["app.example", "other.example"]);
		const responses = channel.sent.filter(
			(message) => (message as { type?: string }).type === "cwi-response",
		) as Array<{ sessionId: string; browserOrigin: string; status: string }>;
		assert.deepEqual(
			responses.map(({ sessionId, browserOrigin, status }) => ({
				sessionId,
				browserOrigin,
				status,
			})),
			[
				{
					sessionId: "one",
					browserOrigin: "https://app.example:8443",
					status: "success",
				},
				{
					sessionId: "two",
					browserOrigin: "https://other.example",
					status: "success",
				},
			],
		);
		relay.stop();
	});

	test("rejects forged credentials, origins, and duplicate request ids", async () => {
		let calls = 0;
		const wallet = {
			getVersion: async () => {
				calls += 1;
				return { version: "test-1.0.0" };
			},
		} as unknown as WalletPermissionsManager;
		const relay = makeRelay(wallet);
		relay.start();
		await tick();
		const channel = FakeBroadcastChannel.current;
		const session = openSession(channel, "secure", "https://app.example");

		channel.emit(
			request({ ...session, sessionToken: "f".repeat(43) }, "forged-token"),
		);
		channel.emit(
			request(
				{
					...session,
					browserOrigin: "https://evil.example",
					originator: "evil.example",
				},
				"forged-origin",
			),
		);
		channel.emit(request(session, "duplicate"));
		await tick();
		channel.emit(request(session, "duplicate"));
		await tick();

		assert.equal(calls, 1);
		const duplicate = channel.sent.find(
			(message) =>
				(message as { type?: string; id?: string; status?: string }).type ===
					"cwi-response" &&
				(message as { id?: string }).id === "duplicate" &&
				(message as { status?: string }).status === "error",
		) as { code: number; description: string } | undefined;
		assert.deepEqual(
			duplicate && { code: duplicate.code, description: duplicate.description },
			{
				code: 2,
				description: "Duplicate request id",
			},
		);
		relay.stop();
	});

	test("bounds payload, per-session work, and global work", async () => {
		assert.equal(
			isWithinCWIPayloadLimit(new Uint8Array(CWI_MAX_PAYLOAD_BYTES + 1)),
			false,
		);
		assert.equal(
			isWithinCWIPayloadLimit(
				new Map([["payload", new Uint8Array(CWI_MAX_PAYLOAD_BYTES + 1)]]),
			),
			false,
		);
		const never = new Promise(() => undefined);
		const wallet = {
			getVersion: () => never,
		} as unknown as WalletPermissionsManager;
		const relay = makeRelay(wallet);
		relay.start();
		await tick();
		const channel = FakeBroadcastChannel.current;
		const isolated = openSession(
			channel,
			"per-session",
			"https://solo.example",
		);
		for (let index = 0; index < 9; index++) {
			channel.emit(request(isolated, `solo-${index}`));
		}
		const sessionLimit = channel.sent.find(
			(message) =>
				(message as { id?: string }).id === "solo-8" &&
				(message as { status?: string }).status === "error",
		) as { description?: string } | undefined;
		assert.equal(sessionLimit?.description, "Wallet request limit reached");
		relay.stop();

		const globalRelay = makeRelay(wallet);
		globalRelay.start();
		await tick();
		const globalChannel = FakeBroadcastChannel.current;
		const sessions = Array.from({ length: 5 }, (_, index) =>
			openSession(
				globalChannel,
				`limit-${index}`,
				`https://app-${index}.example`,
			),
		);
		for (let sessionIndex = 0; sessionIndex < 4; sessionIndex++) {
			for (let requestIndex = 0; requestIndex < 8; requestIndex++) {
				globalChannel.emit(
					request(sessions[sessionIndex], `${sessionIndex}-${requestIndex}`),
				);
			}
		}
		globalChannel.emit(request(sessions[4], "global-overflow"));
		const globalLimit = globalChannel.sent.find(
			(message) =>
				(message as { id?: string }).id === "global-overflow" &&
				(message as { status?: string }).status === "error",
		) as { description?: string } | undefined;
		assert.equal(globalLimit?.description, "Wallet request limit reached");
		globalRelay.stop();
	});

	test("signals leader loss and accepts the same capability under the successor", async () => {
		const wallet = {} as WalletPermissionsManager;
		const first = makeRelay(wallet);
		first.start();
		await tick();
		const firstChannel = FakeBroadcastChannel.current;
		const firstSession = openSession(
			firstChannel,
			"takeover",
			"https://app.example",
		);
		first.stop();
		assert.ok(
			firstChannel.sent.some(
				(message) =>
					(message as { type?: string }).type === "cwi-leader-lost" &&
					(message as { leaderId?: string }).leaderId === firstSession.leaderId,
			),
		);

		const second = makeRelay(wallet);
		second.start();
		await tick();
		const secondChannel = FakeBroadcastChannel.current;
		const successor = openSession(
			secondChannel,
			"takeover",
			"https://app.example",
		);
		assert.notEqual(successor.leaderId, firstSession.leaderId);
		second.stop();
	});
});
