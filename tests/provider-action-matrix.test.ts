import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import type { ConnectWalletConfig, ConnectWalletResult } from "@1sat/connect";
import {
	PROVIDER_CAPABILITIES,
	providerCapability,
} from "@/lib/wallet/provider-capabilities";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("provider action matrix", () => {
	it("pins the six product surfaces without inventing auto-detect identity", () => {
		assert.deepEqual(Object.keys(PROVIDER_CAPABILITIES), [
			"built-in-direct",
			"desktop-http",
			"injected",
			"native-webview",
			"hosted-embed",
			"hosted-redirect",
		]);
		for (const surface of [
			"desktop-http",
			"injected",
			"native-webview",
		] as const) {
			assert.equal(PROVIDER_CAPABILITIES[surface].reportedProvider, "brc100");
			assert.equal(
				PROVIDER_CAPABILITIES[surface].discriminator,
				"shared-auto-detect",
			);
			assert.deepEqual(
				PROVIDER_CAPABILITIES[surface].actions,
				PROVIDER_CAPABILITIES["desktop-http"].actions,
			);
		}
		assert.equal(
			providerCapability("injected", "local-wallet-management"),
			"unsupported",
		);
		assert.equal(
			providerCapability("desktop-http", "receive-address"),
			"uncertified",
		);
		assert.equal(
			providerCapability("hosted-redirect", "send-bsv"),
			"experimental",
		);
		assert.equal(
			providerCapability("built-in-direct", "send-bsv"),
			"supported",
		);
	});

	it("matches the installed connector type and export boundary", () => {
		const autoDetectConfig = {
			autoDetect: true,
		} satisfies ConnectWalletConfig;
		const autoDetectFixture = {
			provider: "brc100",
		} satisfies Pick<ConnectWalletResult, "provider">;
		const connectTypes = read(
			"node_modules/@1sat/connect/dist/connectWallet.d.ts",
		);
		const indexTypes = read("node_modules/@1sat/connect/dist/index.d.ts");
		const transportTypes = read(
			"node_modules/@1sat/connect/dist/transport.d.ts",
		);

		assert.equal(autoDetectConfig.autoDetect, true);
		assert.equal(
			autoDetectFixture.provider,
			PROVIDER_CAPABILITIES.injected.reportedProvider,
		);
		assert.match(connectTypes, /provider: string/);
		assert.match(transportTypes, /readonly mode: "embed"/);
		assert.match(transportTypes, /readonly mode: "redirect"/);
		assert.doesNotMatch(indexTypes, /createEmbedTransport/);
		assert.doesNotMatch(indexTypes, /createRedirectTransport/);
	});

	it("keeps external product actions isolated from built-in wallet state", () => {
		const actionPaths = [
			"lib/wallet/action-history.ts",
			"components/wallet/wallet-home-actions.tsx",
			"components/wallet/wallet-home-status.tsx",
			"components/wallet/history-list.tsx",
			"components/wallet/token-grid.tsx",
			"app/(main)/wallet/identity/page.tsx",
			"app/(main)/wallet/opns/page.tsx",
			"app/(main)/inscribe/page.tsx",
			"components/market/buy-button.tsx",
			"components/market/list-ordinal-dialog.tsx",
		];
		const forbidden =
			/@\/providers\/wallet-provider|@\/lib\/wallet-(?:storage|backup|migration)|\bindexedDB\b|\bwalletKeys\b|\bWALLET_STORAGE_KEY\b|\bloadEncryptedWallet\b|\bcreateWebWallet\b/;

		for (const path of actionPaths) {
			assert.doesNotMatch(read(path), forbidden, path);
		}
	});

	it("keeps the external connector branch away from built-in secrets and stores", () => {
		const source = read("providers/wallet-toolbox-provider.tsx");
		const start = source.indexOf("const connectExternalWallet");
		const end = source.indexOf("\n\tuseEffect(() => {", start);
		assert.ok(start >= 0 && end > start);
		const external = source.slice(start, end);
		assert.doesNotMatch(
			external,
			/\bwalletKeys\b|\brootKey\b|\bPrivateKey\b|\bcreateWebWallet\b|\bloadOrCreateWalletStorageIdentity\b|\bWALLET_STORAGE_KEY\b|\bloadEncryptedWallet\b|\bindexedDB\b|wallet-(?:storage|backup|migration)/,
		);
		assert.match(external, /connectWallet\(\{ autoDetect: true \}\)/);
		assert.match(external, /createWalletSession\(result\)/);
	});

	it("invalidates identity, query, address, and sync state before reuse", () => {
		const source = read("providers/wallet-toolbox-provider.tsx");
		const queryStart = source.indexOf("const clearIdentityQueries");
		const queryEnd = source.indexOf("const resetWalletState", queryStart);
		const queryReset = source.slice(queryStart, queryEnd);
		for (const key of [
			'"wallet-balance"',
			'"wallet-actions"',
			'"bap-profile"',
			'"opns-names"',
		]) {
			assert.match(queryReset, new RegExp(key));
		}

		const identityStart = source.indexOf('session.on("identityChange"');
		const identityEnd = source.indexOf(
			'session.on(\n\t\t\t\t"disconnected"',
			identityStart,
		);
		const identityChange = source.slice(identityStart, identityEnd);
		for (const reset of [
			"clearIdentityQueries()",
			"setIsInitialized(false)",
			"setIdentityKey(null)",
			"setDepositAddress(null)",
			"setReceiveAddresses([])",
			"setTrackedAddresses([])",
		]) {
			assert.match(
				identityChange,
				new RegExp(reset.replace(/[()[\]]/g, "\\$&")),
			);
		}

		const disconnect = source.slice(
			identityEnd,
			source.indexOf("session.start()", identityEnd),
		);
		assert.match(
			disconnect,
			/teardownWallet\(statusAfterDisconnect\(reason\)\)/,
		);

		const syncSource = read("providers/hooks/use-sync-engine.ts");
		assert.match(
			syncSource,
			/isInitialized && identityKey && !ownedByWebsite[\s\S]*"provider-managed"/,
		);
	});
});
