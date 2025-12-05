"use client";

import { useSignals } from "@preact/signals-react/runtime";
import { Lock } from "lucide-react";
import EnterPassphrase from "@/components/Passphrase";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { EncryptDecrypt } from "@/types/wallet";

interface Props {
	open: boolean;
	onClose: () => void;
	onUnlock: () => void;
}

export function EnterPassphraseModal({ open, onClose, onUnlock }: Props) {
	useSignals();
	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="bg-zinc-950 border-zinc-800 rounded-none max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3 font-mono text-lg uppercase tracking-widest text-zinc-200">
						<Lock className="w-5 h-5 text-green-500" />
						Unlock Wallet
					</DialogTitle>
				</DialogHeader>
				<EnterPassphrase mode={EncryptDecrypt.Decrypt} onSubmit={onUnlock} />
			</DialogContent>
		</Dialog>
	);
}
