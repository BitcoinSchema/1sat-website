import EnterPassphrase from "@/components/Passphrase";
import { OLD_ORD_PK_KEY, OLD_PAY_PK_KEY } from "@/constants";
import {
	hasUnprotectedKeys,
	ProtectKeysStep,
	protectKeysStep,
} from "@/signals/wallet";
import { EncryptDecrypt } from "@/types/wallet";

interface Props {
	migrating?: boolean;
}

export function EnterPassphraseStep({ migrating }: Props) {
	const onSubmit = () => {
		localStorage.removeItem(OLD_PAY_PK_KEY);
		localStorage.removeItem(OLD_ORD_PK_KEY);
		hasUnprotectedKeys.value = false;
		protectKeysStep.value = ProtectKeysStep.Done;
	};

	return (
		<EnterPassphrase
			mode={EncryptDecrypt.Encrypt}
			onSubmit={onSubmit}
			migrating={migrating}
		/>
	);
}
