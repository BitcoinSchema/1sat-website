import MnemonicGrid, { MnemonicGridMode } from "@/components/MnemonicGrid";
import { toastProps } from "@/constants";
import { createWalletStep, mnemonic } from "@/signals/wallet";
import { CreateWalletStep } from "@/types/wallet";
import toast from "react-hot-toast";
import { useCopyToClipboard } from "usehooks-ts";

interface Props {}

export function ViewMnemonicStep({}: Props) {

	const [value, copy] = useCopyToClipboard()
	
	function handleNextStep() {
		createWalletStep.value = CreateWalletStep.VerifyMnemonic;
	}

	return (
		<>
			<div>
				Save the mnemonic in a safe place. On the next step, we will ask
				you to confirm the mnemonic.
			</div>

			<div
				role="alert"
				className="my-2 alert alert-warning bg-yellow-500 flex-nowrap"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="stroke-current shrink-0 h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>

				<div className="text-sm font-semibold">
					You will need this to recover your wallet in the future
				</div>

				<div
					onClick={() => {
						copy(mnemonic.value || "")
						toast.success(
							"Copied mnemonic phrase. Careful now!",
							toastProps
						);
					}}
				>
					<button disabled={!mnemonic.value} className="btn btn-sm">
						Copy
					</button>
				</div>
			</div>

			<MnemonicGrid
				mode={MnemonicGridMode.View}
				mnemonic={mnemonic.value ?? undefined}
				onSubmit={handleNextStep}
			/>
		</>
	);
}
