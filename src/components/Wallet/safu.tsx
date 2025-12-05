"use client";

import { Button } from "@/components/ui/button";
import { showUnlockWalletModal } from "@/signals/wallet";
import { useSignals } from "@preact/signals-react/runtime";
import { Lock, Shield } from "lucide-react";

const SAFU = () => {
	useSignals();

	return (
		<div
			className="w-full flex-1 flex flex-col items-center justify-center bg-background cursor-pointer"
			onClick={() => {
				showUnlockWalletModal.value = true;
			}}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					showUnlockWalletModal.value = true;
				}
			}}
			role="button"
			tabIndex={0}
		>
			<div className="flex flex-col items-center gap-6 p-8 border border-border bg-card max-w-md w-full mx-4 rounded-lg">
				<div className="flex items-center gap-3">
					<Shield className="w-8 h-8 text-primary" />
					<Lock className="w-6 h-6 text-muted-foreground" />
				</div>

				<div className="text-center">
					<h2 className="font-mono text-xl text-foreground uppercase tracking-widest mb-2">
						WALLET LOCKED
					</h2>
					<p className="font-mono text-sm text-muted-foreground uppercase tracking-wider">
						Funds are SAFU
					</p>
				</div>

				<Button
					variant="outline"
					className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary font-mono uppercase tracking-wider"
				>
					<Lock className="w-4 h-4 mr-2" />
					Unlock Wallet
				</Button>

				<div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					Click anywhere to unlock
				</div>
			</div>
		</div>
	);
};

export default SAFU;
