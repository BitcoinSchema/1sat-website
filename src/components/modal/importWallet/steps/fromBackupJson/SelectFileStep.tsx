"use client";

import { toastErrorProps } from "@/constants";
import {
	ImportWalletFromBackupJsonStep,
	importWalletFromBackupJsonStep,
	payPk,
	selectedBackupJson,
} from "@/signals/wallet";
import { setKeys } from "@/signals/wallet/client";
import { backupKeys } from "@/utils/wallet";
import { useSignals } from "@preact/signals-react/runtime";
import toast from "react-hot-toast";
import { IoMdWarning } from "react-icons/io";

export function SelectFileStep() {
	useSignals();

	const validateJson = (json: Record<string, string>) => {
		if (!json || typeof json !== "object") {
			throw new Error("Invalid JSON");
		}

		if (!json.payPk || typeof json.payPk !== "string") {
			throw new Error("Invalid JSON");
		}

		if (!json.ordPk || typeof json.ordPk !== "string") {
			throw new Error("Invalid JSON");
		}
	};

	const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (e) => {
			const content = e.target?.result;

			if (typeof content !== "string") {
				return;
			}

			try {
				const json = JSON.parse(content);
				validateJson(json);
				selectedBackupJson.value = json;

				setKeys({
					mnemonic: json.mnemonic,
					payPk: json.payPk,
					ordPk: json.ordPk,
					changeAddressPath: json.payDerivationPath,
					ordAddressPath: json.ordDerivationPath,
					...(!!json.identityPk && { identityPk: json.identityPk }),
					...(!!json.identityDerivationPath && { identityAddressPath: json.identityDerivationPath }),
				});
				// go to the password step
				importWalletFromBackupJsonStep.value =
					ImportWalletFromBackupJsonStep.EnterPassphrase;
			} catch (error) {
				toast.error(
					"Invalid JSON file. Please select a backup json.",
					toastErrorProps
				);
			}
		};
		reader.readAsText(file);
	};

	const handleNext = () => {
		importWalletFromBackupJsonStep.value =
			ImportWalletFromBackupJsonStep.EnterPassphrase;
	};

	const handleBackup = async () => {
		backupKeys();
	};

	return (
		<>
			<div className="mt-2 mb-4">
				Select the backup JSON file you want to import
			</div>
			{payPk.value && (
				// warning about overwriting existing wallet
				<div className="text-warning-content bg-warning p-2 rounded mb-4 flex">
					<IoMdWarning className="w-6 mt-1" />
					<div className="ml-2">
						Importing a new wallet will clear the existing one. Be
						sure you have a backup before proceeding.
					</div>
				</div>
			)}
			<input
				type="file"
				className="file-input file-input-bordered w-full max-w-xs file-input-sm"
				accept=".json"
				onChange={handleSelectFile}
			/>

			<div className="modal-action">
				{payPk.value && (
					// backup wallet button
					<button
						type="button"
						className="btn btn-primary"
						onClick={handleBackup}
					>
						Backup Wallet
					</button>
				)}
				{selectedBackupJson.value && (
					<button
						type="button"
						disabled={!selectedBackupJson.value}
						className="btn btn-primary disabled:btn-disabled"
						onClick={handleNext}
					>
						Next
					</button>
				)}
			</div>
		</>
	);
}
