"use client";

import { useState, useRef, useCallback } from "react";
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
import { AlertTriangle, Upload, FileJson, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SelectFileStep() {
	useSignals();
	const [isDragging, setIsDragging] = useState(false);
	const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

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

	const processFile = useCallback((file: File) => {
		if (!file.name.endsWith('.json')) {
			toast.error("Please select a .json file", toastErrorProps);
			return;
		}

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
				setSelectedFileName(file.name);

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
	}, []);

	const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		processFile(file);
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files?.[0];
		if (file) {
			processFile(file);
		}
	};

	const handleNext = () => {
		importWalletFromBackupJsonStep.value =
			ImportWalletFromBackupJsonStep.EnterPassphrase;
	};

	const handleBackup = async () => {
		backupKeys();
	};

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground font-mono">
				Select the backup JSON file you want to import
			</p>

			{payPk.value && (
				<div className="p-3 border border-yellow-500/50 bg-yellow-900/20 rounded">
					<div className="flex items-center gap-2 text-yellow-400 font-mono text-xs uppercase tracking-wider mb-2">
						<AlertTriangle className="w-4 h-4" />
						Warning
					</div>
					<p className="text-sm text-yellow-300 font-mono">
						Importing a new wallet will clear the existing one. Be sure you have a backup before proceeding.
					</p>
				</div>
			)}

			{/* Dropzone */}
			<div
				onClick={() => inputRef.current?.click()}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				className={`
					relative border-2 border-dashed rounded-lg p-8
					flex flex-col items-center justify-center gap-4
					cursor-pointer transition-all duration-200
					${isDragging 
						? "border-primary bg-primary/10" 
						: selectedFileName 
							? "border-primary/50 bg-primary/5" 
							: "border-border hover:border-muted-foreground hover:bg-muted/50"
					}
				`}
			>
				{selectedFileName ? (
					<>
						<div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
							<Check className="w-6 h-6 text-primary" />
						</div>
						<div className="text-center">
							<p className="text-sm font-mono text-foreground">{selectedFileName}</p>
							<p className="text-xs text-muted-foreground mt-1">File selected</p>
						</div>
					</>
				) : (
					<>
						<div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDragging ? "bg-primary/20" : "bg-muted"}`}>
							{isDragging ? (
								<FileJson className="w-6 h-6 text-primary" />
							) : (
								<Upload className="w-6 h-6 text-muted-foreground" />
							)}
						</div>
						<div className="text-center">
							<p className="text-sm font-mono text-foreground">
								{isDragging ? "Drop file here" : "Drop your backup file here"}
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								or click to browse
							</p>
						</div>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<FileJson className="w-4 h-4" />
							<span className="font-mono">.json</span>
						</div>
					</>
				)}
				<input
					ref={inputRef}
					type="file"
					className="hidden"
					accept=".json"
					onChange={handleSelectFile}
				/>
			</div>

			<div className="flex gap-2 pt-4 border-t border-border">
				{payPk.value && (
					<Button
						type="button"
						variant="outline"
						onClick={handleBackup}
						className="gap-2"
					>
						<Download className="w-4 h-4" />
						Backup First
					</Button>
				)}
				{selectedBackupJson.value && (
					<Button
						type="button"
						onClick={handleNext}
						className="ml-auto"
					>
						Continue
					</Button>
				)}
			</div>
		</div>
	);
}
