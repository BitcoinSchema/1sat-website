"use client";

import {
	ProtectKeysStep,
	bsvWasmReady,
	ordPk,
	payPk,
	protectKeysStep,
} from "@/signals/wallet";
import { useSignals } from "@preact/signals-react/runtime";
import { DoneStep } from "./steps/DoneStep";
import { InfoStep } from "./steps/InfoStep";
import { EnterPassphraseStep } from "./steps/EnterPassphraseStep";
import { useEffect } from "react";
import { OLD_ORD_PK_KEY, OLD_PAY_PK_KEY } from "@/constants";
import { setKeys } from "@/signals/wallet/client";

const ProtectKeysModal = ({
	open,
	close,
}: {
	open: boolean;
	close: () => void;
}) => {
	useSignals();

	function onClose() {
		protectKeysStep.value = ProtectKeysStep.Info;
		close();
	}

	useEffect(() => {
		const payPk = localStorage.getItem(OLD_PAY_PK_KEY);
		const ordPk = localStorage.getItem(OLD_ORD_PK_KEY);

		if (!payPk || !ordPk) {
			return;
		}

		setKeys({ payPk, ordPk });
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
									<DoneStep onDone={close} />
								)}
							</div>
						)}
					</>
				)}
			</div>
			<form method="dialog" className="modal-backdrop">
				<button onClick={onClose}>close</button>
			</form>
		</dialog>
	);
};

export default ProtectKeysModal;
