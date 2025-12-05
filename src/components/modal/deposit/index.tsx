"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import Deposit from "@/components/Wallet/deposit";

interface DespotModalProps {
	onClose: () => void;
}

const DepositModal: React.FC<DespotModalProps> = ({ onClose }) => {
	return (
		<Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="bg-zinc-950 border-zinc-800 rounded-none max-w-lg">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3 font-mono text-lg uppercase tracking-widest text-zinc-200">
						<Download className="w-5 h-5 text-green-500" />
						Deposit
					</DialogTitle>
				</DialogHeader>
				<div className="relative w-full overflow-hidden">
					<Deposit />
				</div>
				<div className="flex justify-end pt-4 border-t border-zinc-800">
					<Button
						type="button"
						onClick={onClose}
						className="rounded-none bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 font-mono uppercase tracking-wider text-xs"
					>
						Done
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default DepositModal;
