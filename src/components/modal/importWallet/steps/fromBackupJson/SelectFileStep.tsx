import { toastErrorProps } from "@/constants";
import {
	ImportWalletFromBackupJsonStep,
	importWalletFromBackupJsonStep,
	ordPk,
	payPk,
	selectedBackupJson,
} from "@/signals/wallet";
import { setKeys } from "@/signals/wallet/client";
import toast from "react-hot-toast";

interface Props {}

export function SelectFileStep({}: Props) {
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
					payPk: json.payPk,
					ordPk: json.ordPk,
				});
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

	return (
		<>
			<div className="mb-2">
				<div className="text-sm text-gray-500">
					Select the backup JSON file you want to import
				</div>
			</div>
			<input
				type="file"
				className="file-input file-input-bordered w-full max-w-xs file-input-sm"
				accept=".json"
				onChange={handleSelectFile}
			/>

			{selectedBackupJson.value && (
				<div className="flex justify-end mt-4">
					<button
						className="btn btn-outline btn-sm"
						onClick={handleNext}
					>
						Next
					</button>
				</div>
			)}
		</>
	);
}
