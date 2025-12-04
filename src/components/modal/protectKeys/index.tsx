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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Shield } from "lucide-react";

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
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
			<DialogContent className="bg-zinc-950 border-zinc-800 rounded-none max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3 font-mono text-lg uppercase tracking-widest text-zinc-200">
						<Shield className="w-5 h-5 text-green-500" />
						Protect Your Keys
					</DialogTitle>
				</DialogHeader>

				{open && (
					<div>
						{protectKeysStep.value === ProtectKeysStep.Info && (
							<InfoStep />
						)}

						{protectKeysStep.value === ProtectKeysStep.EnterPassphrase && (
							<EnterPassphraseStep migrating={migrating.value} />
						)}

						{protectKeysStep.value === ProtectKeysStep.Done && (
							<DoneStep onDone={handleClose} />
						)}
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default ProtectKeysModal;
