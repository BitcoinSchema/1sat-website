import MnemonicGrid, { MnemonicGridMode } from "@/components/MnemonicGrid";
import {
	ImportWalletFromMnemonicStep,
	importWalletFromMnemonicStep,
	mnemonic,
} from "@/signals/wallet";
import { setKeys } from "@/signals/wallet/client";
import type { WalletKeys } from "@/utils/keys";

export function EnterMnemonicStep() {
	const handleMnemonic = (keys?: WalletKeys) => {
		if (!keys || ! keys.mnemonic) {
      console.log("No keys or mnemonic")
			return;
		}
console.log("HERE HANDLE MNEMOINIC")
		mnemonic.value = keys.mnemonic;

    setKeys(keys);
		importWalletFromMnemonicStep.value =
			ImportWalletFromMnemonicStep.GenerateWallet;
	};

	return (
		<>
			<div className="mt-2 mb-4">Enter your mnemonic to continue</div>

			<MnemonicGrid
				mode={MnemonicGridMode.Import}
				onSubmit={({ keys }) =>
					handleMnemonic(keys)
				}
			/>
		</>
	);
}
