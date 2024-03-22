import EnterPassphrase from "@/components/Passphrase";
import { EncryptDecrypt } from "@/types/wallet";

interface Props {
	open: boolean;
	onClose: () => void;
	onUnlock: () => void;
}

export function EnterPassphraseModal({ open, onClose, onUnlock }: Props) {
	return (
		<dialog
			id="enter_passphrase_modal"
			className={`modal ${open ? "modal-open" : ""}`}
			onClick={() => onClose()}
		>
			<div className="modal-box" onClick={(e) => e.stopPropagation()}>
				<EnterPassphrase
					mode={EncryptDecrypt.Decrypt}
					onSubmit={onUnlock}
				/>
			</div>
		</dialog>
	);
}
