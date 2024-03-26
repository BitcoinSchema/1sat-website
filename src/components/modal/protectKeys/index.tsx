"use client";

import { OLD_ORD_PK_KEY, OLD_PAY_PK_KEY } from "@/constants";
import {
	ProtectKeysStep,
	bsvWasmReady,
	protectKeysStep,
} from "@/signals/wallet";
import { setKeys } from "@/signals/wallet/client";
import { useSignals } from "@preact/signals-react/runtime";
import { useEffect } from "react";
import { DoneStep } from "./steps/DoneStep";
import { EnterPassphraseStep } from "./steps/EnterPassphraseStep";
import { InfoStep } from "./steps/InfoStep";

const ProtectKeysModal = ({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) => {
	useSignals();

	function handleClose() {
		protectKeysStep.value = ProtectKeysStep.Info;
		onClose();
	}

	useEffect(() => {
		const payPk = localStorage.getItem(OLD_PAY_PK_KEY);
		const ordPk = localStorage.getItem(OLD_ORD_PK_KEY);

		if (!payPk || !ordPk) {
			return;
		}

		setKeys({ payPk: JSON.parse(payPk), ordPk: JSON.parse(ordPk) });
	}, []);

	return (
		<dialog
			id="protect_wallet_modal"
			className={`modal ${open ? "modal-open" : ""}`}
		>
			<div className="modal-box">
				<h3 className="font-bold text-lg">Protect Your Keys</h3>

				{!bsvWasmReady.value && (
					<div className="py-2 rounded my-2">Loading...</div>
				)}

				{bsvWasmReady.value && (
					<>
						{open && (
							<div>
								{protectKeysStep.value ===
									ProtectKeysStep.Info && <InfoStep />}

								{protectKeysStep.value ===
									ProtectKeysStep.EnterPassphrase && (
									<EnterPassphraseStep />
								)}

								{protectKeysStep.value ===
									ProtectKeysStep.Done && (
									<DoneStep onDone={handleClose} />
								)}
							</div>
						)}
					</>
				)}
			</div>
			<form method="dialog" className="modal-backdrop">
				<button onClick={handleClose}>close</button>
			</form>
		</dialog>
	);
};

export default ProtectKeysModal;
