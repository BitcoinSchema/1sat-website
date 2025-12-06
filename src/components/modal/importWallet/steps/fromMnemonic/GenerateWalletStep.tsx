import { useSignal } from "@preact/signals-react";
import { useEffect } from "react";
import { FaCheck } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import {
	ImportWalletFromMnemonicStep,
	importWalletFromMnemonicStep,
	mnemonic,
	payPk,
} from "@/signals/wallet";

export function GenerateWalletStep() {
	const isGeneratingWallet = useSignal(false);

	useEffect(() => {
		async function run() {
			if (!mnemonic.value) {
				return;
			}

			isGeneratingWallet.value = true;

			// const keys = await findKeysFromMnemonic(mnemonic.value);

			// if (keys) {
			// 	setKeys({
			// 		payPk: keys.payPk,
			// 		ordPk: keys.ordPk,
			// 		mnemonic: mnemonic.value,
			// 		ordAddressPath: keys.ordAddressPath,
			// 		changeAddressPath: keys.changeAddressPath,
			// 	});
			// }

			// TODO: Kick off import utxos process for ordinals and payment utxos

			isGeneratingWallet.value = false;
		}

		run();

		return () => {
			isGeneratingWallet.value = false;
		};
	}, [isGeneratingWallet, mnemonic.value]);

	function handleNext() {
		importWalletFromMnemonicStep.value =
			ImportWalletFromMnemonicStep.EnterPassphrase;
	}

	return (
		<>
			<div className="mb-2">
				{isGeneratingWallet.value && (
					<div className="text-sm text-gray-500">
						We are now importing your wallet. This can take a few seconds.
						Please wait...
					</div>
				)}

				{!isGeneratingWallet.value && payPk.value && (
					<div
						role="alert"
						className="my-2 border border-green-400 p-3 rounded-lg flex items-center text-green-400 bg-[#1a1a1a] text-sm"
					>
						<FaCheck className="mr-2" />
						<span>Your wallet has been successfully imported!</span>
					</div>
				)}
			</div>

			{isGeneratingWallet.value && (
				<div className="flex items-center justify-center mt-4">
					<div className="loading loading-spinner text-amber-500" />
				</div>
			)}

			{!isGeneratingWallet.value && payPk.value && (
				<div className="flex justify-end mt-4">
					<Button onClick={handleNext}>Next</Button>
				</div>
			)}
		</>
	);
}
