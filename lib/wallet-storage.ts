"use client";

// SECURITY WARNING: This file handles wallet encryption and storage.
// It is designed for CLIENT-SIDE use only (localStorage/sessionStorage).
// Never attempt to run this logic on the server.

import { PrivateKey, Utils } from "@bsv/sdk";
import { useCallback, useEffect, useState } from "react";
import { ENCRYPTION_PREFIX, WALLET_STORAGE_KEY } from "@/lib/constants";
import {
	decryptData,
	generateEncryptionKeyFromPassphrase,
} from "@/lib/encryption";
import { reportDiagnostic } from "@/lib/runtime-diagnostics";
import type { Keys } from "@/lib/types";

export interface EncryptedBackupJson {
	format?: "1sat-web-wallet";
	version?: 1;
	cipher?: "AES-256-GCM";
	encryptedBackup: string;
	pubKey: string; // The public key used as salt
}

type WalletStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const getLocalStorage = (): Storage | undefined => {
	if (typeof window !== "undefined") {
		return window.localStorage;
	}
	return undefined;
};

// --- Encryption Key Cache (for migration re-encryption) ---
let cachedEncryptionKey: Uint8Array | null = null;
let cachedPubKeySalt: string | null = null;

export function clearCachedEncryptionKey(): void {
	cachedEncryptionKey = null;
	cachedPubKeySalt = null;
}

export function parseEncryptedBackupJson(value: unknown): EncryptedBackupJson {
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		throw new Error("Invalid 1Sat wallet backup");
	}
	const backup = value as Record<string, unknown>;
	if (
		typeof backup.encryptedBackup !== "string" ||
		!backup.encryptedBackup.startsWith(ENCRYPTION_PREFIX) ||
		typeof backup.pubKey !== "string"
	) {
		throw new Error("Invalid 1Sat wallet backup");
	}
	if (
		backup.format !== undefined &&
		(backup.format !== "1sat-web-wallet" ||
			backup.version !== 1 ||
			backup.cipher !== "AES-256-GCM")
	) {
		throw new Error("Unsupported 1Sat wallet backup version");
	}
	return backup as unknown as EncryptedBackupJson;
}

/** Replace one storage value and restore the previous value if verification fails. */
export function commitWalletBackup(
	storage: WalletStorage,
	value: string,
): void {
	const previous = storage.getItem(WALLET_STORAGE_KEY);
	try {
		storage.setItem(WALLET_STORAGE_KEY, value);
		if (storage.getItem(WALLET_STORAGE_KEY) !== value) {
			throw new Error("Wallet backup was not persisted");
		}
	} catch (error) {
		if (previous === null) storage.removeItem(WALLET_STORAGE_KEY);
		else storage.setItem(WALLET_STORAGE_KEY, previous);
		throw error;
	}
}

function walletPayload(keys: Keys) {
	return {
		mnemonic: keys.mnemonic,
		payPk: keys.payPk,
		ordPk: keys.ordPk,
		payDerivationPath: keys.changeAddressPath,
		ordDerivationPath: keys.ordAddressPath,
		identityPk: keys.identityPk,
		identityDerivationPath: keys.identityAddressPath,
	};
}

function notifyWalletStorage(value: string): void {
	try {
		window.dispatchEvent(
			new StorageEvent("storage", {
				key: WALLET_STORAGE_KEY,
				newValue: value,
			}),
		);
	} catch {
		reportDiagnostic({
			category: "action",
			code: "action.failed",
			operation: "wallet.storage.notify",
			recoverable: true,
		});
	}
}

async function encryptAuthenticated(
	data: Uint8Array,
	key: Uint8Array,
): Promise<Uint8Array> {
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		key as BufferSource,
		"AES-GCM",
		false,
		["encrypt"],
	);
	const encrypted = new Uint8Array(
		await crypto.subtle.encrypt(
			{ name: "AES-GCM", iv: iv as BufferSource },
			cryptoKey,
			data as BufferSource,
		),
	);
	const combined = new Uint8Array(iv.length + encrypted.length);
	combined.set(iv);
	combined.set(encrypted, iv.length);
	return combined;
}

async function decryptAuthenticated(
	data: Uint8Array,
	key: Uint8Array,
): Promise<Uint8Array> {
	if (data.length <= 28) throw new Error("Invalid encrypted wallet data");
	const cryptoKey = await crypto.subtle.importKey(
		"raw",
		key as BufferSource,
		"AES-GCM",
		false,
		["decrypt"],
	);
	return new Uint8Array(
		await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv: data.slice(0, 12) as BufferSource },
			cryptoKey,
			data.slice(12) as BufferSource,
		),
	);
}

export async function createEncryptedWalletBackup(
	walletData: Keys,
	passphrase: string,
): Promise<EncryptedBackupJson> {
	if (!walletData.payPk) throw new Error("No payment key found");
	const pubKey = PrivateKey.fromWif(walletData.payPk).toPublicKey().toString();
	const encryptionKey = await generateEncryptionKeyFromPassphrase(
		passphrase,
		pubKey,
	);
	if (!encryptionKey) throw new Error("Could not derive encryption key");

	const combined = await encryptAuthenticated(
		new TextEncoder().encode(JSON.stringify(walletPayload(walletData))),
		encryptionKey,
	);

	return {
		format: "1sat-web-wallet",
		version: 1,
		cipher: "AES-256-GCM",
		encryptedBackup: ENCRYPTION_PREFIX + Utils.toBase64(Array.from(combined)),
		pubKey,
	};
}

export async function decryptEncryptedWalletBackup(
	backup: EncryptedBackupJson,
	passphrase: string,
): Promise<Keys> {
	const parsed = parseEncryptedBackupJson(backup);
	const encryptionKey = await generateEncryptionKeyFromPassphrase(
		passphrase,
		parsed.pubKey,
	);
	if (!encryptionKey) throw new Error("Could not derive decryption key");
	const rawData = parsed.encryptedBackup.slice(ENCRYPTION_PREFIX.length);
	const encryptedBytes = new Uint8Array(Utils.toArray(rawData, "base64"));
	const decryptedBytes =
		parsed.format === "1sat-web-wallet"
			? await decryptAuthenticated(encryptedBytes, encryptionKey)
			: await decryptData(encryptedBytes, encryptionKey);
	const json = JSON.parse(new TextDecoder().decode(decryptedBytes)) as Record<
		string,
		unknown
	>;
	if (typeof json.payPk !== "string" || typeof json.ordPk !== "string") {
		throw new Error("Backup is missing wallet keys");
	}
	PrivateKey.fromWif(json.payPk);
	PrivateKey.fromWif(json.ordPk);
	if (json.identityPk !== undefined) {
		if (typeof json.identityPk !== "string") {
			throw new Error("Backup has an invalid identity key");
		}
		PrivateKey.fromWif(json.identityPk);
	}
	return {
		payPk: json.payPk,
		ordPk: json.ordPk,
		mnemonic: typeof json.mnemonic === "string" ? json.mnemonic : undefined,
		changeAddressPath:
			typeof json.payDerivationPath === "string"
				? json.payDerivationPath
				: undefined,
		ordAddressPath:
			typeof json.ordDerivationPath === "string"
				? json.ordDerivationPath
				: undefined,
		identityPk:
			typeof json.identityPk === "string" ? json.identityPk : undefined,
		identityAddressPath:
			typeof json.identityDerivationPath === "string"
				? json.identityDerivationPath
				: undefined,
	};
}

/**
 * Re-encrypt wallet data using the cached encryption key.
 * Used during migration to update stored keys without requiring the passphrase again.
 */
export const reencryptWallet = async (keys: Keys): Promise<boolean> => {
	const storage = getLocalStorage();
	if (!storage || !cachedEncryptionKey || !cachedPubKeySalt) return false;

	try {
		const dataStr = JSON.stringify(walletPayload(keys));
		const dataBytes = new TextEncoder().encode(dataStr);

		const combined = await encryptAuthenticated(dataBytes, cachedEncryptionKey);

		const encryptedBackup =
			ENCRYPTION_PREFIX + Utils.toBase64(Array.from(combined));

		const backupJson: EncryptedBackupJson = {
			format: "1sat-web-wallet",
			version: 1,
			cipher: "AES-256-GCM",
			encryptedBackup,
			pubKey: cachedPubKeySalt,
		};

		const serialized = JSON.stringify(backupJson);
		commitWalletBackup(storage, serialized);
		notifyWalletStorage(serialized);
		return true;
	} catch {
		reportDiagnostic({
			category: "action",
			code: "action.failed",
			operation: "wallet.storage.migrate",
			recoverable: true,
		});
		return false;
	}
};

// --- Encryption and Decryption Handlers ---
export const saveEncryptedWallet = async (
	walletData: Keys,
	passphrase: string,
): Promise<boolean> => {
	const storage = getLocalStorage();
	if (!storage) return false;

	try {
		const backupJson = await createEncryptedWalletBackup(
			walletData,
			passphrase,
		);
		const serialized = JSON.stringify(backupJson);
		commitWalletBackup(storage, serialized);

		// Cache only after durable storage succeeds.
		cachedEncryptionKey =
			(await generateEncryptionKeyFromPassphrase(
				passphrase,
				backupJson.pubKey,
			)) ?? null;
		cachedPubKeySalt = backupJson.pubKey;
		notifyWalletStorage(serialized);
		return true;
	} catch {
		reportDiagnostic({
			category: "action",
			code: "action.failed",
			operation: "wallet.storage.save",
			recoverable: true,
		});
		return false;
	}
};

export const loadEncryptedWallet = async (
	passphrase: string,
): Promise<Keys | null> => {
	const storage = getLocalStorage();
	if (!storage) return null;

	try {
		const storedItem = storage.getItem(WALLET_STORAGE_KEY);
		if (!storedItem) return null;

		const encryptedKeys = parseEncryptedBackupJson(JSON.parse(storedItem));
		const keys = await decryptEncryptedWalletBackup(encryptedKeys, passphrase);

		cachedEncryptionKey =
			(await generateEncryptionKeyFromPassphrase(
				passphrase,
				encryptedKeys.pubKey,
			)) ?? null;
		cachedPubKeySalt = encryptedKeys.pubKey;
		return keys;
	} catch {
		reportDiagnostic({
			category: "action",
			code: "action.failed",
			operation: "wallet.storage.unlock",
			recoverable: true,
		});
		return null;
	}
};

// --- Settings Storage Hook ---
export const useSettingsStorage = <T>(
	storageKey: string,
	initialValue: T,
): [T, (value: T) => void] => {
	const [storedValue, setStoredValue] = useState<T>(() => {
		if (typeof window === "undefined") return initialValue;
		try {
			const item = window.localStorage.getItem(storageKey);
			return item ? JSON.parse(item) : initialValue;
		} catch {
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation: "wallet.settings.read",
				recoverable: true,
			});
			return initialValue;
		}
	});

	const setValue = useCallback(
		(value: T) => {
			try {
				setStoredValue(value);
				if (typeof window !== "undefined") {
					const newValue = JSON.stringify(value);
					window.localStorage.setItem(storageKey, newValue);
					window.dispatchEvent(
						new StorageEvent("storage", { key: storageKey, newValue }),
					);
				}
			} catch {
				reportDiagnostic({
					category: "action",
					code: "action.failed",
					operation: "wallet.settings.write",
					recoverable: true,
				});
			}
		},
		[storageKey],
	);

	useEffect(() => {
		const handleStorageChange = (event: StorageEvent) => {
			if (event.key === storageKey && event.newValue) {
				setStoredValue(JSON.parse(event.newValue));
			}
		};
		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, [storageKey]);

	return [storedValue, setValue];
};
