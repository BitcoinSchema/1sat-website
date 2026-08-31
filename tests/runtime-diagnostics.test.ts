import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, it } from "node:test";
import {
	clearDiagnostics,
	getDiagnosticEvents,
	reportDiagnostic,
	sanitizeDiagnosticContext,
} from "@/lib/runtime-diagnostics";

const secretWif = `K${"1".repeat(51)}`;
const originalInfo = console.info;
const originalError = console.error;

afterEach(() => {
	clearDiagnostics();
	console.info = originalInfo;
	console.error = originalError;
});

describe("runtime diagnostics", () => {
	it("keeps audited wallet paths free of arbitrary console logging", () => {
		const auditedFiles = [
			"providers/hooks/use-wallet-balance.ts",
			"providers/wallet-toolbox-provider.tsx",
			"components/wallet-bridge.tsx",
			"components/app-sidebar.tsx",
			"components/wallet/transaction-timeline.tsx",
			"app/(main)/inscribe/page.tsx",
			"app/(main)/wallet/opns/page.tsx",
			"app/(main)/wallet/permissions/page.tsx",
		];

		for (const file of auditedFiles) {
			const source = readFileSync(join(process.cwd(), file), "utf8");
			assert.doesNotMatch(source, /console\.(?:error|warn|log)\s*\(/, file);
		}
	});

	it("retains only allowlisted, non-secret context", () => {
		const context = sanitizeDiagnosticContext({
			status: "disconnected",
			retryable: true,
			provider: secretWif,
			mnemonic: "never retain this phrase",
			capability: "never retain this token",
			certificate: { contents: "never retain this certificate" },
		});

		assert.deepEqual(context, {
			status: "disconnected",
			retryable: true,
			provider: "unknown",
		});
		assert.doesNotMatch(JSON.stringify(context), /never retain/);
		assert.doesNotMatch(JSON.stringify(context), new RegExp(secretWif));
	});

	it("emits fixed messages and replaces secret-like identifiers", () => {
		console.error = () => undefined;
		const event = reportDiagnostic({
			category: "provider",
			code: "provider.failed",
			operation: secretWif,
			correlationId: secretWif,
			recoverable: true,
			context: { route: "/wallet", seed: secretWif },
		});

		assert.equal(event.message, "Wallet provider operation failed.");
		assert.equal(event.operation, "unknown");
		assert.notEqual(event.correlationId, secretWif);
		assert.deepEqual(event.context, { route: "/wallet" });
		assert.doesNotMatch(JSON.stringify(event), new RegExp(secretWif));
	});

	it("keeps a bounded in-memory event history", () => {
		console.info = () => undefined;
		for (let index = 0; index < 105; index += 1) {
			reportDiagnostic({
				category: "action",
				code: "action.requested",
				operation: "wallet.sync",
				recoverable: true,
			});
		}

		assert.equal(getDiagnosticEvents().length, 100);
	});
});
