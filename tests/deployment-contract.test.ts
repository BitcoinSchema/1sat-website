import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, test } from "node:test";
import { NextRequest } from "next/server";
import {
	handleCorsPreflightRequest,
	hasMatchingOrigin,
} from "../lib/cwi/redirect-utils";
import nextConfig, {
	baseSecurityHeaders,
	sensitiveRouteHeaders,
} from "../next.config";
import { cwiFrameAncestors, proxy } from "../proxy";

const asHeaderMap = (headers: Array<{ key: string; value: string }>) =>
	new Map(headers.map(({ key, value }) => [key.toLowerCase(), value]));

describe("deployment response contract", () => {
	test("applies baseline security and no-store headers", async () => {
		const baseline = asHeaderMap(baseSecurityHeaders);
		assert.equal(baseline.get("x-content-type-options"), "nosniff");
		assert.equal(
			baseline.get("referrer-policy"),
			"strict-origin-when-cross-origin",
		);

		const noStore = asHeaderMap(sensitiveRouteHeaders);
		assert.match(noStore.get("cache-control") ?? "", /\bno-store\b/);

		const rules = await nextConfig.headers?.();
		assert.ok(rules);
		const cwiApi = rules.find((rule) => rule.source === "/api/cwi/:path*");
		assert.ok(cwiApi);
		assert.equal(asHeaderMap(cwiApi.headers).get("vary"), "Origin");
	});

	test("allows secure hosted-wallet parents without opening normal pages", () => {
		assert.equal(cwiFrameAncestors("production"), "https:");
		assert.match(cwiFrameAncestors("development"), /http:\/\/localhost:\*/);

		const embedResponse = proxy(
			new NextRequest("https://1satwallet.com/wallet/cwi", {
				headers: { host: "1satwallet.com" },
			}),
		);
		const embedCsp = embedResponse.headers.get("content-security-policy") ?? "";
		assert.match(embedCsp, /object-src 'none'/);
		assert.match(embedCsp, /frame-ancestors https:/);
		assert.doesNotMatch(embedCsp, /frame-ancestors 'self'/);
		assert.match(embedResponse.headers.get("cache-control") ?? "", /no-store/);

		const pageResponse = proxy(
			new NextRequest("https://1satwallet.com/wallet", {
				headers: { host: "1satwallet.com" },
			}),
		);
		assert.match(
			pageResponse.headers.get("content-security-policy") ?? "",
			/frame-ancestors 'self'/,
		);
		assert.equal(pageResponse.headers.has("cache-control"), false);
	});

	test("keeps preview hosts out of search indexes", async () => {
		const preview = proxy(
			new NextRequest("https://preview.example/wallet", {
				headers: { host: "preview.example" },
			}),
		);
		assert.equal(preview.headers.get("x-robots-tag"), "noindex, nofollow");

		const robots = proxy(
			new NextRequest("https://preview.example/robots.txt", {
				headers: { host: "preview.example" },
			}),
		);
		assert.match(await robots.text(), /Disallow: \/$/m);
	});

	test("reflects only an allowed CORS origin without credentials", () => {
		const allowed = handleCorsPreflightRequest(
			new NextRequest("http://localhost:8255/api/cwi/authorize/init", {
				method: "OPTIONS",
				headers: { origin: "http://localhost:3333" },
			}),
		);
		assert.equal(allowed.status, 204);
		assert.equal(
			allowed.headers.get("access-control-allow-origin"),
			"http://localhost:3333",
		);
		assert.equal(
			allowed.headers.has("access-control-allow-credentials"),
			false,
		);

		const rejected = handleCorsPreflightRequest(
			new NextRequest("http://localhost:8255/api/cwi/authorize/init", {
				method: "OPTIONS",
				headers: { origin: "http://wallet.example" },
			}),
		);
		assert.equal(rejected.status, 403);
		assert.equal(
			hasMatchingOrigin(
				new URL("https://app.example"),
				new URL("https://app.example/callback"),
			),
			true,
		);
		assert.equal(
			hasMatchingOrigin(
				new URL("https://app.example"),
				new URL("https://other.example/callback"),
			),
			false,
		);
	});
});

describe("deployment environment contract", () => {
	test("never exposes secret-shaped example variables to the browser", () => {
		const example = readFileSync(
			new URL("../.env.example", import.meta.url),
			"utf8",
		);
		const names = example
			.split(/\r?\n/)
			.map((line) => line.match(/^([A-Z][A-Z0-9_]*)=/)?.[1])
			.filter((name): name is string => Boolean(name));
		const secretShape = /(SECRET|PRIVATE|PASSWORD|TOKEN|DEPLOY_KEY|API_KEY)/;
		assert.deepEqual(
			names.filter(
				(name) => name.startsWith("NEXT_PUBLIC_") && secretShape.test(name),
			),
			[],
		);
		assert.ok(names.includes("CWI_REDIRECT_SECRET"));
		assert.equal(names.includes("NEXT_PUBLIC_CWI_REDIRECT_SECRET"), false);
	});
});
