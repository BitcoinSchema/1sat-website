"use client";

import { Mnemonic } from "@bsv/sdk";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
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
import { MnemonicGrid } from "@/components/wallet/mnemonic-grid";
import { useWallet } from "@/providers/wallet-provider";

export function CreateWalletWizard() {
	const router = useRouter();
	const { createWallet } = useWallet();
	const [passphrase, setPassphrase] = useState("");
	const [confirmPassphrase, setConfirmPassphrase] = useState("");
	const [mnemonic, setMnemonic] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [step, setStep] = useState<"generate" | "confirm" | "encrypt">(
		"generate",
	);
	const [isVerified, setIsVerified] = useState(false);

	useEffect(() => {
		if (!mnemonic) {
			setMnemonic(Mnemonic.fromRandom(128).toString());
		}
	}, [mnemonic]);

	const handleCreateWallet = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!mnemonic || !passphrase || passphrase !== confirmPassphrase) return;

		setIsLoading(true);
		const success = await createWallet(mnemonic, passphrase);
		setIsLoading(false);

		if (success) {
			router.push("/wallet");
		} else {
			console.error("Failed to create and save wallet");
		}
	};

	return (
		<>
			{step === "generate" && (
				<Card>
					<CardHeader>
						<CardTitle>Your New Seed Phrase</CardTitle>
						<CardDescription>
							Write down these 12 words in order and store them safely.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{mnemonic ? (
							<MnemonicGrid mode="view" mnemonic={mnemonic} />
						) : (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
							</div>
						)}
						<div className="mt-6 flex justify-end">
							<Button onClick={() => setStep("confirm")} disabled={!mnemonic}>
								I have saved my seed phrase
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{step === "confirm" && (
				<Card>
					<CardHeader>
						<CardTitle>Confirm Seed Phrase</CardTitle>
						<CardDescription>
							Please verify your seed phrase by selecting the words in correct
							order.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{mnemonic && (
							<MnemonicGrid
								mode="prove"
								mnemonic={mnemonic}
								onVerify={(isValid) => setIsVerified(isValid)}
							/>
						)}
						<div className="flex gap-2 mt-4 justify-end">
							<Button variant="ghost" onClick={() => setStep("generate")}>
								Back
							</Button>
							<Button onClick={() => setStep("encrypt")} disabled={!isVerified}>
								Confirm & Continue
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{step === "encrypt" && (
				<Card>
					<CardHeader>
						<CardTitle>Set Password</CardTitle>
						<CardDescription>
							Set a secure password to encrypt your wallet.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleCreateWallet} className="space-y-4">
							<div className="grid gap-2">
								<Label htmlFor="passphrase">Password</Label>
								<Input
									id="passphrase"
									type="password"
									value={passphrase}
									onChange={(e) => setPassphrase(e.target.value)}
									required
									minLength={6}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="confirm-passphrase">Confirm Password</Label>
								<Input
									id="confirm-passphrase"
									type="password"
									value={confirmPassphrase}
									onChange={(e) => setConfirmPassphrase(e.target.value)}
									required
									minLength={6}
								/>
								{passphrase &&
									confirmPassphrase &&
									passphrase !== confirmPassphrase && (
										<p className="text-sm text-destructive">
											Passwords do not match
										</p>
									)}
							</div>
							<div className="flex gap-2">
								<Button
									variant="outline"
									onClick={() => setStep("confirm")}
									type="button"
								>
									Back
								</Button>
								<Button
									type="submit"
									className="flex-1"
									disabled={
										!passphrase || passphrase !== confirmPassphrase || isLoading
									}
								>
									{isLoading ? (
										<Loader2 className="animate-spin" />
									) : (
										"Encrypt & Save"
									)}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			)}
		</>
	);
}
