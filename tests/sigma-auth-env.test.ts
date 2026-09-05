import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, test } from "node:test";

const ROOT = process.cwd();

const walk = (directory: string): string[] =>
	readdirSync(directory).flatMap((entry) => {
		if (
			entry === "node_modules" ||
			entry === ".git" ||
			entry === ".next" ||
			entry === "bun.lock"
		) {
			return [];
		}
		const path = join(directory, entry);
		return statSync(path).isDirectory() ? walk(path) : [path];
	});

describe("Sigma OAuth env contract", () => {
	test("example and docs use SIGMA_ACCOUNT_PRIVATE_KEY only", () => {
		const example = readFileSync(join(ROOT, ".env.example"), "utf8");
		const names = example
			.split(/\r?\n/)
			.map((line) => line.match(/^([A-Z][A-Z0-9_]*)=/)?.[1])
			.filter((name): name is string => Boolean(name));

		assert.ok(names.includes("NEXT_PUBLIC_SIGMA_AUTH_URL"));
		assert.ok(names.includes("NEXT_PUBLIC_SIGMA_CLIENT_ID"));
		assert.ok(names.includes("SIGMA_ACCOUNT_PRIVATE_KEY"));
		assert.equal(names.includes("SIGMA_MEMBER_PRIVATE_KEY"), false);
		assert.equal(
			names.includes("NEXT_PUBLIC_SIGMA_ACCOUNT_PRIVATE_KEY"),
			false,
		);
		assert.equal(names.includes("NEXT_PUBLIC_SIGMA_MEMBER_PRIVATE_KEY"), false);
	});

	test("runtime source has no SIGMA_MEMBER alias or fallback", () => {
		const files = walk(ROOT).filter(
			(path) =>
				/\.(ts|tsx|mjs)$/.test(path) &&
				!path.endsWith("sigma-auth-env.test.ts"),
		);
		const hits = files.flatMap((path) => {
			const source = readFileSync(path, "utf8");
			return /process\.env\.SIGMA_MEMBER|SIGMA_MEMBER_PRIVATE_KEY/.test(source)
				? [`${path}: reads SIGMA_MEMBER`]
				: [];
		});
		assert.deepEqual(hits, []);
	});
});
