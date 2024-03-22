"use client";

import {
	ImportWalletFromBackupJsonStep,
	ImportWalletFromMnemonicStep,
	ImportWalletTab,
	bsvWasmReady,
	importWalletFromBackupJsonStep,
	importWalletFromMnemonicStep,
	importWalletTab,
	payPk,
	selectedBackupJson,
} from "@/signals/wallet";
import { useSignals } from "@preact/signals-react/runtime";
import clsx from "clsx";
import { useEffect, useMemo } from "react";
import { SelectFileStep } from "./steps/fromBackupJson/SelectFileStep";
import { EnterPassphraseStep as EnterPassphraseBackupJsonStep } from "./steps/fromBackupJson/EnterPassphraseStep";
import { EnterPassphraseStep as EnterPassphraseMnemonicStep } from "./steps/fromMnemonic/EnterPassphraseStep";
import { DoneStep } from "./steps/DoneStep";
import { EnterMnemonicStep } from "./steps/fromMnemonic/EnterMnemonicStep";
import { GenerateWalletStep } from "./steps/fromMnemonic/GenerateWalletStep";

const ImportWalletModal = ({
	open,
	close,
}: {
	open: boolean;
	close: () => void;
}) => {
	useSignals();

	const alreadyHasKey = useMemo(() => !!payPk.value, []);

	useEffect(() => {
		resetSteps();
	}, [importWalletTab.value]);

	function resetSteps() {
		importWalletFromBackupJsonStep.value =
			ImportWalletFromBackupJsonStep.SelectFile;
		importWalletFromMnemonicStep.value =
			ImportWalletFromMnemonicStep.EnterMnemonic;
		selectedBackupJson.value = null;
	}

	function onClose() {
		importWalletTab.value = null;
		resetSteps();
		close();
	}

	const selectTab = (tab: ImportWalletTab) => {
		importWalletTab.value = tab;
	};

	return (
		<dialog
			id="import_wallet_modal"
			className={`modal ${open ? "modal-open" : ""}`}
		>
			<div className="modal-box">
				<h3 className="font-bold text-lg">
					Import Wallet{" "}
					{importWalletTab.value === ImportWalletTab.FromBackupJson
						? "From Backup Json"
						: importWalletTab.value === ImportWalletTab.FromMnemonic
						? "From Mnemonic"
						: ""}
				</h3>

				{!bsvWasmReady.value && (
					<div className="py-2 rounded my-2">Loading...</div>
				)}

				{bsvWasmReady.value && (
					<>
						{alreadyHasKey && (
							<div>
								You already have a wallet! If you really want to
								import a new wallet, sign out first
							</div>
						)}

						{!alreadyHasKey && (
							<>
								{importWalletTab.value === null && (
									<div className="grid grid-cols-2 gap-3 mt-3">
										<button
											className="btn btn-outline btn-lg rounded-md p-4"
											onClick={() =>
												selectTab(
													ImportWalletTab.FromBackupJson
												)
											}
										>
											From Backup JSON
										</button>

										<button
											className="btn btn-outline btn-lg rounded-md p-4"
											onClick={() =>
												selectTab(
													ImportWalletTab.FromMnemonic
												)
											}
										>
											From Mnemonic
										</button>
									</div>
								)}

								{open &&
									importWalletTab.value ===
										ImportWalletTab.FromBackupJson && (
										<div>
											{importWalletFromBackupJsonStep.value ===
												ImportWalletFromBackupJsonStep.SelectFile && (
												<SelectFileStep />
											)}

											{importWalletFromBackupJsonStep.value ===
												ImportWalletFromBackupJsonStep.EnterPassphrase && (
												<EnterPassphraseBackupJsonStep />
											)}

											{importWalletFromBackupJsonStep.value ===
												ImportWalletFromBackupJsonStep.Done && (
												<DoneStep onDone={close} />
											)}
										</div>
									)}

								{open &&
									importWalletTab.value ===
										ImportWalletTab.FromMnemonic && (
										<div>
											{importWalletFromMnemonicStep.value ===
												ImportWalletFromMnemonicStep.EnterMnemonic && (
												<EnterMnemonicStep />
											)}

											{importWalletFromMnemonicStep.value ===
												ImportWalletFromMnemonicStep.GenerateWallet && (
												<GenerateWalletStep />
											)}

											{importWalletFromMnemonicStep.value ===
												ImportWalletFromMnemonicStep.EnterPassphrase && (
												<EnterPassphraseMnemonicStep />
											)}

											{importWalletFromMnemonicStep.value ===
												ImportWalletFromMnemonicStep.Done && (
												<DoneStep onDone={close} />
											)}
										</div>
									)}
							</>
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

export default ImportWalletModal;
