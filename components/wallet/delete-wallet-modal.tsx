"use client";

import { AlertTriangle, Download, LogOut } from "lucide-react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="bg-background border-destructive sm:max-w-[425px]">
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-2 text-destructive">
						<LogOut className="h-5 w-5" />
						Sign Out & Remove Wallet
					</AlertDialogTitle>
					<AlertDialogDescription className="text-muted-foreground">
						This will remove your wallet keys from this browser's storage.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="p-4 border border-yellow-500/20 bg-yellow-500/10 rounded-md text-yellow-600 dark:text-yellow-400 text-sm">
					<div className="flex items-center gap-2 font-semibold mb-1">
						<AlertTriangle className="h-4 w-4" />
						Warning: This action is irreversible
					</div>
					<p>
						Make sure you have your recovery phrase saved safely. Without it,
						you will lose access to your funds forever.
					</p>
				</div>

				<AlertDialogFooter className="gap-2 sm:gap-0">
					{/* AlertDialogCancel implies cancel, action implies confirm. 
                        We want a secondary 'Export' action which acts neither as cancel nor confirm in the traditional sense,
                        but triggers an action. We can use Button inside footer.
                    */}
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<Button variant="secondary" onClick={handleExport}>
						<Download className="mr-2 h-4 w-4" />
						Export Keys
					</Button>
					<AlertDialogAction
						onClick={handleDelete}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						Sign Out
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
