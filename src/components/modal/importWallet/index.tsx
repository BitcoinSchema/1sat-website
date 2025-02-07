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
import { FaKey } from "react-icons/fa";
import { FaFileArrowUp } from "react-icons/fa6";
import { DoneStep } from "./steps/DoneStep";
import { EnterPassphraseStep as EnterPassphraseBackupJsonStep } from "./steps/fromBackupJson/EnterPassphraseStep";
import { SelectFileStep } from "./steps/fromBackupJson/SelectFileStep";
import { EnterMnemonicStep } from "./steps/fromMnemonic/EnterMnemonicStep";
import { EnterPassphraseStep as EnterPassphraseMnemonicStep } from "./steps/fromMnemonic/EnterPassphraseStep";
import { GenerateWalletStep } from "./steps/fromMnemonic/GenerateWalletStep";

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
    <dialog
      id="import_wallet_modal"
      className={`modal backdrop-blur	${open ? "modal-open" : ""}`}
    >
      <div className="modal-box">
        <h3 className="font-bold text-lg">
          Import Wallet{" "}
          {importWalletTab.value === ImportWalletTab.FromBackupJson
            ? "From Backup Json"
            : importWalletTab.value === ImportWalletTab.FromMnemonic
              ? "From Mnemonic"
              : ""}
        </h3>

        <>
          {alreadyHasKey && (
            <div>
              <div>
                You already have a wallet!! If you really want to import a new
                wallet, sign out first.
              </div>
              <form method="dialog">
                <div className="modal-action">
                  <button
                    className="btn"
                    type="button"
                    onClick={() => {
                      onClose();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => {
                      router.push("/wallet/delete");
                    }}
                  >
                    {" "}
                    Sign Out
                  </button>
                </div>
              </form>
            </div>
          )}

          {!alreadyHasKey && (
            <>
              {importWalletTab.value === null && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button
                    type="button"
                    className="btn btn-outline btn-lg text-sm md:text-base rounded-md p-4 flex flex-nowrap"
                    onClick={() => selectTab(ImportWalletTab.FromBackupJson)}
                  >
                    <FaFileArrowUp className="text-xl hidden md:block" />
                    From Backup JSON
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline btn-lg text-sm md:text-base rounded-md p-4 flex flex-nowrap"
                    onClick={() => selectTab(ImportWalletTab.FromMnemonic)}
                  >
                    <FaKey className="text-lg hidden md:block" />
                    From Mnemonic
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
        </>

      </div>
    </dialog>
  );
});

export default ImportWalletModal;

ImportWalletModal.displayName = "ImportWalletModal";