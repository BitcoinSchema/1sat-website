"use client";

import { toastErrorProps } from "@/constants";
import {
	ImportProfileFromBackupJsonStep,
	importProfileFromBackupJsonStep,
	activeBapIdentity
} from "@/signals/bapIdentity/index";
import { setBapIdentity, removeIdentity } from "@/signals/bapIdentity/client"; // set IDs, setMnemonic
import { useSignals, useSignalEffect} from "@preact/signals-react/runtime";
import toast from "react-hot-toast";
import { IoMdWarning } from "react-icons/io";
import CancelButton from "../common/CancelButton";

interface Props {
	onClose: () => void;
}

export default function SelectProfileJson({ onClose }: Props) {
	useSignals();

	const handleCancel = () => {
		onClose();
		importProfileFromBackupJsonStep.value =
			ImportProfileFromBackupJsonStep.SelectFile;
	};

	const handleLogout = () => {
		removeIdentity();
		onClose();
	};

	const validateJson = (json: Record<string, string>) => {
		if (!json || typeof json !== "object") {
			throw new Error("Invalid JSON");
		}

		if (!json.xprv || typeof json.xprv !== "string") {
			throw new Error("Invalid JSON");
		}

		if (
			!json.ids ||
			!(typeof json.ids === "string" || typeof json.ids === "object")
		) {
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
				setBapIdentity(json);
				handleNext();
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
		importProfileFromBackupJsonStep.value =
			ImportProfileFromBackupJsonStep.ChooseIdentity;
	};

	return (
		<>
			{activeBapIdentity.value ? (
				<p className="my-5">
					You already have an active Identity. If you wish to select
					another one, please log out first.
				</p>
			) : (
				<>
					<p className="mt-2 mb-4">
						Select the backup JSON file you want to import
					</p>

					<div className="w-full my-5">
						<input
							type="file"
							className="file-input file-input-bordered w-full max-w-xs file-input-sm"
							accept=".json"
							onChange={handleSelectFile}
						/>
					</div>
				</>
			)}

			<div className="flex w-full mt-5 justify-end">
				{activeBapIdentity.value && (
					<button
            type="button"
						className="btn btn-accent mr-5"
						onClick={handleLogout}
					>
						Log Out
					</button>
				)}
				<CancelButton handleCancel={handleCancel} />
			</div>
		</>
	);
}
