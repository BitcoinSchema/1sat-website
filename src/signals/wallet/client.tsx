"use client";

import { PendingTransaction } from "@/types/preview";
import { bsv20Balances, bsv20Utxos, ordPk, payPk, pendingTxs, utxos } from ".";

export const setPendingTxs = (txs: PendingTransaction[]) => {
	pendingTxs.value = [...txs];
	localStorage.setItem("1satpt", JSON.stringify(txs));
};

export const setPayPk = (pk: string) => {
	payPk.value = pk;
	localStorage.setItem("1satfk", JSON.stringify(pk));
};

export const setOrdPk = (pk: string) => {
	ordPk.value = pk;
	localStorage.setItem("1satok", JSON.stringify(pk));
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
			console.log({ backup });
      
      setPendingTxs([]);
      utxos.value = null;
			setPayPk(backup.payPk);
			setOrdPk(backup.ordPk);
			return resolve();
		};
		f.onerror = (e) => {
			console.error(e);
			return reject(e);
		};
		f.readAsText(backupFile);
	});
};

export const clearKeys = () => {
	payPk.value = null;
	ordPk.value = null;
	pendingTxs.value = null;
	utxos.value = null;
	bsv20Utxos.value = null;
	bsv20Balances.value = null;
	localStorage.removeItem("1satfk");
	localStorage.removeItem("1satok");
	localStorage.removeItem("1satpt");
};
