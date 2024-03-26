import EnterPassphrase from "@/components/Passphrase";
import {
	ImportWalletFromMnemonicStep,
	importWalletFromMnemonicStep,
} from "@/signals/wallet";
import { EncryptDecrypt } from "@/types/wallet";

interface Props {}

export function EnterPassphraseStep({}: Props) {
	const onSubmit = () => {
		importWalletFromMnemonicStep.value = ImportWalletFromMnemonicStep.Done;
	};

	return (
		<>
			<EnterPassphrase
				mode={EncryptDecrypt.Encrypt}
				onSubmit={onSubmit}
			/>
		</>
	);
}
