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

