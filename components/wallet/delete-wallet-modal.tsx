"use client";

import { Download, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	SoundAlertDialog,
	SoundAlertDialogAction,
	SoundAlertDialogCancel,
} from "@/components/ui/sound-alert-dialog";
import { WALLET_STORAGE_KEY } from "@/lib/constants";
import { parseEncryptedBackupJson } from "@/lib/wallet-storage";
import { useWallet } from "@/providers/wallet-provider";

interface DeleteWalletModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DeleteWalletModal({
	open,
	onOpenChange,
}: DeleteWalletModalProps) {
	const { deleteWallet } = useWallet();
	const [backupDownloaded, setBackupDownloaded] = useState(false);
	const [error, setError] = useState("");

	const handleExport = (e: React.MouseEvent) => {
		e.preventDefault();
		setError("");
		try {
			const raw = localStorage.getItem(WALLET_STORAGE_KEY);
			if (!raw) throw new Error("No built-in wallet backup was found");
			parseEncryptedBackupJson(JSON.parse(raw));
			const url = URL.createObjectURL(
				new Blob([raw], { type: "application/json" }),
			);
			const element = document.createElement("a");
			element.href = url;
			element.download = `1sat-web-wallet-${new Date().toISOString().slice(0, 10)}.json`;
			document.body.appendChild(element);
			element.click();
			element.remove();
			URL.revokeObjectURL(url);
			setBackupDownloaded(true);
		} catch (reason) {
			setError(
				reason instanceof Error
					? reason.message
					: "Could not export the wallet",
			);
		}
	};

	const handleDelete = async (e: React.MouseEvent) => {
		e.preventDefault();
		if (!backupDownloaded) return;
		deleteWallet();
		onOpenChange(false);
	};

	return (
		<SoundAlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-2">
						<LogOut className="h-5 w-5 text-destructive" />
						Sign Out & Remove Wallet
					</AlertDialogTitle>

					<AlertDialogDescription>
						Download the encrypted backup before removing this wallet from the
						browser.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="py-4 text-sm text-muted-foreground">
					<p>The same wallet password opens the downloaded backup.</p>
					{error && (
						<p className="mt-2 text-destructive" role="alert">
							{error}
						</p>
					)}
				</div>

				<AlertDialogFooter>
					<SoundAlertDialogCancel>Cancel</SoundAlertDialogCancel>

					<Button variant="secondary" onClick={handleExport}>
						<Download className="mr-2 h-4 w-4" />
						{backupDownloaded ? "Backup Downloaded" : "Download Backup"}
					</Button>

					<SoundAlertDialogAction
						onClick={handleDelete}
						sound="decline"
						disabled={!backupDownloaded}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						Sign Out
					</SoundAlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</SoundAlertDialog>
	);
}
