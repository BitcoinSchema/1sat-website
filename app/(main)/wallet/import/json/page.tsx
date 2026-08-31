"use client";

import { Check, FileArchive, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
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
import {
	type DetectedWalletBackup,
	detectWalletBackup,
} from "@/lib/wallet-backup";
import { useImportWallet } from "../provider";

interface PreviewData {
	fileName: string;
	backup: DetectedWalletBackup;
}

export default function ImportJsonPage() {
	const router = useRouter();
	const { setWalletKeys, setEncryptedBackup } = useImportWallet();
	const [previewData, setPreviewData] = useState<PreviewData | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const processFile = useCallback(async (file: File) => {
		setError("");
		setPreviewData(null);
		try {
			if (file.size > 16 * 1024 * 1024) {
				throw new Error("Wallet backup exceeds the 16 MiB import limit");
			}
			const backup = detectWalletBackup(
				new Uint8Array(await file.arrayBuffer()),
				file.name,
			);
			setPreviewData({ fileName: file.name, backup });
		} catch (reason) {
			setError(
				reason instanceof Error ? reason.message : "Unsupported backup file",
			);
		}
	}, []);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) void processFile(file);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files?.[0];
		if (file) void processFile(file);
	};

	const handleContinue = () => {
		if (!previewData) return;

		if (previewData.backup.kind === "plaintext-keys") {
			setWalletKeys(previewData.backup.keys);
			router.push("/wallet/import/passphrase");
		} else {
			setEncryptedBackup(previewData.backup);
			router.push("/wallet/import/passphrase");
		}
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
						{previewData ? (
							<div className="w-full rounded-lg border p-6 space-y-6 bg-muted/10 animate-in fade-in duration-300">
								<div className="flex items-center justify-between border-b pb-4">
									<div className="flex items-center gap-3">
										<div className="p-2 bg-primary/10 rounded-lg">
											<FileArchive className="w-6 h-6 text-primary" />
										</div>
										<div>
											<p className="font-medium">{previewData.fileName}</p>
											<div className="flex items-center gap-2 mt-1">
												<Badge variant="outline" className="text-[10px]">
													{previewData.backup.label}
												</Badge>
												{previewData.backup.kind === "yours-keys" && (
													<Badge variant="secondary" className="text-[10px]">
														Yours Wallet
													</Badge>
												)}
											</div>
										</div>
									</div>
									<Button
										aria-label="Remove selected backup"
										variant="ghost"
										size="icon"
										onClick={() => setPreviewData(null)}
										className="text-muted-foreground hover:text-destructive"
									>
										<X className="w-4 h-4" />
									</Button>
								</div>

								<div className="rounded-md border border-dashed bg-muted/5 p-4 text-center text-xs text-muted-foreground">
									{previewData.backup.requiresPassword
										? "The file will be decrypted and validated before the wallet on this device is replaced."
										: "This legacy file carries its own decryption key. It will still be validated before import."}
								</div>

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
										<FileArchive className="w-6 h-6 text-primary" />
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
							</Button>
						)}
						{error && (
							<p className="mt-4 text-sm text-destructive" role="alert">
								{error}
							</p>
						)}
						<input
							aria-label="Wallet backup file"
							ref={fileInputRef}
							type="file"
							className="sr-only"
							accept=".json,.zip,.bep,application/json,application/zip,text/plain"
							onChange={handleFileChange}
						/>
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
