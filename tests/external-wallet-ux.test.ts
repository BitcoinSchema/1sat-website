import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("external wallet UX contracts", () => {
	it("keeps the provider-derived receive address visible", () => {
		const sidebar = read("components/app-sidebar.tsx");
		assert.match(
			sidebar,
			/depositAddress \|\| \(isExternal \? "" : identityAddress \|\| payAddress\)/,
		);
		assert.doesNotMatch(sidebar, /isExternal\s*\?\s*""\s*:\s*depositAddress/);
		assert.match(sidebar, /\{initError && \(/);
	});

	it("never classifies an external provider's current address as legacy", () => {
		const provider = read("providers/wallet-toolbox-provider.tsx");
		const balanceHook = read("providers/hooks/use-wallet-balance.ts");
		const home = read("components/wallet/wallet-home.tsx");

		assert.match(
			provider,
			/includeLegacyFunding: connectionMode === "built-in"/,
		);
		assert.match(
			balanceHook,
			/const legacyResultsPromise = includeLegacyFunding/,
		);
		assert.match(home, /connectionMode === "built-in" && legacyBalance > 0/);
	});

	it("shows a balance returned by a compatible external provider", () => {
		const home = read("components/wallet/wallet-home.tsx");
		const sidebar = read("components/app-sidebar.tsx");
		assert.match(
			home,
			/connectionMode === "built-in" \|\| isBalanceLoading \|\| balance !== null/,
		);
		assert.match(sidebar, /isExternal && !hasWalletBalance/);
	});
});
