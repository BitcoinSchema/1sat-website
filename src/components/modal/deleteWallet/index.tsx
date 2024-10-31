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
import { PendingTransaction } from "@/types/preview";
import { CreateWalletStep } from "@/types/wallet";
import { useIDBStorage } from "@/utils/storage";
import { backupKeys } from "@/utils/wallet";
import { useSignals } from "@preact/signals-react/runtime";
import { useCallback } from "react";

const DeleteWalletModal = ({
  open,
  close,
}: {
  open: boolean;
  close: (signOut?: boolean) => void;
}) => {
  useSignals();
  const [pendingTxs, setPendingTxs] = useIDBStorage<PendingTransaction[]>(
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
    <dialog
      id="delete_wallet_modal"
      className={`modal backdrop-blur	${open ? "modal-open" : ""}`}
    >
      <div className="modal-box">
        <h3 className="font-bold text-lg">Are you sure?</h3>
        <p className="py-4">
          This will clear your keys from this browser. Only do this if
          you&apos;re exported your keys already.
        </p>
        <form method="dialog">
          <div className="modal-action">
            <button
              className="btn"
              type="button"
              onClick={() => {
                close(true);
              }}
            >
              Cancel
            </button>
            <button
              className="btn btn-error"
              type="button"
              onClick={() => {
                clearKeys();
                close(true);
              }}
            >
              Sign Out
            </button>
            {/* if there is a button in form, it will close the modal */}

            <button
              className="btn btn-secondary"
              type="button"
              onClick={backupKeys}
            >
              Export Keys
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};

export default DeleteWalletModal;
