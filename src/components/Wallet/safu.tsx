"use client";

import { Button } from "@/components/ui/button";
import { showUnlockWalletModal } from "@/signals/wallet";
import { useSignals } from "@preact/signals-react/runtime";
import { Lock, Shield } from "lucide-react";

const SAFU = () => {
	useSignals();

	return (
		<div
			className="w-full flex-1 flex flex-col items-center justify-center bg-zinc-950 cursor-pointer"
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
			<div className="flex flex-col items-center gap-6 p-8 border border-zinc-800 bg-zinc-900/50 max-w-md w-full mx-4">
				<div className="flex items-center gap-3">
					<Shield className="w-8 h-8 text-green-500" />
					<Lock className="w-6 h-6 text-zinc-500" />
				</div>

				<div className="text-center">
					<h2 className="font-mono text-xl text-zinc-300 uppercase tracking-widest mb-2">
						WALLET LOCKED
					</h2>
					<p className="font-mono text-sm text-zinc-500 uppercase tracking-wider">
						Funds are SAFU
					</p>
				</div>

				<Button
					variant="outline"
					className="rounded-none border-green-500/50 text-green-400 hover:bg-green-500/10 hover:text-green-300 font-mono uppercase tracking-wider"
				>
					<Lock className="w-4 h-4 mr-2" />
					Unlock Wallet
				</Button>

				<div className="font-mono text-[10px] text-zinc-600 uppercase tracking-widest">
					Click anywhere to unlock
				</div>
			</div>
		</div>
	);
};

export default SAFU;
