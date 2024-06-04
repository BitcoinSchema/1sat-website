"use client";

import { bsvWasmReady, createWalletStep } from "@/signals/wallet";
import { loadKeysFromSessionStorage } from "@/signals/wallet/client";
import { CreateWalletStep } from "@/types/wallet";
import { useLocalStorage } from "@/utils/storage";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FaSpinner } from "react-icons/fa6";
import { CreateStep } from "./steps/CreateStep";
import { CreatedStep } from "./steps/CreatedStep";
import { EnterPassphraseStep } from "./steps/EnterPassphraseStep";
import { FundStep } from "./steps/FundStep";
import { VerifyMnemonicStep } from "./steps/VerifyMnemonicStep";
import { ViewMnemonicStep } from "./steps/ViewMnemonicStep";

const CreateWalletModal = ({
  open,
  close,
}: {
  open: boolean;
  close: (signOut?: boolean) => void;
}) => {
  useSignals();
  const router = useRouter();
  const alreadyHasKey = useSignal(false);
  const [encryptedBackup] = useLocalStorage("encryptedBackup");

  useEffect(() => {
    loadKeysFromSessionStorage();

    const eb = localStorage.getItem("encryptedBackup")
    if (eb) {
      alreadyHasKey.value = true;
    }
  }, [encryptedBackup, alreadyHasKey]);


  return (
    <dialog
      id="create_wallet_modal"
      className={`modal backdrop-blur	${open ? "modal-open" : ""}`}
    >
      <div className="modal-box h-fit">
        <h3 className="font-bold text-lg">Create New Wallet</h3>

        {!bsvWasmReady.value && (
          <div className="rounded flex w-full h-full items-center justify-center"><FaSpinner className="animate-spin" /></div>
        )}

        {alreadyHasKey.value && (<div className="mt-4">
          <div className="text-neutral-content p-4 rounded-box bg-neutral">
            You already have a wallet! If you really want to make a new
            wallet, sign out first.
          </div>
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
              <button className="btn btn-primary" type="button" onClick={() => {
                router.push("/wallet/delete")
              }}> Sign Out</button>
            </div>
          </form>
        </div>)}

        {!alreadyHasKey.value && bsvWasmReady.value && (
          <>
            {createWalletStep.value === CreateWalletStep.Create && (
              <CreateStep onClose={close} />
            )}

            {createWalletStep.value ===
              CreateWalletStep.Created && <CreatedStep />}

            {createWalletStep.value ===
              CreateWalletStep.EnterPassphrase && (
                <EnterPassphraseStep />
              )}

            {createWalletStep.value ===
              CreateWalletStep.ViewMnemonic && (
                <ViewMnemonicStep />
              )}

            {createWalletStep.value ===
              CreateWalletStep.VerifyMnemonic && (
                <VerifyMnemonicStep />
              )}

            {createWalletStep.value === CreateWalletStep.Fund && (
              <FundStep onClose={close} />
            )}
          </>)}
      </div >
    </dialog >
  );
};

export default CreateWalletModal;