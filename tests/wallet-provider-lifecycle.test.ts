import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { statusAfterDisconnect } from "@/lib/wallet-connection-status";

describe("wallet provider lifecycle", () => {
	it("distinguishes a locked wallet from transport and manual disconnects", () => {
		assert.equal(statusAfterDisconnect("unauthenticated"), "locked");
		assert.equal(statusAfterDisconnect("unavailable"), "disconnected");
		assert.equal(statusAfterDisconnect("manual"), "disconnected");
	});
});
