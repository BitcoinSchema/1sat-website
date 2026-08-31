import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import type {
	PermissionRequest,
	WalletPermissionsManager,
} from "@bsv/wallet-toolbox-client";
import { CWIRelay } from "../lib/cwi/relay";

const originalBroadcastChannel = globalThis.BroadcastChannel;

afterEach(() => {
	Object.defineProperty(globalThis, "BroadcastChannel", {
		configurable: true,
		writable: true,
		value: originalBroadcastChannel,
	});
});

function createRelay() {
	class SilentBroadcastChannel {
		addEventListener() {}
		removeEventListener() {}
		postMessage() {}
		close() {}
	}

	Object.defineProperty(globalThis, "BroadcastChannel", {
		configurable: true,
		writable: true,
		value: SilentBroadcastChannel,
	});

	return new CWIRelay({
		getWallet: () => null,
		getStatus: () => "unlocked",
	});
}

const session = { sessionId: "session" };

function decisionInternals(relay: CWIRelay) {
	return relay as unknown as {
		pendingDecisions: Map<
			string,
			{
				sessionId: string;
				kind: "individual";
				permissionType: PermissionRequest["type"];
				requestedSpendingAmount?: number;
			}
		>;
		handleDecision: (
			session: { sessionId: string },
			requestID: string,
			kind: "individual",
			grant: boolean,
			granted?: unknown,
		) => Promise<void>;
	};
}

describe("CWI permission authority", () => {
	test("supports explicit one-time and exact standing spending grants", async () => {
		const calls: Array<{
			requestID: string;
			ephemeral?: boolean;
			amount?: number;
		}> = [];
		const wallet = {
			grantPermission: async (params: {
				requestID: string;
				ephemeral?: boolean;
			}) => calls.push(params),
		} as unknown as WalletPermissionsManager;
		const relay = createRelay();
		const internals = decisionInternals(relay);
		(
			internals as unknown as { getWallet: () => WalletPermissionsManager }
		).getWallet = () => wallet;
		internals.pendingDecisions.set("spend", {
			sessionId: "session",
			kind: "individual",
			permissionType: "spending",
		});
		await internals.handleDecision(session, "spend", "individual", true);
		internals.pendingDecisions.set("protocol", {
			sessionId: "session",
			kind: "individual",
			permissionType: "protocol",
		});
		await internals.handleDecision(session, "protocol", "individual", true);
		internals.pendingDecisions.set("standing", {
			sessionId: "session",
			kind: "individual",
			permissionType: "spending",
			requestedSpendingAmount: 1200,
		});
		await internals.handleDecision(session, "standing", "individual", true, {
			ephemeral: false,
			amount: 1200,
		});

		assert.deepEqual(calls, [
			{ requestID: "spend", ephemeral: true },
			{ requestID: "protocol", ephemeral: false },
			{ requestID: "standing", ephemeral: false, amount: 1200 },
		]);
		relay.stop();
	});

	test("does not consume a prompt when standing amount differs from the request", async () => {
		let calls = 0;
		const wallet = {
			grantPermission: async () => {
				calls += 1;
			},
		} as unknown as WalletPermissionsManager;
		const relay = createRelay();
		const internals = decisionInternals(relay);
		(
			internals as unknown as { getWallet: () => WalletPermissionsManager }
		).getWallet = () => wallet;
		internals.pendingDecisions.set("standing", {
			sessionId: "session",
			kind: "individual",
			permissionType: "spending",
			requestedSpendingAmount: 1200,
		});

		await internals.handleDecision(session, "standing", "individual", true, {
			ephemeral: false,
			amount: 1201,
		});

		assert.equal(calls, 0);
		assert.equal(internals.pendingDecisions.has("standing"), true);
		relay.stop();
	});

	test("does not convert a failed canonical grant into local authority", async () => {
		const permissionCache = new Map();
		const wallet = {
			permissionCache,
			grantPermission: async () => {
				throw new Error("insufficient funds");
			},
		} as unknown as WalletPermissionsManager;
		const relay = createRelay();
		const internals = decisionInternals(relay);
		(
			internals as unknown as { getWallet: () => WalletPermissionsManager }
		).getWallet = () => wallet;
		internals.pendingDecisions.set("protocol", {
			sessionId: "session",
			kind: "individual",
			permissionType: "protocol",
		});

		const logError = console.error;
		console.error = () => undefined;
		try {
			await internals.handleDecision(session, "protocol", "individual", true);
		} finally {
			console.error = logError;
		}

		assert.equal(permissionCache.size, 0);
		relay.stop();
	});
});
