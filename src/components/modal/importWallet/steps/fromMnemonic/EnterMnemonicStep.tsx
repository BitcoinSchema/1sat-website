import MnemonicGrid, { MnemonicGridMode } from "@/components/MnemonicGrid";
import {
	ImportWalletFromMnemonicStep,
	importWalletFromMnemonicStep,
	mnemonic,
} from "@/signals/wallet";

interface Props {}

export function EnterMnemonicStep({}: Props) {
	const handleMnemonic = (importedMnemonic?: string) => {
		if (!importedMnemonic) {
			return;
		}

		mnemonic.value = importedMnemonic;

		importWalletFromMnemonicStep.value =
			ImportWalletFromMnemonicStep.GenerateWallet;
	};

	return (
		<>
			<div className="mt-2 mb-4">Enter your mnemonic to continue</div>

			<MnemonicGrid
				mode={MnemonicGridMode.Import}
				onSubmit={({ importedMnemonic }) =>
					handleMnemonic(importedMnemonic)
				}
			/>
		</>
	);
}
