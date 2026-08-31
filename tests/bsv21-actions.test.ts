import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { OneSatContext } from "@1sat/actions";
import { PrivateKey } from "@bsv/sdk";
import {
	type Bsv21ActionSet,
	bsv21ActionFailureMessage,
	executeBsv21Buy,
	executeBsv21Send,
	formatBsv21Amount,
	getBsv21Listings,
	isBsv21TokenId,
	parseBsv21Amount,
	parseBsv21Destination,
	requireCurrentBsv21Listing,
} from "@/lib/wallet/bsv21-actions";

const tokenId = `${"ab".repeat(32)}_0`;
const listingOutpoint = `${"cd".repeat(32)}.1`;

describe("BSV21 exact inputs", () => {
	it("parses display quantities into exact atomic bigint values", () => {
		assert.equal(parseBsv21Amount("1", 0), 1n);
		assert.equal(parseBsv21Amount("1.25", 2), 125n);
		assert.equal(parseBsv21Amount("0.00000001", 8), 1n);
		assert.equal(
			parseBsv21Amount("9007199254740993", 0),
			9_007_199_254_740_993n,
		);
		for (const invalid of ["", "0", "01", "1e3", "-1", "1.001"]) {
			assert.equal(parseBsv21Amount(invalid, 2), null, invalid);
		}
	});

	it("formats exact atomic values without floating point math", () => {
		assert.equal(formatBsv21Amount("125", 2), "1.25");
		assert.equal(formatBsv21Amount("100", 2), "1");
		assert.equal(formatBsv21Amount("1", 8), "0.00000001");
		assert.equal(
			formatBsv21Amount(9_007_199_254_740_993n, 0),
			"9007199254740993",
		);
	});

	it("validates canonical token IDs and provider-neutral destinations", () => {
		const key = PrivateKey.fromHex("01".repeat(32));
		const publicKey = key.toPublicKey().toString();
		const mainnet = key.toPublicKey().toAddress("mainnet");
		const testnet = key.toPublicKey().toAddress("testnet");

		assert.equal(isBsv21TokenId(tokenId), true);
		assert.equal(isBsv21TokenId(tokenId.replace("_", ".")), true);
		assert.equal(isBsv21TokenId("ticker"), false);
		assert.deepEqual(parseBsv21Destination(mainnet, "main"), {
			address: mainnet,
		});
		assert.equal(parseBsv21Destination(testnet, "main"), null);
		assert.deepEqual(parseBsv21Destination(publicKey, "main"), {
			counterparty: publicKey,
		});
	});
});

describe("BSV21 listing safety", () => {
	const activeMarketOutput = {
		outpoint: listingOutpoint,
		score: 1,
		data: {
			ordlock: {
				price: 1234,
				origin: listingOutpoint,
				seller: "seller",
			},
		},
	};
	const activeTokenOutput = {
		outpoint: listingOutpoint,
		score: 1,
		data: { bsv21: { id: tokenId, op: "transfer", amt: "42" } },
	};

	function context(options?: { spentMarket?: boolean; spentToken?: boolean }) {
		const marketOutput = options?.spentMarket
			? { ...activeMarketOutput, spend: "ef".repeat(32) }
			: activeMarketOutput;
		const tokenOutput = options?.spentToken
			? { ...activeTokenOutput, spend: "ef".repeat(32) }
			: activeTokenOutput;
		return {
			services: {
				market: {
					searchListings: async () => [marketOutput],
					getListing: async () => marketOutput,
				},
				bsv21: {
					validateOutputs: async () => [tokenOutput],
					validateOutput: async () => tokenOutput,
				},
			},
		} as unknown as Pick<OneSatContext, "services">;
	}

	it("joins active market and overlay rows using exact indexed amount", async () => {
		assert.deepEqual(await getBsv21Listings(context(), tokenId), [
			{ outpoint: listingOutpoint, amount: "42", price: 1234 },
		]);
		assert.deepEqual(
			await requireCurrentBsv21Listing(context(), tokenId, {
				outpoint: listingOutpoint,
				amount: "42",
				price: 1234,
			}),
			{ outpoint: listingOutpoint, amount: "42", price: 1234 },
		);
	});

	it("rejects spent, amount-changed, and price-changed reviews", async () => {
		assert.deepEqual(
			await getBsv21Listings(context({ spentToken: true }), tokenId),
			[],
		);
		assert.equal(
			await requireCurrentBsv21Listing(
				context({ spentMarket: true }),
				tokenId,
				{
					outpoint: listingOutpoint,
					amount: "42",
					price: 1234,
				},
			),
			null,
		);
		assert.equal(
			await requireCurrentBsv21Listing(context(), tokenId, {
				outpoint: listingOutpoint,
				amount: "41",
				price: 1234,
			}),
			null,
		);
	});
});

describe("canonical BSV21 action dispatch", () => {
	it("passes bigint quantities and provider-neutral destinations", async () => {
		const calls: Array<{ action: string; input: unknown }> = [];
		const actions: Bsv21ActionSet = {
			send: async (_ctx, input) => {
				calls.push({ action: "send", input });
				return { txid: "send" };
			},
			buy: async (_ctx, input) => {
				calls.push({ action: "buy", input });
				return { txid: "buy" };
			},
		};
		const ctx = {} as OneSatContext;
		await executeBsv21Send(
			ctx,
			{
				tokenId,
				amount: 42n,
				destination: { counterparty: "02".padEnd(66, "1") },
			},
			actions,
		);
		await executeBsv21Buy(
			ctx,
			{ outpoint: listingOutpoint, amount: "42", price: 1234 },
			tokenId,
			actions,
		);
		assert.deepEqual(calls, [
			{
				action: "send",
				input: {
					tokenId,
					recipients: [
						{
							amount: 42n,
							destination: { counterparty: "02".padEnd(66, "1") },
						},
					],
					validateOverlay: true,
				},
			},
			{
				action: "buy",
				input: { tokenId, outpoint: listingOutpoint, amount: "42" },
			},
		]);
	});

	it("maps wallet denial and stale state without exposing opaque payloads", () => {
		assert.match(
			bsv21ActionFailureMessage("user rejected request"),
			/declined/,
		);
		assert.match(
			bsv21ActionFailureMessage("overlay-validation-failed"),
			/changed/,
		);
		const opaque = bsv21ActionFailureMessage({ seed: "never display" });
		assert.match(opaque, /failed/);
		assert.doesNotMatch(opaque, /seed|never display/);
	});
});
