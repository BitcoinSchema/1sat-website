"use client";

import { bsvWasmReady, createWalletStep, payPk } from "@/signals/wallet";
import { CreateWalletStep } from "@/types/wallet";
import { useSignals } from "@preact/signals-react/runtime";
import { useMemo } from "react";
import { CreateStep } from "./steps/CreateStep";
import { CreatedStep } from "./steps/CreatedStep";
import { EnterPassphraseStep } from "./steps/EnterPassphraseStep";
import { FundStep } from "./steps/FundStep";
import { VerifyMnemonicStep } from "./steps/VerifyMnemonicStep";
import { ViewMnemonicStep } from "./steps/ViewMnemonicStep";

const CreateWalletModal = ({
	open,
	close,
}: {
	open: boolean;
	close: (signOut?: boolean) => void;
}) => {
	useSignals();

	const alreadyHasKey = useMemo(() => !!payPk.value, []);

	if (alreadyHasKey) {
		console.log({ payPk: payPk.value });
		return (
			<div>
				You already have a wallet! If you really want to make a new
				wallet, sign out first
			</div>
		);
	}

	return (
		<dialog
			id="create_wallet_modal"
			className={`modal backdrop-blur	${open ? "modal-open" : ""}`}
		>
			<div className="modal-box">
				<h3 className="font-bold text-lg">Create New Wallet</h3>

				{!bsvWasmReady.value && (
					<div className="py-2 rounded my-2">Loading...</div>
				)}

				{bsvWasmReady.value && (
					<>
						{createWalletStep.value === CreateWalletStep.Create && (
							<CreateStep />
						)}

						{createWalletStep.value ===
							CreateWalletStep.Created && <CreatedStep />}

						{createWalletStep.value ===
							CreateWalletStep.EnterPassphrase && (
							<EnterPassphraseStep />
						)}

						{createWalletStep.value ===
							CreateWalletStep.ViewMnemonic && (
							<ViewMnemonicStep />
						)}

						{createWalletStep.value ===
							CreateWalletStep.VerifyMnemonic && (
							<VerifyMnemonicStep />
						)}

						{createWalletStep.value === CreateWalletStep.Fund && (
							<FundStep onClose={close} />
						)}
					</>
				)}
			</div>
		</dialog>
	);
};

export default CreateWalletModal;
