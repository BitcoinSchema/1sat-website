import MnemonicGrid, { MnemonicGridMode } from "@/components/MnemonicGrid";
import { createWalletStep, mnemonic } from "@/signals/wallet";
import { CreateWalletStep } from "@/types/wallet";

type Props = {};

export function VerifyMnemonicStep({}: Props) {
	function handleOnSubmit(verified?: boolean) {
		// console.log({ verified });

		if (typeof verified === "undefined") {
			return;
		}

		if (verified) {
			createWalletStep.value = CreateWalletStep.Fund;
		}
	}

	return (
		<>
			<div>Fill out the mnemonic words in order to make sure you saved it.</div>

			<MnemonicGrid
				mode={MnemonicGridMode.Prove}
				mnemonic={mnemonic.value ?? undefined}
				onSubmit={({ verified }) => handleOnSubmit(verified)}
				onWordClick={(word) => {
					console.log(word);
				}}
			/>
		</>
	);
}
