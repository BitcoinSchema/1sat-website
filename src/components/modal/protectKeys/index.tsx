"use client";

import { OLD_ORD_PK_KEY, OLD_PAY_PK_KEY } from "@/constants";
import {
	ProtectKeysStep,
	protectKeysStep,
	migrating
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
		console.log("Migrating?", migrating.value);
	}, [migrating.value]);
	
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
			className={`modal backdrop-blur	${open ? "modal-open" : ""}`}
		>
			<div className="modal-box">
				<h3 className="font-bold text-lg">Protect Your Keys</h3>

				{(
					<>
						{open && (
							<div>
								{protectKeysStep.value ===
									ProtectKeysStep.Info && <InfoStep />}

								{protectKeysStep.value ===
									ProtectKeysStep.EnterPassphrase && (
									<EnterPassphraseStep migrating={migrating.value} />
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
				<button type="button" onClick={handleClose}>close</button>
			</form>
		</dialog>
	);
};

export default ProtectKeysModal;
