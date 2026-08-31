import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, test } from "node:test";
import { PrivateKey } from "@bsv/sdk";
import { encryptBackup } from "bitcoin-backup";
import { decryptWalletBackup, detectWalletBackup } from "../lib/wallet-backup";
import { migrationDeferredKey } from "../lib/wallet-migration";
import {
	commitWalletBackup,
	createEncryptedWalletBackup,
} from "../lib/wallet-storage";

class MemoryStorage {
	value: string | null;
	failVerification = false;

	constructor(value: string | null = null) {
		this.value = value;
	}

	getItem() {
		return this.value;
	}

	setItem(_key: string, value: string) {
		this.value = this.failVerification ? `${value}-corrupt` : value;
		this.failVerification = false;
	}

	removeItem() {
		this.value = null;
	}
}

const keys = {
	payPk: PrivateKey.fromHex("01".repeat(32)).toWif(),
	ordPk: PrivateKey.fromHex("02".repeat(32)).toWif(),
	identityPk: PrivateKey.fromHex("03".repeat(32)).toWif(),
	mnemonic:
		"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
};

async function fixture(name: string) {
	const encoded = await readFile(
		new URL(`./fixtures/${name}.zip.b64`, import.meta.url),
		"utf8",
	);
	return Uint8Array.from(Buffer.from(encoded.trim(), "base64"));
}

describe("wallet backup and restore", () => {
	test("creates, backs up, removes, and restores without exposing plaintext", async () => {
		const password = "fixture-password-not-a-secret";
		const encrypted = await createEncryptedWalletBackup(keys, password);
		const serialized = JSON.stringify(encrypted);
		assert.equal(serialized.includes(keys.payPk), false);
		assert.equal(serialized.includes(keys.mnemonic), false);

		const storage = new MemoryStorage();
		commitWalletBackup(storage, serialized);
		const downloaded = storage.value;
		storage.removeItem();
		assert.equal(storage.value, null);

		const detected = detectWalletBackup(
			new TextEncoder().encode(downloaded ?? ""),
			"wallet.json",
		);
		const restored = await decryptWalletBackup(detected, password);
		commitWalletBackup(storage, downloaded ?? "");
		assert.equal(restored.payPk, keys.payPk);
		assert.equal(restored.ordPk, keys.ordPk);
		assert.equal(restored.identityPk, keys.identityPk);
		assert.equal(restored.mnemonic, keys.mnemonic);
		assert.equal(storage.value, downloaded);
	});

	test("wrong passwords and failed writes preserve the original wallet", async () => {
		const original = "original-wallet";
		const storage = new MemoryStorage(original);
		storage.failVerification = true;
		assert.throws(() => commitWalletBackup(storage, "replacement"));
		assert.equal(storage.value, original);

		const encrypted = await createEncryptedWalletBackup(
			keys,
			"correct-password",
		);
		const detected = detectWalletBackup(
			new TextEncoder().encode(JSON.stringify(encrypted)),
			"wallet.json",
		);
		await assert.rejects(decryptWalletBackup(detected, "wrong-password"));
		assert.equal(storage.value, original);
	});

	test("reads independently generated current and 2024 Yours fixtures", async () => {
		const current = detectWalletBackup(await fixture("yours-v6"), "yours.zip");
		assert.equal(current.kind, "yours-keys");
		assert.equal(current.version, 6);
		assert.equal(current.archiveVersion, 0);
		assert.equal(current.requiresPassword, true);
		const currentKeys = await decryptWalletBackup(
			current,
			"fixture-password-not-a-secret",
		);
		assert.equal(currentKeys.mnemonic?.split(" ").length, 12);
		await assert.rejects(decryptWalletBackup(current, "wrong-password"));

		const legacy = detectWalletBackup(await fixture("yours-v1"), "yours.zip");
		assert.equal(legacy.kind, "yours-keys");
		assert.equal(legacy.version, 1);
		assert.equal(legacy.archiveVersion, 0);
		assert.equal(legacy.requiresPassword, false);
		assert.ok((await decryptWalletBackup(legacy, "")).identityPk);
	});

	test("reads the current bitcoin-backup 1Sat envelope", async () => {
		const encrypted = await encryptBackup(keys, "portable-password");
		const detected = detectWalletBackup(
			new TextEncoder().encode(encrypted),
			"wallet.bep",
		);
		assert.equal(detected.kind, "bitcoin-backup");
		const restored = await decryptWalletBackup(detected, "portable-password");
		assert.equal(restored.payPk, keys.payPk);
		assert.equal(restored.ordPk, keys.ordPk);
		assert.equal(restored.identityPk, keys.identityPk);
	});

	test("scopes migration deferral to the wallet identity", () => {
		assert.notEqual(
			migrationDeferredKey(keys),
			migrationDeferredKey({
				...keys,
				payPk: PrivateKey.fromHex("04".repeat(32)).toWif(),
			}),
		);
	});
});
