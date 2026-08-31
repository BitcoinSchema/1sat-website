"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
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
import { decryptWalletBackup } from "@/lib/wallet-backup";
import { useWallet } from "@/providers/wallet-provider";
import { useImportWallet } from "../provider";

export default function ImportPassphrasePage() {
	const router = useRouter();
	const { importWallet } = useWallet();
	const { walletKeys, setWalletKeys, encryptedBackup } = useImportWallet();
	const [passphrase, setPassphrase] = useState("");
	const [localPassphrase, setLocalPassphrase] = useState("");
	const [confirmPassphrase, setConfirmPassphrase] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");

	const mode = encryptedBackup ? "decrypt" : "encrypt";
	const requiresPassword = encryptedBackup?.requiresPassword ?? true;

	useEffect(() => {
		if (!walletKeys && !encryptedBackup) {
			router.replace("/wallet/import");
		}
	}, [walletKeys, encryptedBackup, router]);

	if (!walletKeys && !encryptedBackup) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (mode === "encrypt") {
			if (!walletKeys || !passphrase || passphrase !== confirmPassphrase)
				return;

			setIsSaving(true);
			const success = await importWallet(walletKeys, passphrase);
			setIsSaving(false);

			if (!success) {
				setError("Failed to save wallet");
			}
		} else {
			if (
				!encryptedBackup ||
				(requiresPassword && !passphrase) ||
				!localPassphrase ||
				localPassphrase !== confirmPassphrase
			)
				return;
			setIsSaving(true);

			try {
				const keys = await decryptWalletBackup(
					encryptedBackup,
					requiresPassword ? passphrase : "",
				);
				setWalletKeys(keys);
				const success = await importWallet(keys, localPassphrase);
				if (!success) {
					throw new Error("Failed to save wallet");
				}
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Incorrect password or invalid backup format",
				);
			} finally {
				setIsSaving(false);
			}
		}
	};

	return (
		<Page className="max-w-2xl">
			<PageHeader>
				<PageTitle>
					{mode === "encrypt" ? "Set Password" : "Unlock Backup"}
				</PageTitle>
			</PageHeader>
			<PageContent>
				<Card>
					<CardHeader>
						<CardTitle>
							{mode === "encrypt"
								? "Set Password"
								: requiresPassword
									? "Enter Password"
									: "Set Wallet Password"}
						</CardTitle>
						<CardDescription>
							{mode === "encrypt"
								? "Set a secure password to encrypt your wallet on this device."
								: requiresPassword
									? "Enter the backup password, then choose a password for this device."
									: "This legacy backup contains its own decryption key. Set a password to protect it on this device."}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							{(mode === "encrypt" || requiresPassword) && (
								<div className="grid gap-2">
									<Label htmlFor="passphrase">
										{mode === "encrypt" ? "Password" : "Backup Password"}
									</Label>
									<Input
										autoComplete={
											mode === "encrypt" ? "new-password" : "current-password"
										}
										id="passphrase"
										type="password"
										value={passphrase}
										onChange={(e) => setPassphrase(e.target.value)}
										required
										minLength={mode === "encrypt" ? 6 : 1}
									/>
								</div>
							)}

							{mode === "decrypt" && (
								<div className="grid gap-2">
									<Label htmlFor="local-passphrase">Wallet Password</Label>
									<Input
										autoComplete="new-password"
										id="local-passphrase"
										type="password"
										value={localPassphrase}
										onChange={(e) => setLocalPassphrase(e.target.value)}
										required
										minLength={6}
									/>
								</div>
							)}

							<div className="grid gap-2">
								<Label htmlFor="confirm-passphrase">Confirm Password</Label>
								<Input
									autoComplete="new-password"
									id="confirm-passphrase"
									type="password"
									value={confirmPassphrase}
									onChange={(e) => setConfirmPassphrase(e.target.value)}
									required
									minLength={6}
								/>
								{(mode === "encrypt" ? passphrase : localPassphrase) &&
									confirmPassphrase &&
									(mode === "encrypt" ? passphrase : localPassphrase) !==
										confirmPassphrase && (
										<p className="text-sm text-destructive">
											Passwords do not match
										</p>
									)}
							</div>

							{error && <p className="text-sm text-destructive">{error}</p>}

							<div className="flex gap-2">
								<Button
									variant="outline"
									onClick={() => router.back()}
									type="button"
								>
									Back
								</Button>
								<Button
									type="submit"
									className="flex-1"
									disabled={
										(mode === "encrypt"
											? !passphrase || passphrase !== confirmPassphrase
											: (requiresPassword && !passphrase) ||
												!localPassphrase ||
												localPassphrase !== confirmPassphrase) || isSaving
									}
								>
									{isSaving ? (
										<Loader2 className="animate-spin" />
									) : mode === "encrypt" ? (
										"Encrypt & Save"
									) : requiresPassword ? (
										"Decrypt & Import"
									) : (
										"Encrypt & Restore"
									)}
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</PageContent>
		</Page>
	);
}
