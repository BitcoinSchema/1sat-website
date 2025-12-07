import type { YoursWalletBackup } from "bitcoin-backup";

export enum EncryptDecrypt {
	Encrypt = 0,
	Decrypt = 1,
}

// Legacy 1Sat Encrypted Container
export interface EncryptedBackupJson {
	encryptedBackup?: string;
	pubKey?: string;
}

// Legacy 1Sat Plaintext (Matches Yours Wallet Backup format)
export type DecryptedBackupJson = YoursWalletBackup;

// Yours Wallet Encrypted (Account Export)
export interface YoursEncryptedBackup {
	encryptedKeys: string;
	passKey: string;
	salt: string;
	identityAddress?: string; // Usually present
}

// Yours Wallet Encrypted (Chrome Storage Dump)
export interface YoursChromeStorageBackup {
	selectedAccount: string;
	accounts: {
		[identityAddress: string]: {
			encryptedKeys: string;
			passKey: string;
			salt: string;
			// ... other fields
		};
	};
	version?: number;
}

export type AnyEncryptedBackup =
	| EncryptedBackupJson
	| YoursEncryptedBackup
	| YoursChromeStorageBackup;

export type Keys = {
	payPk: string;
	ordPk: string;
	mnemonic?: string;
	changeAddressPath?: number | string;
	ordAddressPath?: number | string;
	identityPk?: string;
	identityAddressPath?: number | string;
};
