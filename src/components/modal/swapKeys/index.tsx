"use client";

import { swapKeys } from "@/components/Wallet/menu";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

const SwapKeysModal = ({
	open,
	close,
}: {
	open: boolean;
	close: (cancel?: boolean) => void;
}) => {
	const executeSwap = () => {
		swapKeys();
		close(true);
	};

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && close(true)}>
			<DialogContent className="bg-zinc-950 border-zinc-800 rounded-none max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3 font-mono text-lg uppercase tracking-widest text-zinc-200">
						<RefreshCw className="w-5 h-5 text-yellow-500" />
						Swap Keys
					</DialogTitle>
					<DialogDescription className="font-mono text-sm text-zinc-400">
						Advanced recovery tool for misrouted funds.
					</DialogDescription>
				</DialogHeader>

				<div className="p-3 border border-yellow-500/50 bg-yellow-900/20 text-yellow-400">
					<div className="flex items-start gap-2">
						<AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
						<p className="font-mono text-xs text-yellow-300">
							This will swap your ordinals key with your payment key. This
							is useful for recovering BSV or tokens sent to the wrong
							address for your key. You can potentially spend tokens that
							you didn&apos;t mean to spend with this tool. Be careful and
							remember to swap back when your recovery is complete!
						</p>
					</div>
				</div>

				<DialogFooter className="flex gap-2 pt-4 border-t border-zinc-800">
					<Button
						type="button"
						variant="outline"
						onClick={() => close(true)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						variant="secondary"
						onClick={executeSwap}
					>
						<RefreshCw className="w-4 h-4 mr-2" />
						Swap Keys
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default SwapKeysModal;
