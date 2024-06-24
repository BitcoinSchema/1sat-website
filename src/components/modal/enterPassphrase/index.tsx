"use client"

import EnterPassphrase from "@/components/Passphrase";
import { bsvWasmReady } from "@/signals/wallet";
import { EncryptDecrypt } from "@/types/wallet";
import { useSignals } from "@preact/signals-react/runtime";

interface Props {
	open: boolean;
	onClose: () => void;
	onUnlock: () => void;
}

export function EnterPassphraseModal({ open, onClose, onUnlock }: Props) {
	useSignals();
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<dialog
			id="enter_passphrase_modal"
			className={`modal backdrop-blur	${open ? "modal-open" : ""}`}
			onClick={() => onClose()}
		>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<div className="modal-box" onClick={(e) => e.stopPropagation()}>
				{!bsvWasmReady.value && (
					<div className="py-2 rounded my-2">Loading...</div>
				)}

				<EnterPassphrase mode={EncryptDecrypt.Decrypt} onSubmit={onUnlock} />
			</div>
		</dialog>
	);
}
