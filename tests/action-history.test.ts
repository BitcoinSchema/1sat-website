import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { WalletAction, WalletInterface } from "@bsv/sdk";
import {
	ACTION_HISTORY_PAGE_SIZE,
	actionExplorerUrl,
	actionHistoryForIdentity,
	actionReferenceLabel,
	listActionHistoryPage,
	ordinaryActionLabels,
} from "../lib/wallet/action-history";

const action = {
	txid: "ab".repeat(32),
	satoshis: 42,
	status: "completed",
	isOutgoing: true,
	description: "Send forty-two satoshis",
	labels: ["payment", "reference 010203", "personal"],
	version: 1,
	lockTime: 0,
} satisfies WalletAction;

describe("action history", () => {
	test("requests one truthful page with BRC-100 offset pagination", async () => {
		let args: unknown;
		const wallet = {
			listActions: async (request: unknown) => {
				args = request;
				return { totalActions: 101, actions: [action] };
			},
		} as Pick<WalletInterface, "listActions">;

		const result = await listActionHistoryPage(
			wallet,
			2 * ACTION_HISTORY_PAGE_SIZE,
		);

		assert.equal(result.totalActions, 101);
		assert.deepEqual(args, {
			labels: [],
			labelQueryMode: "any",
			includeLabels: true,
			limit: 25,
			offset: 50,
		});
	});

	test("preserves empty results and wallet errors", async () => {
		const emptyWallet = {
			listActions: async () => ({ totalActions: 0, actions: [] }),
		} as Pick<WalletInterface, "listActions">;
		assert.deepEqual(await listActionHistoryPage(emptyWallet, 0), {
			totalActions: 0,
			actions: [],
		});

		const failure = new Error("Wallet history unavailable");
		const failingWallet = {
			listActions: async () => {
				throw failure;
			},
		} as Pick<WalletInterface, "listActions">;
		await assert.rejects(listActionHistoryPage(failingWallet, 0), failure);
	});

	test("returns loading state instead of stale data when identity changes", () => {
		const previous = {
			identityKey: "previous",
			actions: [action],
			totalActions: 101,
			error: "stale error",
		};
		assert.deepEqual(actionHistoryForIdentity(previous, "next"), {
			identityKey: "next",
			actions: null,
			totalActions: 0,
			error: null,
		});
		assert.equal(actionHistoryForIdentity(previous, "previous"), previous);
	});

	test("separates the valid BRC-153 reference from ordinary labels", () => {
		assert.equal(actionReferenceLabel(action), "reference 010203");
		assert.deepEqual(ordinaryActionLabels(action), ["payment", "personal"]);
		assert.equal(
			actionReferenceLabel({
				...action,
				labels: ["reference invalid"],
			}),
			undefined,
		);
		assert.deepEqual(
			ordinaryActionLabels({ ...action, labels: ["reference invalid"] }),
			[],
		);
	});

	test("only derives chain-correct explorer links for valid transaction IDs", () => {
		assert.equal(
			actionExplorerUrl(action.txid, "main"),
			`https://whatsonchain.com/tx/${action.txid}`,
		);
		assert.equal(
			actionExplorerUrl(action.txid, "test"),
			`https://test.whatsonchain.com/tx/${action.txid}`,
		);
		assert.equal(actionExplorerUrl("not-a-txid", "main"), undefined);
	});
});
