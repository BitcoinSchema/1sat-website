"use client";

import { encryptionPrefix } from "@/constants";
import type { PendingTransaction } from "@/types/preview";
import type {
	Keys,
	DecryptedBackupJson,
	EncryptedBackupJson,
} from "@/types/wallet";
import { removeIdentity } from "@/signals/bapIdentity/client";
import {
	decryptData,
	generateEncryptionKeyFromPassphrase,
} from "@/utils/encryption";
import {
	bsv20Balances,
	bsv20Utxos,
	changeAddressPath,
	createWalletStep,
	encryptedBackup,
	encryptionKey,
  identityAddressPath,
  identityPk,
	mnemonic,
	ordAddressPath,
	ordPk,
	passphrase,
	payPk,
	pendingTxs,
	showUnlockWalletButton,
	utxos,
} from ".";

export const setPendingTxs = (txs: PendingTransaction[]) => {
	pendingTxs.value = [...txs];
	localStorage.setItem("1satpt", JSON.stringify(txs));
};

export const loadKeysFromBackupFiles = (backupFile: File): Promise<void> => {
	return new Promise((resolve, reject) => {
		if (!backupFile) {
			return reject();
		}
		const f = new FileReader();

		f.onload = (e) => {
			// get the creation date of the file
			//const lastModified = new Date(backupFile.lastModified);

			//const badDateStart = new Date("2021-03-01T00:00:00.000Z");
			//const badDateEnd = new Date("2021-03-05T00:00:00.000Z");

			// check if the file was modified in the bad range
			// if (lastModified > badDateStart && lastModified < badDateEnd) {
			// 	console.log("Invalid backup file based on creation date", lastModified);
			// 	toast.error(
			// 		"Invalid backup file. Please visit our discord here https://discord.gg/D6HKMKUpmV.",
			// 		{
			// 			duration: 999999999,
			// 		},
			// 	);
			// }
			const backup = JSON.parse(e.target?.result as string) as {
				payPk: string;
				ordPk: string;
			};
			// console.log({ backup });

			setPendingTxs([]);
			utxos.value = null;
			payPk.value = backup.payPk;
			ordPk.value = backup.ordPk;
			return resolve();
		};
		f.onerror = (e) => {
			console.error(e);
			return reject(e);
		};
		f.readAsText(backupFile);
	});
};

export const setKeys = (keys: Keys) => {
  payPk.value = keys.payPk;
  ordPk.value = keys.ordPk;
  mnemonic.value = keys.mnemonic ?? null;
  changeAddressPath.value = keys.changeAddressPath ?? null;
  ordAddressPath.value = keys.ordAddressPath ?? null;
  identityPk.value = keys.identityPk ?? null;
  identityAddressPath.value = keys.identityAddressPath ?? null;

	sessionStorage.setItem("1satfk", keys.payPk);
	sessionStorage.setItem("1satok", keys.ordPk);
};

export const loadKeysFromSessionStorage = () => {
	const payPk = sessionStorage.getItem("1satfk");
	const ordPk = sessionStorage.getItem("1satok");

  if (payPk && ordPk) {
		setKeys({ payPk, ordPk });
  }
};

export const loadKeysFromEncryptedStorage = async (passphrase: string) => {
	const encryptedKeysStr = localStorage.getItem("encryptedBackup");

	if (!encryptedKeysStr) {
		return;
	}

	const encryptedKeys = JSON.parse(encryptedKeysStr) as EncryptedBackupJson;

	if (!encryptedKeys.pubKey || !encryptedKeys.encryptedBackup) {
		throw new Error(
			"Load keys error - No public key or encryptedBackup props found in encrypted backup"
		);
	}

	const encryptionKey = await generateEncryptionKeyFromPassphrase(
		passphrase,
		encryptedKeys.pubKey
	);

	if (!encryptionKey) {
		throw new Error("No encryption key found. Unable to decrypt.");
	}

	let decryptedBackupBin: Uint8Array;

  if (!encryptedKeys.encryptedBackup.startsWith(encryptionPrefix)) {
    throw new Error("Invalid encryption prefix");
  }

  debugger
	try {
		decryptedBackupBin = await decryptData(
			Buffer.from(
				encryptedKeys.encryptedBackup.replace(encryptionPrefix, ""),
				"base64"
			),
			encryptionKey
		);
	} catch (error) {
		console.log(error);
		return "FAILED";
	}

  debugger;
	const decryptedBackupStr =
		Buffer.from(decryptedBackupBin).toString("utf-8");

	const decryptedBackup = JSON.parse(
		decryptedBackupStr
	) as DecryptedBackupJson;

	if (!decryptedBackup.payPk || !decryptedBackup.ordPk) {
		throw new Error(
			"Load keys error - No payPk or ordPk props found in decrypted backup"
		);
	}

	setKeys({
		payPk: decryptedBackup.payPk,
		ordPk: decryptedBackup.ordPk,
	mnemonic: decryptedBackup.mnemonic,
	changeAddressPath: decryptedBackup.payDerivationPath,
	ordAddressPath: decryptedBackup.ordDerivationPath,
	...(decryptedBackup.identityPk !== undefined && { identityPk: decryptedBackup.identityPk }),
  	...(decryptedBackup.identityDerivationPath !== undefined && { identityAddressPath: decryptedBackup.identityDerivationPath }),
	});

	return "SUCCESS";
};
