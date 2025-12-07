"use client";

import { FileJson, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type DecryptedBackupJson,
	type EncryptedBackupJson,
	type Keys,
	type YoursChromeStorageBackup,
	type YoursEncryptedBackup,
} from "@/lib/types";
import { useImportWallet } from "../provider";

const validateJson = (json: any): json is DecryptedBackupJson => {
	if (!json || typeof json !== "object" || json === null) return false;
	if (typeof json.payPk === "string" && typeof json.ordPk === "string")
		return true;
	return false;
};

const isEncryptedBackup = (json: any): json is EncryptedBackupJson => {
	return (
		typeof json?.encryptedBackup === "string" &&
		typeof json?.pubKey === "string"
	);
};

const validateYoursBackup = (
	json: any,
): json is YoursEncryptedBackup | YoursChromeStorageBackup => {
	// Yours Wallet / Panda Wallet format
	return (
		(typeof json?.encryptedKeys === "string" &&
			typeof json?.passKey === "string" &&
			typeof json?.salt === "string") ||
		(json?.accounts && typeof json?.selectedAccount === "string")
	);
};

export default function ImportJsonPage() {
	const router = useRouter();
	const { setWalletKeys, setEncryptedBackup } = useImportWallet();
	const [_selectedFileName, setSelectedFileName] = useState<string | null>(
		null,
	);
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const processFile = useCallback(
		(file: File) => {
			if (!file.name.endsWith(".json") && !file.name.endsWith(".zip")) {
				console.error("Please select a .json file");
				return;
			}

			if (file.name.endsWith(".zip")) {
				console.error("ZIP import not yet implemented");
				return;
			}

			const reader = new FileReader();
			reader.onload = (e) => {
				const content = e.target?.result;
				if (typeof content !== "string") return;

				try {
					const json = JSON.parse(content);
					if (validateJson(json)) {
						// Legacy 1Sat Plain JSON
						setWalletKeys({
							payPk: json.payPk,
							ordPk: json.ordPk,
							identityPk: json.identityPk,
							mnemonic: json.mnemonic,
							changeAddressPath: json.payDerivationPath || "m/0",
							ordAddressPath: json.ordDerivationPath || "m/0/0",
							identityAddressPath: json.identityDerivationPath,
						});
						setSelectedFileName(file.name);
						router.push("/wallet/import/passphrase");
					} else if (isEncryptedBackup(json)) {
						// Legacy 1Sat Encrypted
						setEncryptedBackup(json);
						setSelectedFileName(file.name);
						router.push("/wallet/import/passphrase");
					} else if (validateYoursBackup(json)) {
						// Yours / Panda Wallet Backup
						setEncryptedBackup(json);
						setSelectedFileName(file.name);
						router.push("/wallet/import/passphrase");
					} else {
						console.error(
							"Invalid wallet JSON. Keys found:",
							Object.keys(json),
						);
					}
				} catch (err) {
					console.error("Failed to parse JSON", err);
				}
			};
			reader.readAsText(file);
		},
		[router, setWalletKeys, setEncryptedBackup],
	);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) processFile(file);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files?.[0];
		if (file) processFile(file);
	};

	return (
		<Page className="max-w-2xl">
			<PageHeader>
				<PageTitle>Import Wallet</PageTitle>
			</PageHeader>
			<PageContent>
				<Card>
					<CardHeader>
						<CardTitle>Upload Backup File</CardTitle>
						<CardDescription>
							Select your wallet backup JSON file.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							variant="outline"
							type="button"
							onClick={() => fileInputRef.current?.click()}
							onDragOver={(e) => {
								e.preventDefault();
								setIsDragging(true);
							}}
							onDragLeave={(e) => {
								e.preventDefault();
								setIsDragging(false);
							}}
							onDrop={handleDrop}
							className={`
                        w-full h-auto relative border-2 border-dashed rounded-lg p-8
                        flex flex-col items-center justify-center gap-4
                        cursor-pointer transition-all duration-200 hover:bg-muted/50
                        ${isDragging ? "border-primary bg-primary/10" : "border-border"}
                    `}
						>
							<div
								className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDragging ? "bg-primary/20" : "bg-muted"}`}
							>
								{isDragging ? (
									<FileJson className="w-6 h-6 text-primary" />
								) : (
									<Upload className="w-6 h-6 text-muted-foreground" />
								)}
							</div>
							<div className="text-center">
								<p className="text-sm font-medium text-foreground">
									{isDragging ? "Drop file here" : "Drop your backup file here"}
								</p>
								<p className="text-xs text-muted-foreground mt-1">
									or click to browse
								</p>
							</div>
							<input
								ref={fileInputRef}
								type="file"
								className="hidden"
								accept=".json"
								onChange={handleFileChange}
							/>
						</Button>
						<div className="mt-4 flex justify-start">
							<Button variant="ghost" onClick={() => router.back()}>
								Back
							</Button>
						</div>
					</CardContent>
				</Card>
			</PageContent>
		</Page>
	);
}
