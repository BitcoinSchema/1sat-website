import { PendingTransaction } from "@/context/wallet/types";
import toast from "react-hot-toast";

export const downloadPendingTx = (pendingTransaction: PendingTransaction) => {
  if (!pendingTransaction) {
    toast.error("No pending transaction to download");
    return;
  }
  var dataStr = "data:text/plain;charset=utf-8," + pendingTransaction?.rawTx;

  const clicker = document.createElement("a");
  clicker.setAttribute("href", dataStr);
  clicker.setAttribute("download", `${pendingTransaction.txid}.hex`);
  clicker.click();
};
