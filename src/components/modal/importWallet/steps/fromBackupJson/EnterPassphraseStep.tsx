import EnterPassphrase from "@/components/Passphrase";
import {
	ImportWalletFromBackupJsonStep,
	importWalletFromBackupJsonStep,
} from "@/signals/wallet";
import { EncryptDecrypt } from "@/types/wallet";

interface Props {}

export function EnterPassphraseStep({}: Props) {
	const onSubmit = () => {
		importWalletFromBackupJsonStep.value =
			ImportWalletFromBackupJsonStep.Done;
	};

	return (
		<>
			<EnterPassphrase
				mode={EncryptDecrypt.Encrypt}
				onSubmit={onSubmit}
				download={false}
			/>
		</>
	);
}
