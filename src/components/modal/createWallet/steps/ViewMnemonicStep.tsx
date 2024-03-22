import MnemonicGrid, { MnemonicGridMode } from "@/components/MnemonicGrid";
import { toastProps } from "@/constants";
import { createWalletStep, mnemonic } from "@/signals/wallet";
import { CreateWalletStep } from "@/types/wallet";
import CopyToClipboard from "react-copy-to-clipboard";
import toast from "react-hot-toast";

interface Props {}

export function ViewMnemonicStep({}: Props) {
  function handleNextStep() {
    createWalletStep.value = CreateWalletStep.VerifyMnemonic;
  }

  return (
    <>
      <div>
        Save the mnemonic in a safe place. On the next step, we will ask you to
        confirm the mnemonic.
      </div>

      <div className="flex justify-between items-center gap-2 p-2 bg-yellow-500 rounded my-2 text-sm font-semibold">
        <div>You will need this to recover your wallet in the future</div>

        <CopyToClipboard
          text={mnemonic.value || ""}
          onCopy={() => {
            toast.success("Copied mnemonic phrase. Careful now!", toastProps);
          }}
        >
          <button
            disabled={!mnemonic.value}
            className="flex px-4 py-1 rounded bg-[#1a1a1a] text-yellow-500  p-2 items-center justify-center cursor-pointer hover:bg-[#222] transition"
          >
            Copy
          </button>
        </CopyToClipboard>
      </div>

      <MnemonicGrid
        mode={MnemonicGridMode.View}
        mnemonic={mnemonic.value ?? undefined}
        onSubmit={handleNextStep}
      />
    </>
  );
}
