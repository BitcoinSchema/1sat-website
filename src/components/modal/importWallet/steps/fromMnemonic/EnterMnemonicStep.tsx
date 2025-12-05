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
		if (!keys || !keys.mnemonic) {
			console.log("No keys or mnemonic");
			return;
		}
		console.log("HERE HANDLE MNEMOINIC");
		mnemonic.value = keys.mnemonic;

		setKeys(keys);
		importWalletFromMnemonicStep.value =
			ImportWalletFromMnemonicStep.GenerateWallet;
	};

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground font-mono">
				Enter your 12-word recovery phrase to restore your wallet
			</p>

			<MnemonicGrid
				mode={MnemonicGridMode.Import}
				onSubmit={({ keys }) => handleMnemonic(keys)}
			/>
		</div>
	);
}
