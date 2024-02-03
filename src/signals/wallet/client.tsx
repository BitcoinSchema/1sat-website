"use client"

import { PendingTransaction } from "@/types/preview";
import { backupFile, ordPk, payPk, pendingTxs } from ".";

export const setPendingTxs = (txs: PendingTransaction[]) => {
  pendingTxs.value = [...txs]
  localStorage.setItem("1satpt", JSON.stringify(txs));
}

export const setPayPk = (pk: string) => {
  payPk.value = pk;
  localStorage.setItem("1satfk", JSON.stringify(pk));
};

export const setOrdPk = (pk: string) => {
  ordPk.value = pk;
  localStorage.setItem("1satok", JSON.stringify(pk));
};

export const loadKeysFromBackupFiles = (): Promise<void> => {
  return new Promise((resolve, eject) => {
    if (!backupFile?.value) {
      return resolve()
    }
    // load data from backupFile.value which is a File
    const f = new FileReader();
    f.onload = (e) => {
      const backup = JSON.parse(e.target?.result as string);
      payPk.value = backup.payPk;
      ordPk.value = backup.ordPk;
      return resolve();
    };
    f.onerror = (e) => {
      console.error(e);
      return eject(e);
    }
    f.readAsText(backupFile.value);
  })
}