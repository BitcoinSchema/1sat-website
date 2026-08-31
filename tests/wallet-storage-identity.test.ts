import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
	loadOrCreateWalletStorageIdentity,
	type WalletStorageIdentityDependencies,
} from "../lib/wallet-storage-identity";

const LEGACY_ID = `02${"ab".repeat(32)}`;

function profile(
	uuid: string,
	options: {
		databaseIdentity?: string | null;
		failMigrationOnce?: boolean;
	} = {},
) {
	const values = new Map<string, string>();
	let databaseIdentity = options.databaseIdentity ?? null;
	let shouldFail = options.failMigrationOnce ?? false;
	const migrations: Array<[string, string]> = [];
	const dependencies: WalletStorageIdentityDependencies = {
		storage: {
			getItem: (key) => values.get(key) ?? null,
			setItem: (key, value) => {
				values.set(key, value);
			},
		},
		randomUUID: () => uuid,
		readDatabaseIdentity: async () => databaseIdentity,
		migrateDatabaseIdentity: async (_chain, previous, next) => {
			migrations.push([previous, next]);
			if (shouldFail) {
				shouldFail = false;
				throw new Error("migration failed");
			}
			if (databaseIdentity !== previous) return databaseIdentity ?? next;
			databaseIdentity = next;
			return next;
		},
	};

	return { dependencies, migrations, values };
}

describe("wallet storage installation identity", () => {
	test("persists one random identity across reloads", async () => {
		const browser = profile("11111111-1111-4111-8111-111111111111");
		const first = await loadOrCreateWalletStorageIdentity(
			"main",
			browser.dependencies,
		);
		const reload = await loadOrCreateWalletStorageIdentity(
			"main",
			browser.dependencies,
		);

		assert.equal(first, "1sat-web-11111111-1111-4111-8111-111111111111");
		assert.equal(reload, first);
	});

	test("isolated profiles using the same account receive distinct identities", async () => {
		const first = profile("11111111-1111-4111-8111-111111111111");
		const second = profile("22222222-2222-4222-8222-222222222222");

		assert.notEqual(
			await loadOrCreateWalletStorageIdentity("main", first.dependencies),
			await loadOrCreateWalletStorageIdentity("main", second.dependencies),
		);
	});

	test("atomically migrates a legacy public-key store before persisting", async () => {
		const browser = profile("33333333-3333-4333-8333-333333333333", {
			databaseIdentity: LEGACY_ID,
		});

		const identity = await loadOrCreateWalletStorageIdentity(
			"main",
			browser.dependencies,
		);

		assert.equal(identity, "1sat-web-33333333-3333-4333-8333-333333333333");
		assert.deepEqual(browser.migrations, [[LEGACY_ID, identity]]);
		assert.equal([...browser.values.values()][0], identity);
	});

	test("leaves the legacy store usable after failure and retries migration", async () => {
		const browser = profile("44444444-4444-4444-8444-444444444444", {
			databaseIdentity: LEGACY_ID,
			failMigrationOnce: true,
		});

		await assert.rejects(
			loadOrCreateWalletStorageIdentity("main", browser.dependencies),
			/migration failed/,
		);
		assert.equal(browser.values.size, 0);

		const identity = await loadOrCreateWalletStorageIdentity(
			"main",
			browser.dependencies,
		);
		assert.equal(identity, "1sat-web-44444444-4444-4444-8444-444444444444");
		assert.equal(browser.migrations.length, 2);
	});

	test("reuses the database identity when local persistence is stale", async () => {
		const databaseIdentity = "1sat-web-55555555-5555-4555-8555-555555555555";
		const browser = profile("66666666-6666-4666-8666-666666666666", {
			databaseIdentity,
		});
		browser.values.set(
			"1sat-wallet-storage-installation-id",
			"1sat-web-77777777-7777-4777-8777-777777777777",
		);

		assert.equal(
			await loadOrCreateWalletStorageIdentity("main", browser.dependencies),
			databaseIdentity,
		);
		assert.equal([...browser.values.values()][0], databaseIdentity);
		assert.equal(browser.migrations.length, 0);
	});
});
