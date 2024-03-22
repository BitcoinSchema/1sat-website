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
			<MnemonicGrid
				mode={MnemonicGridMode.Import}
				onSubmit={({ importedMnemonic }) =>
					handleMnemonic(importedMnemonic)
				}
			/>
		</>
	);
}
