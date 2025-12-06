import EnterPassphrase from "@/components/Passphrase";
import { createWalletStep } from "@/signals/wallet";
import { CreateWalletStep, EncryptDecrypt } from "@/types/wallet";

type Props = {};

export function EnterPassphraseStep({}: Props) {
	function handleEnterPassphrase() {
		createWalletStep.value = CreateWalletStep.ViewMnemonic;
	}

	return (
		<EnterPassphrase
			mode={EncryptDecrypt.Encrypt}
			onSubmit={() => handleEnterPassphrase()}
		/>
	);
}
