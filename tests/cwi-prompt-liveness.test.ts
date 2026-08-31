import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import type { WalletPermissionsManager } from "@bsv/wallet-toolbox-client";
import { CWIBridge } from "../lib/cwi/bridge";
import { CWIRelay } from "../lib/cwi/relay";
import { createSessionBase, createSessionEnvelope } from "../lib/cwi/types";

const originalBroadcastChannel = globalThis.BroadcastChannel;
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;

class ManualClock {
	private now = 0;
	private nextId = 1;
	private readonly timers = new Map<
		number,
		{ at: number; callback: () => void }
	>();

	readonly setTimeout = (
		callback: TimerHandler,
		delay = 0,
		...args: unknown[]
	): number => {
		assert.equal(typeof callback, "function");
		const id = this.nextId++;
		this.timers.set(id, {
			at: this.now + delay,
			callback: () => (callback as (...values: unknown[]) => void)(...args),
		});
		return id;
	};

	readonly clearTimeout = (id: number): void => {
		this.timers.delete(Number(id));
	};

	advance(milliseconds: number): void {
		const end = this.now + milliseconds;
		for (;;) {
			const next = [...this.timers.entries()]
				.filter(([, timer]) => timer.at <= end)
				.sort((left, right) => left[1].at - right[1].at)[0];
			if (!next) break;
			const [id, timer] = next;
			this.timers.delete(id);
			this.now = timer.at;
			timer.callback();
		}
		this.now = end;
	}
}

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
	Object.defineProperty(globalThis, "setTimeout", {
		configurable: true,
		writable: true,
		value: originalSetTimeout,
	});
	Object.defineProperty(globalThis, "clearTimeout", {
		configurable: true,
		writable: true,
		value: originalClearTimeout,
	});
});

const tick = () => new Promise((resolve) => setImmediate(resolve));

function useManualClock(): ManualClock {
	const clock = new ManualClock();
	Object.defineProperty(globalThis, "setTimeout", {
		configurable: true,
		writable: true,
		value: clock.setTimeout,
	});
	Object.defineProperty(globalThis, "clearTimeout", {
		configurable: true,
		writable: true,
		value: clock.clearTimeout,
	});
	return clock;
}

function startRelay(config: {
	getWallet: () => WalletPermissionsManager | null;
	getStatus?: () => "locked" | "unlocked" | "no-wallet";
}) {
	Object.defineProperty(globalThis, "BroadcastChannel", {
		configurable: true,
		writable: true,
		value: FakeBroadcastChannel,
	});
	const relay = new CWIRelay({
		getWallet: config.getWallet,
		getStatus: config.getStatus ?? (() => "unlocked"),
	});
	relay.start();
	return { relay, channel: FakeBroadcastChannel.current };
}

function openSession(channel: FakeBroadcastChannel, id: string) {
	const session = {
		sessionId: id,
		sessionToken: `${id}-`.padEnd(43, "x"),
		browserOrigin: "https://app.example",
		originator: "app.example",
	};
	channel.emit({ ...createSessionBase(session), type: "cwi-session-open" });
	const accepted = channel.sent.at(-1) as { leaderId: string };
	return { ...session, leaderId: accepted.leaderId };
}

function request(
	session: ReturnType<typeof openSession>,
	id: string,
	call: string,
	args: unknown = {},
) {
	return {
		...createSessionEnvelope(session),
		type: "cwi-request",
		id,
		call,
		args,
	};
}

function responses(channel: FakeBroadcastChannel) {
	return channel.sent.filter(
		(message) => (message as { type?: string }).type === "cwi-response",
	) as Array<Record<string, unknown>>;
}

describe("BRC-219 prompt liveness", () => {
	test("waits beyond 2, 5, and 10 minutes until a wallet becomes available", async () => {
		const clock = useManualClock();
		let wallet: WalletPermissionsManager | null = null;
		const harness = startRelay({ getWallet: () => wallet });
		const session = openSession(harness.channel, "auth-long-wait");
		harness.channel.emit(request(session, "auth", "waitForAuthentication"));
		await tick();

		for (const minutes of [2, 3, 6]) {
			clock.advance(minutes * 60_000);
			assert.equal(responses(harness.channel).length, 0);
		}

		wallet = {
			waitForAuthentication: async () => ({ authenticated: true }),
		} as unknown as WalletPermissionsManager;
		clock.advance(500);
		await tick();
		await tick();
		assert.deepEqual(responses(harness.channel).at(-1)?.result, {
			authenticated: true,
		});
		harness.relay.stop();
	});

	test("keeps a locked authentication call alive until unlock", async () => {
		const clock = useManualClock();
		let status: "locked" | "unlocked" = "locked";
		let unlock!: () => void;
		const wallet = {
			waitForAuthentication: () =>
				new Promise<{ authenticated: true }>((resolve) => {
					unlock = () => resolve({ authenticated: true });
				}),
		} as unknown as WalletPermissionsManager;
		const harness = startRelay({
			getWallet: () => wallet,
			getStatus: () => status,
		});
		const session = openSession(harness.channel, "locked");
		harness.channel.emit(
			request(session, "locked-auth", "waitForAuthentication"),
		);
		await tick();
		clock.advance(5 * 60_000);
		assert.equal(responses(harness.channel).length, 0);

		status = "unlocked";
		unlock();
		await tick();
		assert.equal(responses(harness.channel).at(-1)?.status, "success");
		harness.relay.stop();
	});

	test("grant and deny settle their original long-running calls", async () => {
		const clock = useManualClock();
		let relay!: CWIRelay;
		let settle:
			| {
					resolve: (value: { signature: number[] }) => void;
					reject: (e: Error) => void;
			  }
			| undefined;
		let prompt = 0;
		const wallet = {
			createSignature: (_args: unknown, originator: string) => {
				prompt += 1;
				const requestID = `prompt-${prompt}`;
				const result = new Promise<{ signature: number[] }>(
					(resolve, reject) => {
						settle = { resolve, reject };
					},
				);
				relay.sendPermissionRequest(requestID, "protocol", originator, {
					requestID,
					type: "protocol",
				} as never);
				return result;
			},
			grantPermission: async () => settle?.resolve({ signature: [1, 2, 3] }),
			denyPermission: async () =>
				settle?.reject(
					Object.assign(new Error("Permission denied"), { code: 1 }),
				),
		} as unknown as WalletPermissionsManager;
		const harness = startRelay({ getWallet: () => wallet });
		relay = harness.relay;
		const session = openSession(harness.channel, "permission");

		harness.channel.emit(request(session, "grant-call", "createSignature", {}));
		await tick();
		clock.advance(2 * 60_000);
		assert.equal(responses(harness.channel).length, 0);
		harness.channel.emit({
			...createSessionEnvelope(session),
			type: "cwi-permission-grant",
			requestID: "prompt-1",
		});
		await tick();
		await tick();
		assert.deepEqual(responses(harness.channel).at(-1)?.result, {
			signature: [1, 2, 3],
		});

		harness.channel.emit(request(session, "deny-call", "createSignature", {}));
		await tick();
		clock.advance(11 * 60_000);
		assert.equal(responses(harness.channel).length, 1);
		harness.channel.emit({
			...createSessionEnvelope(session),
			type: "cwi-permission-deny",
			requestID: "prompt-2",
		});
		await tick();
		await tick();
		assert.deepEqual(
			{
				id: responses(harness.channel).at(-1)?.id,
				status: responses(harness.channel).at(-1)?.status,
				code: responses(harness.channel).at(-1)?.code,
			},
			{ id: "deny-call", status: "error", code: 1 },
		);
		harness.relay.stop();
	});

	test("session close aborts in-flight work and unblocks the next session", async () => {
		let relay!: CWIRelay;
		let call = 0;
		const denied: string[] = [];
		const wallet = {
			getVersion: (_args: unknown, originator: string) => {
				call += 1;
				if (call > 1) return Promise.resolve({ version: "test-1.0.0" });
				relay.sendPermissionRequest("close-prompt", "protocol", originator, {
					requestID: "close-prompt",
					type: "protocol",
				} as never);
				return new Promise(() => undefined);
			},
			denyPermission: async (requestID: string) => {
				denied.push(requestID);
			},
		} as unknown as WalletPermissionsManager;
		const harness = startRelay({ getWallet: () => wallet });
		relay = harness.relay;
		const first = openSession(harness.channel, "closing");
		harness.channel.emit(request(first, "stuck", "getVersion"));
		await tick();
		harness.channel.emit({
			...createSessionEnvelope(first),
			type: "cwi-session-close",
		});

		const second = openSession(harness.channel, "survivor");
		harness.channel.emit(request(second, "next", "getVersion"));
		await tick();
		await tick();
		assert.deepEqual(denied, ["close-prompt"]);
		const sent = responses(harness.channel);
		assert.deepEqual(
			{
				id: sent.find((message) => message.id === "stuck")?.id,
				code: sent.find((message) => message.id === "stuck")?.code,
				status: sent.find((message) => message.id === "next")?.status,
			},
			{ id: "stuck", code: 1, status: "success" },
		);
		harness.relay.stop();
	});

	test("bridge destruction settles pending dApp work with a numeric error", () => {
		const posted: unknown[] = [];
		const parent = { postMessage: (message: unknown) => posted.push(message) };
		const previousWindow = globalThis.window;
		Object.defineProperty(globalThis, "window", {
			configurable: true,
			value: { parent },
		});
		try {
			const bridge = new CWIBridge({
				onStatusChange: () => undefined,
				onPermissionRequest: () => undefined,
			});
			const internals = bridge as unknown as {
				handleDAppMessage: (event: MessageEvent) => void;
			};
			internals.handleDAppMessage({
				isTrusted: true,
				source: parent,
				origin: "https://app.example",
				data: {
					type: "CWI",
					isInvocation: true,
					id: "destroyed",
					call: "waitForAuthentication",
					args: {},
				},
			} as unknown as MessageEvent);
			bridge.stop();
			assert.deepEqual(posted.at(-1), {
				type: "CWI",
				isInvocation: false,
				id: "destroyed",
				status: "error",
				code: 1,
				description: "Wallet bridge stopped; retry the request",
			});
		} finally {
			Object.defineProperty(globalThis, "window", {
				configurable: true,
				value: previousWindow,
			});
		}
	});
});
