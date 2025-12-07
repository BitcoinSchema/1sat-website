"use client";

import { Loader2, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWallet } from "@/providers/wallet-provider";

export function FullScreenUnlock() {
	const { isWalletLocked, isWalletInitialized, unlockWallet, hasWallet } =
		useWallet();
	const [passphrase, setPassphrase] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isWalletLocked && hasWallet && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isWalletLocked, hasWallet]);

	const handleUnlock = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		const success = await unlockWallet(passphrase);
		if (!success) {
			setError("Invalid passphrase");
			setIsLoading(false);
		} else {
			// Success, the component will likely unmount or hide
		}
	};

	if (!isWalletInitialized) return null;
	if (!hasWallet) return null; // Don't show if no wallet
	if (!isWalletLocked) return null; // Don't show if unlocked

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
			<div className="w-full max-w-md p-4 animate-in fade-in zoom-in-95 duration-300">
				<Card className="w-full border-border/50 shadow-2xl bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
					<CardHeader className="space-y-1 text-center">
						<div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
							<Lock className="w-6 h-6 text-primary" />
						</div>
						<CardTitle className="text-2xl">Unlock Wallet</CardTitle>
						<CardDescription>
							Enter your passphrase to access your wallet
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleUnlock} className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="passphrase" className="sr-only">
									Passphrase
								</Label>
								<Input
									id="passphrase"
									type="password"
									placeholder="Enter passphrase"
									value={passphrase}
									onChange={(e) => {
										setPassphrase(e.target.value);
										setError("");
									}}
									disabled={isLoading}
									ref={inputRef}
									className="text-center text-lg h-12"
								/>
								{error && (
									<p className="text-sm text-destructive text-center">
										{error}
									</p>
								)}
							</div>
							<Button
								type="submit"
								className="w-full h-11 text-lg"
								disabled={isLoading || !passphrase}
							>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Unlocking...
									</>
								) : (
									"Unlock"
								)}
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
