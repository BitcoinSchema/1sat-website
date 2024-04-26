import EnterPassphrase from "@/components/Passphrase";
import { bsvWasmReady } from "@/signals/wallet";
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
			className={`modal backdrop-blur	${open ? "modal-open" : ""}`}
			onClick={() => onClose()}
		>
			<div className="modal-box" onClick={(e) => e.stopPropagation()}>
				{!bsvWasmReady.value && (
					<div className="py-2 rounded my-2">Loading...</div>
				)}

				<EnterPassphrase
					mode={EncryptDecrypt.Decrypt}
					onSubmit={onUnlock}
				/>
			</div>
		</dialog>
	);
}
