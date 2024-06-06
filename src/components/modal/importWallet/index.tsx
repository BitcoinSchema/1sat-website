"use client";

import { toastErrorProps } from "@/constants";
import useHash from "@/hooks/useHash";
import {
  ImportWalletFromBackupJsonStep,
  ImportWalletFromMnemonicStep,
  ImportWalletTab,
  bsvWasmReady,
  importWalletFromBackupJsonStep,
  importWalletFromMnemonicStep,
  importWalletTab,
  payPk,
  selectedBackupJson
} from "@/signals/wallet";
import { loadKeysFromSessionStorage, setKeys, type Keys } from "@/signals/wallet/client";
import { useLocalStorage } from "@/utils/storage";
import { useSignals } from "@preact/signals-react/runtime";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { FaKey } from "react-icons/fa";
import { FaFileArrowUp } from "react-icons/fa6";
import { DoneStep } from "./steps/DoneStep";
import { EnterPassphraseStep as EnterPassphraseBackupJsonStep } from "./steps/fromBackupJson/EnterPassphraseStep";
import { SelectFileStep } from "./steps/fromBackupJson/SelectFileStep";
import { EnterMnemonicStep } from "./steps/fromMnemonic/EnterMnemonicStep";
import { EnterPassphraseStep as EnterPassphraseMnemonicStep } from "./steps/fromMnemonic/EnterPassphraseStep";
import { GenerateWalletStep } from "./steps/fromMnemonic/GenerateWalletStep";

const ImportWalletModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  useSignals();
  const router = useRouter();
  const hash = useHash();
  const fragment = new URLSearchParams(hash || "");
  const fromFragment = fragment.get("import") !== null;

  const [encryptedBackup] = useLocalStorage("encryptedBackup");

  const alreadyHasKey = useMemo(() => !!encryptedBackup || (!fromFragment && !!payPk.value), []);

  console.log({fromFragment, key: payPk.value })

  useEffect(() => {
    loadKeysFromSessionStorage();
    if (!encryptedBackup) {

      // Check for the backup parameter in the URL fragment
      const backupKey = fragment.get("import");

      if (backupKey && !selectedBackupJson.value) {
        // Handle the imported backup key
        // e.g., decrypt the key and restore the wallet
        // You can update the encryptedBackup signal or perform any necessary actions

        // base64 decode the backup key
        try {
          const backup = JSON.parse(atob(backupKey)) as Keys;
          console.log("Imported backup");
          setKeys(backup);
          selectedBackupJson.value = JSON.stringify(backup);
          importWalletTab.value = ImportWalletTab.FromBackupJson;
          importWalletFromBackupJsonStep.value = ImportWalletFromBackupJsonStep.EnterPassphrase;
        } catch (e) {
          console.error("Failed to import backup:", e);
          toast.error("Failed to import backup", toastErrorProps);
        }
      }
    }
  }, [encryptedBackup, alreadyHasKey, fragment, selectedBackupJson.value]);


  useEffect(() => {
    resetSteps();
  }, [importWalletTab.value]);

  function resetSteps() {
    importWalletFromBackupJsonStep.value =
      ImportWalletFromBackupJsonStep.SelectFile;
    importWalletFromMnemonicStep.value =
      ImportWalletFromMnemonicStep.EnterMnemonic;
    selectedBackupJson.value = null;
    if (fromFragment) {
      importWalletTab.value = ImportWalletTab.FromBackupJson;
      importWalletFromBackupJsonStep.value = ImportWalletFromBackupJsonStep.EnterPassphrase;
    }
  }

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

        {!bsvWasmReady.value && (
          <div className="py-2 rounded my-2">Loading...</div>
        )}

        {bsvWasmReady.value && (
          <>
            {alreadyHasKey && (<div>
              <div>
                You already have a wallet! If you really want to
                import a new wallet, sign out first.
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
                  <button className="btn btn-primary" type="button" onClick={() => {
                    router.push("/wallet/delete")
                  }}> Sign Out</button>
                </div>
              </form></div>
            )}

            {!alreadyHasKey && (
              <>
                {importWalletTab.value === null && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <button
                      type="button"
                      className="btn btn-outline btn-lg text-sm md:text-base rounded-md p-4 flex flex-nowrap"
                      onClick={() =>
                        selectTab(
                          ImportWalletTab.FromBackupJson
                        )
                      }
                    >
                      <FaFileArrowUp className="text-xl hidden md:block" />
                      From Backup JSON
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline btn-lg text-sm md:text-base rounded-md p-4 flex flex-nowrap"
                      onClick={() =>
                        selectTab(
                          ImportWalletTab.FromMnemonic
                        )
                      }
                    >
                      <FaKey className="text-lg hidden md:block" />
                      From Mnemonic
                    </button>
                  </div>
                )}

                {open &&
                  importWalletTab.value ===
                  ImportWalletTab.FromBackupJson && (
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
                          <DoneStep
                            onDone={handleClose}
                          />
                        )}
                    </div>
                  )}

                {open &&
                  importWalletTab.value ===
                  ImportWalletTab.FromMnemonic && (
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
                          <DoneStep
                            onDone={handleClose}
                          />
                        )}
                    </div>
                  )}
              </>
            )}


          </>
        )}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={handleClose}>close</button>
      </form>
    </dialog>
  );
};

export default ImportWalletModal;