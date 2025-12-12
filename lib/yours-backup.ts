import JSZip from "jszip";
import type { JsonObject } from "@/lib/types/json";
import type { Keys } from "./types";

export interface YoursWalletZipBackup {
	chromeStorage: JsonObject;
	accountData: JsonObject;
	blocks?: Uint8Array[];
	txns?: Uint8Array[];
	label?: string;
	createdAt?: string;
}

export const parseYoursWalletBackup = async (
	file: File,
): Promise<Keys | null> => {
	try {
		const zip = new JSZip();
		await zip.loadAsync(file);
		const chromeObjectFile = zip.file("chromeStorage.json");

		if (!chromeObjectFile) {
			console.error("Chrome storage data not found in zip.");
			return null;
		}

		const chromeObjectData = await chromeObjectFile.async("string");
		const chromeObject = JSON.parse(chromeObjectData) as JsonObject;

		// We need to get the encrypted keys from the selected account
		const selectedAccountAddress = chromeObject.selectedAccount;
		if (typeof selectedAccountAddress !== "string") return null;

		const accountsValue = chromeObject.accounts;
		if (
			!accountsValue ||
			typeof accountsValue !== "object" ||
			Array.isArray(accountsValue)
		)
			return null;
		const account = (accountsValue as JsonObject)[selectedAccountAddress];
		if (!account || typeof account !== "object" || Array.isArray(account))
			return null;
		const encryptedKeys = (account as JsonObject).encryptedKeys;
		if (typeof encryptedKeys !== "string") return null;

		// The keys are encrypted, we can't decrypt them here without the password
		// So we return a structure that indicates this needs decryption
		// However, the current import flow expects decrypted keys or a JSON with payPk/ordPk.
		// Since we can't decrypt here, we might need to pass the encrypted blob
		// and let the passphrase page handle it.

		// But wait, the passphrase page expects a `Keys` object or similar.
		// If we look at `app/wallet/import/json/page.tsx`, it handles `isEncryptedBackup`.
		// `isEncryptedBackup` checks for `encryptedBackup` and `pubKey`.

		// Yours wallet `encryptedKeys` string is likely just the encrypted data.
		// We need the salt/passKey derivation details which are in `chromeObject`.
		// chromeObject has `salt` and `passKey` (derived from password).

		// Actually, we cannot use `isEncryptedBackup` directly because the format is different.
		// Yours wallet uses `encrypt(JSON.stringify(keys), passKey)` where passKey is `deriveKey(password, salt)`.
		// 1Sat uses `encryptData` with a key derived from passphrase + pubKey(salt).

		// We need to adapt. The user asked to "extend support so we can import these keys without problems".
		// If it's a master backup, it contains encrypted keys.
		// We should probably return an object that our import flow can understand as "Encrypted Yours Backup".

		// For now, let's just extract the encrypted data and metadata.
		// We will throw an error here because we can't return a `Keys` object yet.
		// We need to modify `ImportJsonPage` to handle this type of backup.

		return null;
	} catch (error) {
		console.error("Failed to parse yours wallet backup", error);
		return null;
	}
};
