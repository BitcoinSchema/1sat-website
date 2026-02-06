"use client";

import { decryptBackup } from "bitcoin-backup";
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
import type { Keys } from "@/lib/types";
import { saveEncryptedWallet } from "@/lib/wallet-storage";
import { useImportWallet } from "../provider";

export default function ImportPassphrasePage() {
	const router = useRouter();
	const { walletKeys, setWalletKeys, encryptedBackup } = useImportWallet();
	const [passphrase, setPassphrase] = useState("");
	const [confirmPassphrase, setConfirmPassphrase] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState("");

	const mode = encryptedBackup ? "decrypt" : "encrypt";

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
			const success = await saveEncryptedWallet(walletKeys, passphrase);
			setIsSaving(false);

			if (success) {
				router.push("/wallet");
			} else {
				setError("Failed to save wallet");
			}
		} else {
			// Decrypt Mode
			if (!encryptedBackup || !passphrase) return;
			setIsSaving(true);

			try {
				let encryptedString = "";
				// Extract the encrypted string based on format
				if ("encryptedBackup" in encryptedBackup) {
					// Legacy 1Sat
					encryptedString = encryptedBackup.encryptedBackup || "";
				} else if ("encryptedKeys" in encryptedBackup) {
					// Yours Wallet (Account)
					encryptedString = encryptedBackup.encryptedKeys;
				} else if ("accounts" in encryptedBackup) {
					// Yours Wallet (Chrome Storage) - Use selected account
					const selected = encryptedBackup.selectedAccount;
					if (selected && encryptedBackup.accounts[selected]) {
						encryptedString = encryptedBackup.accounts[selected].encryptedKeys;
					}
				}

				if (!encryptedString) {
					throw new Error("Could not find encrypted data in backup file");
				}

				// Attempt decryption using bitcoin-backup
				// It handles 1Sat legacy and Yours format automatically if strings are correct
				// Note: For legacy 1Sat, we might need to use our own decrypt if bitcoin-backup doesn't cover the exact custom format we used (ENC: prefix).
				// The new bitcoin-backup claims to support Yours.
				// Let's try bitcoin-backup's decryptBackup first.
				const decrypted = await decryptBackup(encryptedString, passphrase);

				if (!decrypted) throw new Error("Decryption failed");

				// Map to Keys
				// Decrypted can be various types. We check fields.
				let keys: Keys | null = null;

				// Helper to check properties safely
				if ("payPk" in decrypted && "ordPk" in decrypted) {
					keys = {
						payPk: decrypted.payPk,
						ordPk: decrypted.ordPk,
						identityPk:
							"identityPk" in decrypted ? decrypted.identityPk : undefined,
						mnemonic: "mnemonic" in decrypted ? decrypted.mnemonic : undefined,
						changeAddressPath:
							"payDerivationPath" in decrypted
								? decrypted.payDerivationPath
								: "m/0",
						ordAddressPath:
							"ordDerivationPath" in decrypted
								? decrypted.ordDerivationPath
								: "m/0/0",
						identityAddressPath:
							"identityDerivationPath" in decrypted
								? decrypted.identityDerivationPath
								: undefined,
					};
				} else if ("wif" in decrypted) {
					// WifBackup?
					// Not supported fully yet for 1Sat needs, usually we need pay+ord.
					// But if it's a simple WIF, maybe we derive?
					// For now assume valid backup has payPk/ordPk
					throw new Error("Backup format missing required keys");
				}

				if (keys) {
					setWalletKeys(keys);
					// Save to local storage with the SAME password
					await saveEncryptedWallet(keys, passphrase);
					router.push("/wallet");
				} else {
					throw new Error("Invalid decrypted key format");
				}
			} catch (err) {
				console.error(err);
				setError("Incorrect password or invalid backup format");
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
							{mode === "encrypt" ? "Set Password" : "Enter Password"}
						</CardTitle>
						<CardDescription>
							{mode === "encrypt"
								? "Set a secure password to encrypt your wallet on this device."
								: "Enter the password used to encrypt this backup file."}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid gap-2">
								<Label htmlFor="passphrase">Password</Label>
								<Input
									id="passphrase"
									type="password"
									value={passphrase}
									onChange={(e) => setPassphrase(e.target.value)}
									required
									minLength={1} // Allow short passwords for imports if user set them
								/>
							</div>

							{mode === "encrypt" && (
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
							)}

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
										!passphrase ||
										(mode === "encrypt" && passphrase !== confirmPassphrase) ||
										isSaving
									}
								>
									{isSaving ? (
										<Loader2 className="animate-spin" />
									) : mode === "encrypt" ? (
										"Encrypt & Save"
									) : (
										"Decrypt & Import"
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
