"use client"

import { PendingTransaction } from "@/types/preview";
import { ordPk, payPk, pendingTxs } from ".";

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

export const loadKeysFromBackupFiles = (backupFile: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!backupFile) {
      return reject()
    }
    const f = new FileReader();
    f.onload = (e) => {
      const backup = JSON.parse(e.target?.result as string) as { payPk: string, ordPk: string, pendingTxs: PendingTransaction[] | null };
      console.log({backup})
      setPayPk(backup.payPk);
      setOrdPk(backup.ordPk);
      return resolve();
    };
    f.onerror = (e) => {
      console.error(e);
      return reject(e);
    }
    f.readAsText(backupFile);
  })
}