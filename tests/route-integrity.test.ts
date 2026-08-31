import assert from "node:assert/strict";
import { join } from "node:path";
import { describe, test } from "node:test";
import {
	normalizeInternalTarget,
	routePatternFromFile,
} from "../scripts/check-routes.mjs";

describe("route integrity", () => {
	test("maps route groups and dynamic segments", () => {
		const pattern = routePatternFromFile(
			join(process.cwd(), "app/(main)/outpoint/[outpoint]/page.tsx"),
		);

		assert.equal(pattern.test("/outpoint/abc_0"), true);
		assert.equal(pattern.test("/outpoint"), false);
		assert.equal(
			routePatternFromFile(join(process.cwd(), "app/(main)/page.tsx")).test(
				"/",
			),
			true,
		);
	});

	test("normalizes internal templates and ignores external links", () => {
		const placeholder = "${" + "outpoint}";
		assert.equal(
			normalizeInternalTarget(`/outpoint/${placeholder}?view=full`),
			"/outpoint/__dynamic__",
		);
		assert.equal(normalizeInternalTarget("https://1sat.app"), null);
	});
});
