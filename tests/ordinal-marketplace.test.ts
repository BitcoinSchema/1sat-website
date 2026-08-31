import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import type { IndexedOutput } from "@1sat/types";
import {
	MARKET_PAGE_SIZE,
	marketSearchHref,
	matchWalletListings,
	parseMarketFilters,
	requireCurrentListing,
	searchActiveOrdinalListings,
} from "@/lib/ordinal-marketplace";
import { listingFromOutput } from "@/lib/stack";

const TXID = "ab".repeat(32);
const ORIGIN = `${"cd".repeat(32)}.0`;

const indexedListing = (
	overrides: Partial<IndexedOutput> & {
		listing?: Record<string, unknown>;
	} = {},
): IndexedOutput => ({
	outpoint: `${TXID}.0`,
	score: 100,
	data: {
		ordlock: {
			origin: ORIGIN,
			price: 123,
			name: "Test ordinal",
			...overrides.listing,
		},
	},
	...overrides,
});

describe("typed ordinal market data", () => {
	it("keeps prices as positive safe integer satoshis", () => {
		assert.equal(listingFromOutput(indexedListing()).price, 123);
		assert.equal(
			listingFromOutput(indexedListing({ listing: { price: "456" } })).price,
			456,
		);
		for (const price of [0, 1.5, "1e8", "9007199254740992", -1]) {
			assert.equal(
				listingFromOutput(indexedListing({ listing: { price } })).price,
				undefined,
			);
		}
		assert.equal(
			listingFromOutput(indexedListing({ spend: "ef".repeat(32) })).spend_txid,
			"ef".repeat(32),
		);
	});

	it("parses bounded filters and builds score-pagination links", () => {
		assert.deepEqual(
			parseMarketFilters({
				q: "  art ",
				type: "image/png",
				from: "123.5",
			}),
			{ q: "art", type: "image/png", from: 123.5 },
		);
		assert.deepEqual(parseMarketFilters({ from: "not-a-score" }), {});
		assert.equal(
			marketSearchHref({ q: "one sat", type: "image/png", from: 123.5 }),
			"/market/ordinals?q=one+sat&type=image%2Fpng&from=123.5",
		);
	});

	it("requests only active listings and advances by the returned score", async () => {
		let received: unknown;
		const outputs = Array.from({ length: MARKET_PAGE_SIZE }, (_, index) =>
			indexedListing({
				outpoint: `${index.toString(16).padStart(64, "0")}.0`,
				score: 100 - index,
			}),
		);
		const result = await searchActiveOrdinalListings(
			{
				searchListings: async (options) => {
					received = options;
					return outputs;
				},
			},
			{ q: "art", type: "image/png", from: 500 },
		);
		assert.deepEqual(received, {
			status: "active",
			limit: MARKET_PAGE_SIZE,
			rev: true,
			q: "art",
			type: "image/png",
			from: 500,
		});
		assert.equal(result.listings.length, MARKET_PAGE_SIZE);
		assert.equal(result.nextCursor, 100 - (MARKET_PAGE_SIZE - 1));
	});

	it("requires the current origin listing to match outpoint and exact price", async () => {
		const client = {
			getListingByOrigin: async () => indexedListing(),
		};
		assert.equal(
			(
				await requireCurrentListing(client, {
					origin: ORIGIN,
					outpoint: `${TXID}.0`,
					price: 123,
				})
			)?.price,
			123,
		);
		assert.equal(
			await requireCurrentListing(client, {
				origin: ORIGIN,
				outpoint: `${TXID}.0`,
				price: 124,
			}),
			null,
		);
		assert.equal(
			await requireCurrentListing(
				{ getListingByOrigin: async () => indexedListing({ spend: TXID }) },
				{ origin: ORIGIN, outpoint: `${TXID}.0`, price: 123 },
			),
			null,
		);
	});

	it("calls a listing mine only when wallet outpoint and market origin agree", () => {
		const owned = [
			{ output: { outpoint: `${TXID}.0`, marker: true }, origin: ORIGIN },
		];
		assert.equal(
			matchWalletListings(owned, { [ORIGIN]: indexedListing() })[0]?.output
				.marker,
			true,
		);
		assert.deepEqual(
			matchWalletListings(owned, {
				[ORIGIN]: indexedListing({ outpoint: `${"ef".repeat(32)}.0` }),
			}),
			[],
		);
	});
});

describe("ordinal market UI boundaries", () => {
	it("uses active OneSatContext, canonical buy/cancel, and truthful fee labels", () => {
		const source = [
			"components/market/buy-button.tsx",
			"components/market/my-ordinal-listings.tsx",
			"app/(main)/market/ordinals/page.tsx",
			"app/(main)/market/ordinals/my-listings/page.tsx",
		]
			.map((path) => readFileSync(join(process.cwd(), path), "utf8"))
			.join("\n");
		assert.match(source, /buyOrdinal\.execute\(oneSatContext/);
		assert.match(source, /kind="cancel"/);
		assert.match(source, /Marketplace fee/);
		assert.match(source, /Total before network fee/);
		assert.match(source, /not quoted by this action/);
		assert.match(source, /queryKey: \["wallet-balance"\]/);
		assert.match(source, /queryKey: \["market-flow"\]/);
		assert.doesNotMatch(
			source,
			/createContext\(|wallet-storage|wallet-backup|indexedDB|rootKey|seedPhrase|marketplaceRate/,
		);
	});
});
