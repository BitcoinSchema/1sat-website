"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	SoundDialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/sound-dialog";
import { useSound } from "@/hooks/use-sound";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/providers/wallet-provider";

export function UnlockWalletDialog({
	open,
	onOpenChange,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const { unlockWallet } = useWallet();
	const { play } = useSound();
	const [passphrase, setPassphrase] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);
		const success = await unlockWallet(passphrase);
		setIsLoading(false);
		if (success) {
			play("success");
			onOpenChange(false);
			setPassphrase("");
		} else {
			play("error");
			setError("Incorrect passphrase. Please try again.");
		}
	};

	return (
		<SoundDialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Unlock Wallet</DialogTitle>
					<DialogDescription>
						Enter your passphrase to unlock your wallet.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="passphrase">Passphrase</Label>
						<Input
							id="passphrase"
							type="password"
							value={passphrase}
							onChange={(e) => setPassphrase(e.target.value)}
							required
						/>
					</div>
					{error && <p className="text-sm text-destructive">{error}</p>}
					<Button type="submit" disabled={isLoading}>
						{isLoading ? <Loader2 className="animate-spin mr-2" /> : "Unlock"}
					</Button>
				</form>
			</DialogContent>
		</SoundDialog>
	);
}
