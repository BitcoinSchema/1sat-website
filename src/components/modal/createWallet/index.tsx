"use client";

import { bsvWasmReady, createWalletStep, encryptedBackup } from "@/signals/wallet";
import { loadKeysFromSessionStorage } from "@/signals/wallet/client";
import { CreateWalletStep } from "@/types/wallet";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
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

  useEffect(() => {
    loadKeysFromSessionStorage();

    if (encryptedBackup) {
      alreadyHasKey.value = true;
    }
  }, [encryptedBackup, alreadyHasKey]);


  return (
    <dialog
      id="create_wallet_modal"
      className={`modal backdrop-blur	${open ? "modal-open" : ""}`}
    >
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Create New Wallet</h3>

        {!bsvWasmReady.value && (
          <div className="py-2 rounded my-2">Loading...</div>
        )}

        {alreadyHasKey.value && (<div>
          <div className="text-neutral-content p-4 rounded-box bg-neutral">
            You already have a wallet! If you really want to make a new
            wallet, sign out first.
          </div>
          <div className="modal-action">
            <button className="btn btn-primary" type="button" onClick={() => {
              console.log("sign out")
              router.push("/wallet/delete")
            }}> Sign Out</button>
          </div>
        </div>)}
        {
          !alreadyHasKey.value && bsvWasmReady.value && (
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
            </>
          )
        }
      </div >
    </dialog >
  );
};

export default CreateWalletModal;
