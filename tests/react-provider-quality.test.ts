import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("wallet provider React lifecycle contracts", () => {
	it("starts independent balance reads in one parallel batch", () => {
		const source = read("providers/hooks/use-wallet-balance.ts");
		const parallelBatch = source.slice(
			source.indexOf("const [legacyResults, balanceResult"),
			source.indexOf("const total = balanceResult.totalOutputs"),
		);
		assert.match(parallelBatch, /await Promise\.all/);
		assert.match(parallelBatch, /legacyResultsPromise/);
		assert.match(parallelBatch, /ctx\.wallet\.listOutputs/);
		assert.match(parallelBatch, /listOrdinals\.execute/);
		assert.match(parallelBatch, /getBsv21Balances\.execute/);
	});

	it("invalidates pending unlocks and stale keys when wallet storage changes", () => {
		const source = read("providers/wallet-provider.tsx");
		const storageHandler = source.slice(
			source.indexOf("const handleStorageChange"),
			source.indexOf('window.addEventListener("storage"'),
		);
		assert.match(storageHandler, /lifecycleGenerationRef\.current \+= 1/);
		assert.match(storageHandler, /setIsWalletLocked\(exists\)/);
		assert.match(storageHandler, /setWalletKeys\(null\)/);
		assert.match(storageHandler, /clearCachedEncryptionKey\(\)/);

		const unlock = source.slice(
			source.indexOf("const unlockWallet"),
			source.indexOf("const lockWallet"),
		);
		assert.match(unlock, /generation === lifecycleGenerationRef\.current/);
		assert.match(
			source,
			/const lockWallet[\s\S]*lifecycleGenerationRef\.current \+= 1/,
		);
		assert.match(
			source,
			/const deleteWallet[\s\S]*lifecycleGenerationRef\.current \+= 1/,
		);
	});

	it("lazily initializes mutable receive collections and fully rolls back failed external setup", () => {
		const source = read("providers/wallet-toolbox-provider.tsx");
		assert.match(
			source,
			/useState<ReceiveAddressState>\(\(\) =>[\s\S]*createDefaultReceiveAddressState/,
		);
		assert.match(source, /useState\(\(\) => new Set<string>\(\)\)/);

		const failure = source.slice(
			source.indexOf(
				"\t\t} catch {",
				source.indexOf("const connectExternalWallet"),
			),
			source.indexOf(
				"\t\t} finally {",
				source.indexOf("const connectExternalWallet"),
			),
		);
		for (const cleanup of [
			"walletSessionCleanupRef.current()",
			"walletSessionRef.current?.stop()",
			"pendingResult?.disconnect()",
			"externalServicesRef.current?.close()",
			'resetWalletState("disconnected")',
			"setIsInitializing(false)",
		]) {
			assert.ok(
				failure.includes(cleanup),
				`missing external rollback: ${cleanup}`,
			);
		}
	});
});
