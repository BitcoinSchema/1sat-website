"use client";

// SECURITY WARNING: This file handles wallet encryption and storage.
// It is designed for CLIENT-SIDE use only (localStorage/sessionStorage).
// Never attempt to run this logic on the server.

import { PrivateKey } from "@bsv/sdk";
import { Buffer } from "buffer";
import { useCallback, useEffect, useState } from "react";
import {
	ENCRYPTION_PREFIX,
	OLD_ORD_PK_KEY,
	OLD_PAY_PK_KEY,
	WALLET_STORAGE_KEY,
} from "@/lib/constants";
import {
	decryptData,
	encryptData,
	generateEncryptionKeyFromPassphrase,
} from "@/lib/encryption";
import type { Keys } from "@/lib/types";

// Types
type StorageType = "localStorage" | "sessionStorage";

interface EncryptedBackupJson {
	encryptedBackup: string;
	pubKey: string; // The public key used as salt
}

// Helper for localStorage/sessionStorage
const getStorage = (storageType: StorageType): Storage | undefined => {
	if (typeof window !== "undefined") {
		switch (storageType) {
			case "localStorage":
				return window.localStorage;
			case "sessionStorage":
				return window.sessionStorage;
		}
	}
	return undefined;
};

// --- Session Storage Handlers (Unencrypted Keys) ---
export const saveSessionKeys = (payPk: string, ordPk: string) => {
	const storage = getStorage("sessionStorage");
	if (storage) {
		storage.setItem(OLD_PAY_PK_KEY, payPk);
		storage.setItem(OLD_ORD_PK_KEY, ordPk);
	}
};

export const loadSessionKeys = (): {
	payPk: string | null;
	ordPk: string | null;
} => {
	const storage = getStorage("sessionStorage");
	if (storage) {
		return {
			payPk: storage.getItem(OLD_PAY_PK_KEY),
			ordPk: storage.getItem(OLD_ORD_PK_KEY),
		};
	}
	return { payPk: null, ordPk: null };
};

export const clearSessionKeys = () => {
	const storage = getStorage("sessionStorage");
	if (storage) {
		storage.removeItem(OLD_PAY_PK_KEY);
		storage.removeItem(OLD_ORD_PK_KEY);
	}
};

// --- Encryption and Decryption Handlers ---
export const saveEncryptedWallet = async (
	walletData: Keys,
	passphrase: string,
): Promise<boolean> => {
	const storage = getStorage("localStorage");
	if (!storage) return false;

	try {
		const payPk = walletData.payPk;
		if (!payPk) throw new Error("No payPk found in wallet data");

		// 1. Derive Public Key from Pay PK to use as Salt
		const pubKey = PrivateKey.fromWif(payPk).toPublicKey().toString();

		// 2. Derive Encryption Key (PBKDF2) using passphrase + pubKey (salt)
		const encryptionKey = await generateEncryptionKeyFromPassphrase(
			passphrase,
			pubKey,
		);

		if (!encryptionKey) throw new Error("Could not derive encryption key.");

		// 3. Serialize Data
		const dataStr = JSON.stringify({
			mnemonic: walletData.mnemonic,
			payPk: walletData.payPk,
			ordPk: walletData.ordPk,
			payDerivationPath: walletData.changeAddressPath,
			ordDerivationPath: walletData.ordAddressPath,
			identityPk: walletData.identityPk,
			identityDerivationPath: walletData.identityAddressPath,
		});
		// Use Buffer.from for consistency with legacy code
		const dataBytes = new Uint8Array(Buffer.from(dataStr, "utf8"));

		// 4. Encrypt
		const iv = crypto.getRandomValues(new Uint8Array(16));
		const encryptedBytes = await encryptData(dataBytes, encryptionKey, iv);

		// 5. Combine IV + Ciphertext using Buffer to match legacy behavior exactly
		const combined = Buffer.concat([
			Buffer.from(iv),
			Buffer.from(encryptedBytes),
		]);

		// 6. Format Output
		const encryptedBackup = ENCRYPTION_PREFIX + combined.toString("base64");

		const backupJson: EncryptedBackupJson = {
			encryptedBackup,
			pubKey,
		};

		storage.setItem(WALLET_STORAGE_KEY, JSON.stringify(backupJson));
		// Dispatch storage event for cross-component updates
		window.dispatchEvent(
			new StorageEvent("storage", {
				key: WALLET_STORAGE_KEY,
				newValue: JSON.stringify(backupJson),
			}),
		);
		return true;
	} catch (error) {
		console.error("Failed to encrypt and save wallet:", error);
		return false;
	}
};

export const loadEncryptedWallet = async (
	passphrase: string,
): Promise<Keys | null> => {
	const storage = getStorage("localStorage");
	if (!storage) return null;

	try {
		const storedItem = storage.getItem(WALLET_STORAGE_KEY);
		if (!storedItem) return null;

		const encryptedKeys = JSON.parse(storedItem) as EncryptedBackupJson;
		if (!encryptedKeys.pubKey || !encryptedKeys.encryptedBackup) {
			throw new Error("Invalid backup format");
		}

		// 1. Derive Encryption Key
		const encryptionKey = await generateEncryptionKeyFromPassphrase(
			passphrase,
			encryptedKeys.pubKey,
		);
		if (!encryptionKey) throw new Error("Could not derive decryption key.");

		// 2. Decode Data using Buffer to match legacy behavior
		const rawData = encryptedKeys.encryptedBackup.replace(
			ENCRYPTION_PREFIX,
			"",
		);
		const combinedBytes = new Uint8Array(Buffer.from(rawData, "base64"));

		// 3. Decrypt (combinedBytes contains IV + Ciphertext, legacy decryptData handles slicing)
		const decryptedBytes = await decryptData(combinedBytes, encryptionKey);

		// Use Buffer for decoding to string
		const jsonStr = Buffer.from(decryptedBytes).toString("utf8");
		const json = JSON.parse(jsonStr);

		// 5. Map back to Keys
		return {
			payPk: json.payPk,
			ordPk: json.ordPk,
			mnemonic: json.mnemonic,
			changeAddressPath: json.payDerivationPath,
			ordAddressPath: json.ordDerivationPath,
			identityPk: json.identityPk,
			identityAddressPath: json.identityDerivationPath,
		};
	} catch (error) {
		console.error("Failed to load and decrypt wallet:", error);
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
		} catch (error) {
			console.error("Error reading from localStorage", error);
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
			} catch (error) {
				console.error("Error writing to localStorage", error);
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
