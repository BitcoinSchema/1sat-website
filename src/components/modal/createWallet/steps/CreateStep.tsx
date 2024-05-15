import {
  createWalletStep,
  isCreatingWallet,
  mnemonic,
  ordPk,
  payPk
} from "@/signals/wallet";
import { CreateWalletStep } from "@/types/wallet";
import { randomMnemonic } from "@/utils/keys";

interface Props {
  onClose: () => void;
}

export function CreateStep({
  onClose,
}: Props) {
  async function handleGenerateWallet() {
    if (isCreatingWallet.value) {
      return;
    }

    try {
      isCreatingWallet.value = true;

      const keys = await randomMnemonic();

      payPk.value = keys.payPk;
      ordPk.value = keys.ordPk;
      mnemonic.value = keys.mnemonic ?? null;

      isCreatingWallet.value = false;

      createWalletStep.value = CreateWalletStep.Created;
    } catch (error) {
      isCreatingWallet.value = false;

      console.error(error);
    }
  }

  return (
    <>
      {!isCreatingWallet.value && (
        <>
          <div className="py-2 rounded my-2">
            Click the button below to create a new wallet.
          </div>
          <form method="dialog">
            <div className="modal-action">
              <button
                className="btn"
                type="button"
                onClick={() => onClose()}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleGenerateWallet}
              >
                Generate Wallet
              </button>
            </div>
          </form>
        </>
      )}

      {isCreatingWallet.value && (
        <div className="flex flex-col">
          <div>
            We are now creating your wallet. This can take a few
            seconds. Please wait...
          </div>

          <div className="py-2 flex gap-2 items-center justify-center">
            <span className="loading loading-spinner" />
            <div className="rounded my-2">Creating wallet...</div>
          </div>
        </div>
      )}
    </>
  );
}
