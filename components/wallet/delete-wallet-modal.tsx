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
import { useWallet } from "@/providers/wallet-provider";

interface DeleteWalletModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function DeleteWalletModal({
	open,
	onOpenChange,
}: DeleteWalletModalProps) {
	const { deleteWallet, walletKeys } = useWallet();
	const [_isExporting, _setIsExporting] = useState(false);

	const handleExport = (e: React.MouseEvent) => {
		e.preventDefault();
		if (!walletKeys?.mnemonic) return;

		const element = document.createElement("a");
		const file = new Blob([walletKeys.mnemonic], { type: "text/plain" });
		element.href = URL.createObjectURL(file);
		element.download = "1sat-wallet-backup.txt";
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	};

	const handleDelete = async (e: React.MouseEvent) => {
		e.preventDefault();
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
						This action cannot be undone. This will permanently delete your
						wallet keys from your browser's storage.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="py-4 text-sm text-muted-foreground">
					<p>
						Please ensure you have backed up your recovery phrase. Without it,
						you will lose access to your funds forever.
					</p>
				</div>

				<AlertDialogFooter>
					<SoundAlertDialogCancel>Cancel</SoundAlertDialogCancel>

					<Button variant="secondary" onClick={handleExport}>
						<Download className="mr-2 h-4 w-4" />
						Export Keys
					</Button>

					<SoundAlertDialogAction
						onClick={handleDelete}
						sound="decline"
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						Sign Out
					</SoundAlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</SoundAlertDialog>
	);
}
