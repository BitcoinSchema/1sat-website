"use client";

import { toastErrorProps } from "@/constants";
import {
  ImportWalletFromBackupJsonStep,
  ImportWalletFromMnemonicStep,
  ImportWalletTab,
  importWalletFromBackupJsonStep,
  importWalletFromMnemonicStep,
  importWalletTab,
  migrating,
  payPk,
  selectedBackupJson,
} from "@/signals/wallet";
import { setKeys } from "@/signals/wallet/client";
import type { Keys } from "@/types/wallet";
import { useLocalStorage } from "@/utils/storage";
import { useSignals } from "@preact/signals-react/runtime";
import { useRouter } from "next/navigation";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
} from "react";
import toast from "react-hot-toast";
import { DoneStep } from "./steps/DoneStep";
import { EnterPassphraseStep as EnterPassphraseBackupJsonStep } from "./steps/fromBackupJson/EnterPassphraseStep";
import { SelectFileStep } from "./steps/fromBackupJson/SelectFileStep";
import { EnterMnemonicStep } from "./steps/fromMnemonic/EnterMnemonicStep";
import { EnterPassphraseStep as EnterPassphraseMnemonicStep } from "./steps/fromMnemonic/EnterPassphraseStep";
import { GenerateWalletStep } from "./steps/fromMnemonic/GenerateWalletStep";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileUp, Key, Download, AlertTriangle } from "lucide-react";

interface ImportWalletModalProps {
  open: boolean;
  onClose: () => void;
  importData?: Keys | null;
}

const ImportWalletModal = forwardRef<
  { handleImportData: (data: Keys) => void },
  ImportWalletModalProps
>(({ open, onClose, importData }, ref) => {
  useSignals();
  const router = useRouter();
  // const hash = useHash();
  // const fragment = new URLSearchParams(hash || "");

  const [encryptedBackup] = useLocalStorage("encryptedBackup", undefined);

  const alreadyHasKey = useMemo(
    () => !importData && !!payPk.value && encryptedBackup,
    [encryptedBackup, importData, payPk.value],
  );

  const handleImportData = useCallback((data: Keys) => {
    try {
      console.log("Imported backup 2");
      setKeys(data);
      selectedBackupJson.value = JSON.stringify(data);
      importWalletTab.value = ImportWalletTab.FromBackupJson;
      importWalletFromBackupJsonStep.value =
        ImportWalletFromBackupJsonStep.EnterPassphrase;
      console.log("Not sending success to original window yet. Migrating?", migrating.value);
    } catch (e) {
      console.error("Failed to import backup:", e);
      toast.error("Failed to import backup", toastErrorProps);

      // Send failure message back to the original window if it exists
      window.opener?.postMessage(
        { type: "MIGRATION_FAILURE" },
        "https://1satordinals.com",
      );
    }
  }, [migrating.value]);

  useImperativeHandle(ref, () => ({
    handleImportData,
  }));

  useEffect(() => {
    if (importData) {
      console.log("MIGRATING???", migrating.value)
      handleImportData(importData);
    }
  }, [importData, migrating.value, handleImportData]);

  const resetSteps = useCallback(() => {
    console.log("Resetting steps");
    importWalletFromBackupJsonStep.value =
      ImportWalletFromBackupJsonStep.SelectFile;
    importWalletFromMnemonicStep.value =
      ImportWalletFromMnemonicStep.EnterMnemonic;
    selectedBackupJson.value = null;
    if (importData) {
      importWalletTab.value = ImportWalletTab.FromBackupJson;
      importWalletFromBackupJsonStep.value =
        ImportWalletFromBackupJsonStep.EnterPassphrase;
    }
  }, [importData]);

  useEffect(() => {
    if (importWalletTab.value === null) {
      resetSteps();
    }
  }, [importWalletTab.value, resetSteps]);


  function handleClose() {
    onClose();
    importWalletTab.value = null;
    resetSteps();
  }

  const selectTab = (tab: ImportWalletTab) => {
    importWalletTab.value = tab;
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 rounded-none max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-mono text-lg uppercase tracking-widest text-zinc-200">
            <Download className="w-5 h-5 text-green-500" />
            Import Wallet
            {importWalletTab.value === ImportWalletTab.FromBackupJson && (
              <span className="text-zinc-500 text-sm">/ Backup JSON</span>
            )}
            {importWalletTab.value === ImportWalletTab.FromMnemonic && (
              <span className="text-zinc-500 text-sm">/ Mnemonic</span>
            )}
          </DialogTitle>
        </DialogHeader>

        {alreadyHasKey && (
          <div className="space-y-4">
            <div className="p-4 border border-yellow-500/50 bg-yellow-900/20 text-yellow-400">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4" />
                Wallet Exists
              </div>
              <p className="font-mono text-sm text-yellow-300">
                You already have a wallet! If you really want to import a new
                wallet, sign out first.
              </p>
            </div>
            <DialogFooter className="flex gap-2 pt-4 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose()}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => router.push("/wallet/delete")}
              >
                Sign Out
              </Button>
            </DialogFooter>
          </div>
        )}

        {!alreadyHasKey && (
          <>
            {importWalletTab.value === null && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  type="button"
                  className="flex flex-col items-center justify-center gap-3 p-6 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 transition font-mono text-sm uppercase tracking-wider text-zinc-300 hover:text-green-400"
                  onClick={() => selectTab(ImportWalletTab.FromBackupJson)}
                >
                  <FileUp className="w-8 h-8" />
                  Backup JSON
                </button>

                <button
                  type="button"
                  className="flex flex-col items-center justify-center gap-3 p-6 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 transition font-mono text-sm uppercase tracking-wider text-zinc-300 hover:text-green-400"
                  onClick={() => selectTab(ImportWalletTab.FromMnemonic)}
                >
                  <Key className="w-8 h-8" />
                  Mnemonic
                </button>
              </div>
            )}

            {open &&
              importWalletTab.value === ImportWalletTab.FromBackupJson && (
                <div>
                  {importWalletFromBackupJsonStep.value ===
                    ImportWalletFromBackupJsonStep.SelectFile && (
                      <SelectFileStep />
                    )}

                  {importWalletFromBackupJsonStep.value ===
                    ImportWalletFromBackupJsonStep.EnterPassphrase && (
                      <EnterPassphraseBackupJsonStep />
                    )}

                  {importWalletFromBackupJsonStep.value ===
                    ImportWalletFromBackupJsonStep.Done && (
                      <DoneStep onDone={handleClose} />
                    )}
                </div>
              )}

            {open &&
              importWalletTab.value === ImportWalletTab.FromMnemonic && (
                <div>
                  {importWalletFromMnemonicStep.value ===
                    ImportWalletFromMnemonicStep.EnterMnemonic && (
                      <EnterMnemonicStep />
                    )}

                  {importWalletFromMnemonicStep.value ===
                    ImportWalletFromMnemonicStep.GenerateWallet && (
                      <GenerateWalletStep />
                    )}

                  {importWalletFromMnemonicStep.value ===
                    ImportWalletFromMnemonicStep.EnterPassphrase && (
                      <EnterPassphraseMnemonicStep />
                    )}

                  {importWalletFromMnemonicStep.value ===
                    ImportWalletFromMnemonicStep.Done && (
                      <DoneStep onDone={handleClose} />
                    )}
                </div>
              )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
});

export default ImportWalletModal;

ImportWalletModal.displayName = "ImportWalletModal";