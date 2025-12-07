"use client";

import { PrivateKey } from "@bsv/sdk";
import { Check, FileJson, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type {
	DecryptedBackupJson,
	EncryptedBackupJson,
	Keys,
	YoursChromeStorageBackup,
	YoursEncryptedBackup,
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

interface PreviewData {
	fileName: string;
	isEncrypted: boolean;
	keys?: Keys; // Only present if plaintext
	encryptedData?: any; // Store raw data to pass later
	type: "legacy-plain" | "legacy-enc" | "yours-enc";
}

export default function ImportJsonPage() {
	const router = useRouter();
	const { setWalletKeys, setEncryptedBackup } = useImportWallet();
	const [previewData, setPreviewData] = useState<PreviewData | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const processFile = useCallback((file: File) => {
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
					const keys: Keys = {
						payPk: json.payPk,
						ordPk: json.ordPk,
						identityPk: json.identityPk,
						mnemonic: json.mnemonic,
						changeAddressPath: json.payDerivationPath || "m/0",
						ordAddressPath: json.ordDerivationPath || "m/0/0",
						identityAddressPath: json.identityDerivationPath,
					};
					setPreviewData({
						fileName: file.name,
						isEncrypted: false,
						keys,
						type: "legacy-plain",
					});
				} else if (isEncryptedBackup(json)) {
					setPreviewData({
						fileName: file.name,
						isEncrypted: true,
						encryptedData: json,
						type: "legacy-enc",
					});
				} else if (validateYoursBackup(json)) {
					setPreviewData({
						fileName: file.name,
						isEncrypted: true,
						encryptedData: json,
						type: "yours-enc",
					});
				} else {
					console.error("Invalid wallet JSON. Keys found:", Object.keys(json));
				}
			} catch (err) {
				console.error("Failed to parse JSON", err);
			}
		};
		reader.readAsText(file);
	}, []);

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

	const handleContinue = () => {
		if (!previewData) return;

		if (previewData.type === "legacy-plain" && previewData.keys) {
			setWalletKeys(previewData.keys);
			router.push("/wallet/import/passphrase");
		} else if (previewData.encryptedData) {
			setEncryptedBackup(previewData.encryptedData);
			router.push("/wallet/import/passphrase");
		}
	};

	const derivedAddresses = useMemo(() => {
		if (!previewData?.keys) return null;
		try {
			const pay = PrivateKey.fromWif(previewData.keys.payPk)
				.toAddress()
				.toString();
			const ord = PrivateKey.fromWif(previewData.keys.ordPk)
				.toAddress()
				.toString();
			const identity = previewData.keys.identityPk
				? PrivateKey.fromWif(previewData.keys.identityPk).toAddress().toString()
				: undefined;
			return { pay, ord, identity };
		} catch (_e) {
			return null;
		}
	}, [previewData]);

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
						{previewData ? (
							<div className="w-full rounded-lg border p-6 space-y-6 bg-muted/10 animate-in fade-in duration-300">
								<div className="flex items-center justify-between border-b pb-4">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-primary/10 rounded-lg">
											<FileJson className="w-6 h-6 text-primary" />
										</div>
										<div>
											<p className="font-medium">{previewData.fileName}</p>
											<div className="flex items-center gap-2 mt-1">
												<Badge variant="outline" className="text-[10px]">
													{previewData.type === "legacy-plain"
														? "Plaintext"
														: "Encrypted"}
												</Badge>
												{previewData.type === "yours-enc" && (
													<Badge variant="secondary" className="text-[10px]">
														Yours Wallet
													</Badge>
												)}
											</div>
										</div>
									</div>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setPreviewData(null)}
										className="text-muted-foreground hover:text-destructive"
									>
										<X className="w-4 h-4" />
									</Button>
								</div>

								{!previewData.isEncrypted && derivedAddresses && (
									<div className="space-y-3">
										<div className="space-y-1">
											<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
												Payment Address
											</span>
											<div className="p-2 bg-muted rounded-md font-mono text-xs break-all">
												{derivedAddresses.pay}
											</div>
										</div>
										<div className="space-y-1">
											<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
												Ordinals Address
											</span>
											<div className="p-2 bg-muted rounded-md font-mono text-xs break-all">
												{derivedAddresses.ord}
											</div>
										</div>
										{derivedAddresses.identity && (
											<div className="space-y-1">
												<span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
													Identity Address
												</span>
												<div className="p-2 bg-muted rounded-md font-mono text-xs break-all">
													{derivedAddresses.identity}
												</div>
											</div>
										)}
									</div>
								)}

								{previewData.isEncrypted && (
									<div className="flex flex-col items-center justify-center py-6 text-center space-y-2 bg-muted/5 rounded-md border border-dashed">
										<p className="text-sm font-medium">
											Encrypted Backup Detected
										</p>
										<p className="text-xs text-muted-foreground max-w-xs">
											You will be asked to enter your password to decrypt this
											file on the next step.
										</p>
									</div>
								)}

								<div className="flex justify-end pt-2">
									<Button onClick={handleContinue} className="w-full sm:w-auto">
										<Check className="w-4 h-4 mr-2" />
										Continue
									</Button>
								</div>
							</div>
						) : (
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
										{isDragging
											? "Drop file here"
											: "Drop your backup file here"}
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
						)}
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
