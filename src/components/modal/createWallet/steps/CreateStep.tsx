import {
	changeAddressPath,
  createWalletStep,
  isCreatingWallet,
  mnemonic,
  ordAddressPath,
  ordPk,
  payPk
} from "@/signals/wallet";
import { CreateWalletStep } from "@/types/wallet";
import { randomMnemonic } from "@/utils/keys";
import { Button } from "@/components/ui/button";

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
	  changeAddressPath.value = keys.changeAddressPath ?? null;
	  ordAddressPath.value = keys.ordAddressPath ?? null;

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
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => onClose()}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleGenerateWallet}
              >
                Generate Wallet
              </Button>
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
