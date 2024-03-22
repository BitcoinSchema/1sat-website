import {
	changeAddressPath,
	createWalletStep,
	isCreatingWallet,
	mnemonic,
	ordAddressPath,
	ordPk,
	payPk,
} from "@/signals/wallet";
import { CreateWalletStep } from "@/types/wallet";
import { randomMnemonic } from "@/utils/keys";
import { FaSpinner } from "react-icons/fa";

interface Props {}

export function CreateStep({}: Props) {
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
			// changeAddressPath.value = keys.changeAddressPath ?? null;
			// ordAddressPath.value = keys.ordAddressPath ?? null;

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
								onClick={() => close()}
							>
								Cancel
							</button>
							<button
								className="btn btn-secondary"
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
					<div className="py-2 flex gap-2 items-center">
						<span className="loading loading-spinner"></span>
						<div className=" rounded my-2">Creating wallet...</div>
					</div>
				</div>
			)}
		</>
	);
}
