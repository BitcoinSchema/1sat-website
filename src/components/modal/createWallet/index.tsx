"use client";

import { backupKeys } from "@/components/Wallet/menu";
import { clearKeys } from "@/signals/wallet/client";

const CreateWalletModal = ({
  open,
  close,
}: {
  open: boolean;
  close: (signOut?: boolean) => void;
}) => {
  return (
    <dialog
      id="delete_wallet_modal"
      className={`modal ${open ? "modal-open" : ""}`}
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
                close();
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

            <button className="btn btn-secondary" type="button" onClick={backupKeys}>
              Export Keys
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};

export default CreateWalletModal;
