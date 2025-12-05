"use client";

import { createWalletStep } from "@/signals/wallet";
import { loadKeysFromSessionStorage } from "@/signals/wallet/client";
import { CreateWalletStep } from "@/types/wallet";
import { useLocalStorage } from "@/utils/storage";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { CreateStep } from "./steps/CreateStep";
import { CreatedStep } from "./steps/CreatedStep";
import { EnterPassphraseStep } from "./steps/EnterPassphraseStep";
import { FundStep } from "./steps/FundStep";
import { VerifyMnemonicStep } from "./steps/VerifyMnemonicStep";
import { ViewMnemonicStep } from "./steps/ViewMnemonicStep";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, AlertTriangle } from "lucide-react";

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
  const [encryptedBackup] = useLocalStorage("encryptedBackup", undefined);

  useEffect(() => {
    loadKeysFromSessionStorage();

    const eb = localStorage.getItem("encryptedBackup")
    if (eb) {
      alreadyHasKey.value = true;
    }
  }, [encryptedBackup, alreadyHasKey]);


  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && close()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 rounded-none max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-mono text-lg uppercase tracking-widest text-zinc-200">
            <Wallet className="w-5 h-5 text-green-500" />
            Create New Wallet
          </DialogTitle>
        </DialogHeader>

        {alreadyHasKey.value && (
          <div className="space-y-4">
            <div className="p-4 border border-yellow-500/50 bg-yellow-900/20 text-yellow-400">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider mb-2">
                <AlertTriangle className="w-4 h-4" />
                Wallet Exists
              </div>
              <p className="font-mono text-sm text-yellow-300">
                You already have a wallet! If you really want to make a new
                wallet, sign out first.
              </p>
            </div>
            <DialogFooter className="flex gap-2 pt-4 border-t border-zinc-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => close()}
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

        {!alreadyHasKey.value && (
          <>
            {createWalletStep.value === CreateWalletStep.Create && (
              <CreateStep onClose={close} />
            )}

            {createWalletStep.value === CreateWalletStep.Created && (
              <CreatedStep />
            )}

            {createWalletStep.value === CreateWalletStep.EnterPassphrase && (
              <EnterPassphraseStep />
            )}

            {createWalletStep.value === CreateWalletStep.ViewMnemonic && (
              <ViewMnemonicStep />
            )}

            {createWalletStep.value === CreateWalletStep.VerifyMnemonic && (
              <VerifyMnemonicStep />
            )}

            {createWalletStep.value === CreateWalletStep.Fund && (
              <FundStep onClose={close} />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateWalletModal;