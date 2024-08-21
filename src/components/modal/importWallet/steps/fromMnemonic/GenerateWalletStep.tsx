import {
	ImportWalletFromMnemonicStep,
	importWalletFromMnemonicStep,
	mnemonic,
	ordPk,
	payPk,
} from "@/signals/wallet";
import { setKeys } from "@/signals/wallet/client";
import { findKeysFromMnemonic } from "@/utils/keys";
import { useSignal } from "@preact/signals-react";
import { useEffect } from "react";
import { FaCheck } from "react-icons/fa";

export function GenerateWalletStep() {
	const isGeneratingWallet = useSignal(false);

	useEffect(() => {
		async function run() {
			if (!mnemonic.value) {
				return;
			}

			isGeneratingWallet.value = true;

			const keys = await findKeysFromMnemonic(mnemonic.value);

			if (keys) {
				setKeys({
					payPk: keys.payPk,
					ordPk: keys.ordPk,
					mnemonic: mnemonic.value,
					ordAddressPath: keys.ordAddressPath,
					changeAddressPath: keys.changeAddressPath,
				});
			}

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
						We are now importing your wallet. This can take a few
						seconds. Please wait...
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
					<div className="loading loading-spinner text-warning" />
				</div>
			)}

			{!isGeneratingWallet.value && payPk.value && (
				<div className="flex justify-end mt-4">
					{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
          <button className="btn btn-primary" onClick={handleNext}>
						Next
					</button>
				</div>
			)}
		</>
	);
}
