"use client";

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
  showUnlockWalletButton,
  utxos
} from "@/signals/wallet";
import type { PendingTransaction } from "@/types/preview";
import { CreateWalletStep } from "@/types/wallet";
import { useIDBStorage } from "@/utils/storage";
import { backupKeys } from "@/utils/wallet";
import { useSignals } from "@preact/signals-react/runtime";
import { useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut, AlertTriangle, Download } from "lucide-react";

const DeleteWalletModal = ({
  open,
  close,
}: {
  open: boolean;
  close: (signOut?: boolean) => void;
}) => {
  useSignals();
  const [_pendingTxs, setPendingTxs] = useIDBStorage<PendingTransaction[]>(
    "1sat-pts",
    [],
  );

  const clearKeys = useCallback(() => {
    payPk.value = null;
    ordPk.value = null;
    changeAddressPath.value = null;
    ordAddressPath.value = null;
    identityPk.value = null;
    identityAddressPath.value = null;

    // pendingTxs.value = null;
    setPendingTxs([]);
    utxos.value = null;
    bsv20Utxos.value = null;
    bsv20Balances.value = null;
    localStorage.removeItem("1satfk");
    localStorage.removeItem("1satok");
    localStorage.removeItem("1satpt");
    localStorage.removeItem("encryptedBackup");

    sessionStorage.removeItem("1satfk");
    sessionStorage.removeItem("1satok");

    encryptedBackup.value = null;

    encryptionKey.value = null;
    passphrase.value = null;
    mnemonic.value = null;

    showUnlockWalletButton.value = false;
    createWalletStep.value = CreateWalletStep.Create;
    console.log("Cleared keys");
  }, [setPendingTxs]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && close()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 rounded-none max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-mono text-lg uppercase tracking-widest text-zinc-200">
            <LogOut className="w-5 h-5 text-red-500" />
            Sign Out
          </DialogTitle>
          <DialogDescription className="font-mono text-sm text-zinc-400">
            This will clear your keys from this browser. Only do this if
            you have exported your keys already.
          </DialogDescription>
        </DialogHeader>

        <div className="p-3 border border-yellow-500/50 bg-yellow-900/20 text-yellow-400">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            Warning: This action cannot be undone
          </div>
        </div>

        <DialogFooter className="flex gap-2 pt-4 border-t border-zinc-800">
          <Button
            type="button"
            variant="outline"
            onClick={() => close(true)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={backupKeys}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Keys
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              clearKeys();
              close(true);
            }}
          >
            Sign Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteWalletModal;
