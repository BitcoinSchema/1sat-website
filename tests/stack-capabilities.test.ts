import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	fetchStackCapabilities,
	parseStackCapabilities,
	stackContentUrl,
} from "../lib/stack";
import { createStackFeatureRegistry } from "../lib/stack-features";

describe("1Sat stack capabilities", () => {
	test("validates, de-duplicates, and ignores future capability names", () => {
		assert.deepEqual(
			parseStackCapabilities(["market", "ordfs", "market", "future"]),
			["market", "ordfs"],
		);
		assert.throws(() => parseStackCapabilities({ market: true }), TypeError);
	});

	test("uses the live stack capability path", async () => {
		let requestedUrl = "";
		const capabilities = await fetchStackCapabilities(
			"https://example.test/",
			async (input) => {
				requestedUrl = String(input);
				return Response.json(["market", "ordfs"]);
			},
		);
		assert.equal(requestedUrl, "https://example.test/1sat/capabilities");
		assert.deepEqual(capabilities, ["market", "ordfs"]);
	});

	test("marks compound and absent modules unavailable", () => {
		const registry = createStackFeatureRegistry(["market", "ordfs"]);
		assert.equal(registry.features.ordinalMarket, true);
		assert.equal(registry.features.bsv21, false);
		assert.equal(registry.features.social, false);
	});

	test("emits canonical underscore OrdFS URLs from either outpoint form", () => {
		const txid = "ab".repeat(32);
		const expectedPath = `/content/${txid}_12`;
		assert.equal(new URL(stackContentUrl(`${txid}.12`)).pathname, expectedPath);
		assert.equal(new URL(stackContentUrl(`${txid}_12`)).pathname, expectedPath);
	});
});
