import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { HttpError } from "@1sat/client";
import type { IndexedOutput } from "@1sat/types";
import { fetchMarketActivity } from "@/lib/api";
import {
	classifyExplorerSearch,
	parseSearchCursor,
	SEARCH_PAGE_SIZE,
	searchExplorer,
} from "@/lib/explorer-search";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");
const txid = "ab".repeat(32);

function clients(
	overrides: {
		get?: (outpoint: string) => Promise<IndexedOutput>;
		getByTxid?: (txid: string) => Promise<IndexedOutput[]>;
		getOrigin?: (name: string) => Promise<{ name: string; outpoint: string }>;
		searchListings?: (options?: { from?: number }) => Promise<IndexedOutput[]>;
	} = {},
) {
	return {
		txo: {
			get: overrides.get ?? (async () => ({ outpoint: `${txid}.0`, score: 1 })),
			getByTxid:
				overrides.getByTxid ??
				(async () => [{ outpoint: `${txid}.0`, score: 1 }]),
		},
		opns: {
			getOrigin:
				overrides.getOrigin ??
				(async () => ({ name: "alice", outpoint: `${txid}.0` })),
		},
		market: {
			searchListings: overrides.searchListings ?? (async () => []),
		},
	};
}

describe("typed explorer search", () => {
	it("classifies canonical identifiers and validates score cursors", () => {
		assert.equal(classifyExplorerSearch(`${txid}_12`), "outpoint");
		assert.equal(classifyExplorerSearch(`${txid}.12`), "outpoint");
		assert.equal(classifyExplorerSearch(txid), "transaction");
		assert.equal(classifyExplorerSearch("alice"), "name");
		assert.equal(parseSearchCursor("42.5"), 42.5);
		assert.equal(parseSearchCursor("0"), undefined);
		assert.equal(parseSearchCursor("not-a-score"), undefined);
	});

	it("normalizes exact outpoints and routes transactions to real pages", async () => {
		let requested = "";
		const exactClients = clients({
			get: async (outpoint) => {
				requested = outpoint;
				return { outpoint: requested, score: 2 };
			},
		});
		const outpoint = await searchExplorer(
			`${txid}_2`,
			["txo"],
			undefined,
			exactClients,
		);
		assert.equal(requested, `${txid}.2`);
		assert.equal(outpoint.exact.status, "ready");
		if (outpoint.exact.status === "ready") {
			assert.equal(outpoint.exact.data.href, `/outpoint/${txid}_2`);
		}

		const transaction = await searchExplorer(
			txid,
			["txo"],
			undefined,
			exactClients,
		);
		assert.equal(transaction.exact.status, "ready");
		if (transaction.exact.status === "ready") {
			assert.equal(transaction.exact.data.href, `/tx/${txid}`);
		}
	});

	it("paginates typed OpNS and active listing results", async () => {
		const listings = Array.from({ length: SEARCH_PAGE_SIZE }, (_, index) => ({
			outpoint: `${"cd".repeat(32)}.${index}`,
			score: 100 - index,
			data: {
				ordlock: {
					name: `alice ${index}`,
					origin: `${"ef".repeat(32)}.${index}`,
					price: 1000 + index,
				},
			},
		}));
		const result = await searchExplorer(
			"alice",
			["opns", "market"],
			88,
			clients({ searchListings: async () => listings }),
		);
		assert.equal(result.opns.status, "ready");
		assert.equal(result.listings.status, "ready");
		if (result.listings.status === "ready") {
			assert.equal(result.listings.data.items.length, SEARCH_PAGE_SIZE);
			assert.equal(result.listings.data.nextCursor, 77);
		}
	});

	it("makes capability-missing, empty, not-found, and error states explicit", async () => {
		let called = false;
		const unavailable = await searchExplorer(
			txid,
			[],
			undefined,
			clients({
				getByTxid: async () => {
					called = true;
					return [];
				},
			}),
		);
		assert.equal(unavailable.exact.status, "unavailable");
		assert.equal(called, false);

		const empty = await searchExplorer(
			"nobody",
			["opns", "market"],
			undefined,
			clients({
				getOrigin: async () => {
					throw new HttpError(404, "not found");
				},
				searchListings: async () => [],
			}),
		);
		assert.equal(empty.opns.status, "not-found");
		assert.deepEqual(empty.listings, {
			status: "ready",
			data: { items: [], nextCursor: null },
		});

		const failed = await searchExplorer(
			"broken",
			["opns", "market"],
			undefined,
			clients({
				getOrigin: async () => {
					throw new Error("offline");
				},
				searchListings: async () => {
					throw new Error("offline");
				},
			}),
		);
		assert.equal(failed.opns.status, "error");
		assert.equal(failed.listings.status, "error");
	});

	it("keeps activity errors visible and current routes free of legacy feeds", async () => {
		const page = await fetchMarketActivity(
			{ pageParam: 50 },
			{
				searchListings: async () => [
					{ outpoint: `${txid}.0`, score: 40, data: { ordlock: {} } },
				],
			},
		);
		assert.equal(page.items.length, 1);
		assert.equal(page.nextCursor, null);
		await assert.rejects(() =>
			fetchMarketActivity(
				{},
				{
					searchListings: async () => {
						throw new Error("offline");
					},
				},
			),
		);

		const sources = [
			"app/(main)/activity/page.tsx",
			"components/feed/flow-grid.tsx",
			"app/(main)/search/page.tsx",
			"app/(main)/tx/[txid]/page.tsx",
			"app/(main)/outpoint/[outpoint]/page.tsx",
		].map(read);
		for (const source of sources) {
			assert.doesNotMatch(source, /api-mock|\/api\/market|\/api\/autofill/);
			assert.doesNotMatch(
				source,
				/@\/providers\/wallet-provider|wallet-storage|\bindexedDB\b|\bwalletKeys\b/,
			);
		}
		assert.match(sources[1], /status === "pending"/);
		assert.match(sources[1], /status === "error"/);
		assert.match(sources[1], /!activityAvailable/);
		assert.match(sources[2], /stackContentUrl/);
		assert.doesNotMatch(sources[2], /\/content\//);
		assert.match(sources[4], /fetchStackCapabilities/);
		assert.match(sources[4], /ORDFS is unavailable/);
		assert.match(read("app/(main)/search/loading.tsx"), /role="status"/);
		assert.match(
			read("app/(main)/outpoint/[outpoint]/loading.tsx"),
			/role="status"/,
		);
	});
});
