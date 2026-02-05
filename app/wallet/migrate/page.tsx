"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { deriveIdentityKey } from "@/lib/keys";
import {
	type MigrationStatus,
	detectMigrationStatus,
} from "@/lib/wallet-migration";
import {
	type SweepResult,
	executeMigrationSweep,
} from "@/lib/sweep-migration";
import { reencryptWallet, saveSessionKeys } from "@/lib/wallet-storage";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

type MigrationStep = "detect" | "confirm" | "migrating" | "complete" | "error";

export default function MigratePage() {
	const router = useRouter();
	const { walletKeys, isWalletLocked } = useWallet();
	const toolbox = useWalletToolbox();

	const [step, setStep] = useState<MigrationStep>("detect");
	const [progress, setProgress] = useState("");
	const [sweepResult, setSweepResult] = useState<SweepResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	const migrationStatus: MigrationStatus | null = useMemo(() => {
		if (!walletKeys || isWalletLocked) return null;
		return detectMigrationStatus(walletKeys);
	}, [walletKeys, isWalletLocked]);

	useEffect(() => {
		if (!migrationStatus) return;
		if (migrationStatus.status === "migrated") {
			setStep("complete");
		} else if (migrationStatus.status === "legacy") {
			setStep("confirm");
		} else {
			setError("Wallet cannot be migrated (missing pay or ord key)");
			setStep("error");
		}
	}, [migrationStatus]);

	const runMigration = useCallback(async () => {
		if (!walletKeys || !migrationStatus || migrationStatus.status !== "legacy")
			return;

		setStep("migrating");
		setError(null);

		try {
			// 1. Derive identity key
			setProgress("Deriving identity key...");
			const identityKey = deriveIdentityKey(
				migrationStatus.legacyPayWif,
				migrationStatus.legacyOrdWif,
			);
			const identityWif = identityKey.toWif();

			// 2. Update keys with identity
			const updatedKeys = {
				...walletKeys,
				identityPk: identityWif,
				identityAddressPath: "derived" as string | number | undefined,
			};

			// 3. Re-encrypt wallet with updated keys
			setProgress("Updating encrypted wallet...");
			const reencrypted = await reencryptWallet(updatedKeys);
			if (!reencrypted) {
				throw new Error(
					"Failed to re-encrypt wallet. Try unlocking your wallet again first.",
				);
			}

			// 4. Update session storage
			saveSessionKeys(updatedKeys.payPk, updatedKeys.ordPk);

			// 5. Destroy old toolbox and reinitialize with identity key
			setProgress("Reinitializing BRC-100 wallet...");
			if (toolbox.isInitialized) {
				await toolbox.destroyWallet();
			}

			// Small delay for IDB cleanup
			await new Promise((r) => setTimeout(r, 500));

			const { wifToHex, wifToAddress } = await import("@1sat/utils");
			const rootKeyHex = wifToHex(identityWif);
			const ordAddress = wifToAddress(migrationStatus.legacyOrdWif);
			const payAddress = wifToAddress(migrationStatus.legacyPayWif);

			const initialized = await toolbox.initializeWallet(
				rootKeyHex,
				ordAddress,
				payAddress,
			);

			if (!initialized) {
				throw new Error("Failed to initialize wallet with identity key");
			}

			// 6. Sweep legacy assets
			if (toolbox.wallet && toolbox.services) {
				setProgress("Sweeping legacy assets...");
				const result = await executeMigrationSweep({
					wallet: toolbox.wallet,
					services: toolbox.services,
					legacyPayWif: migrationStatus.legacyPayWif,
					legacyOrdWif: migrationStatus.legacyOrdWif,
					legacyPayAddress: migrationStatus.legacyPayAddress,
					legacyOrdAddress: migrationStatus.legacyOrdAddress,
					onProgress: setProgress,
				});

				setSweepResult(result);
			}

			setStep("complete");
		} catch (err) {
			console.error("[Migration] Failed:", err);
			setError(err instanceof Error ? err.message : String(err));
			setStep("error");
		}
	}, [walletKeys, migrationStatus, toolbox]);

	if (isWalletLocked || !walletKeys) {
		return (
			<Page>
				<PageHeader>
					<PageTitle>Wallet Migration</PageTitle>
				</PageHeader>
				<PageContent>
					<Card>
						<CardContent className="py-8 text-center text-muted-foreground">
							Unlock your wallet to check migration status.
						</CardContent>
					</Card>
				</PageContent>
			</Page>
		);
	}

	return (
		<Page>
			<PageHeader>
				<PageTitle>Wallet Migration</PageTitle>
			</PageHeader>

			<PageContent>
				{step === "confirm" && migrationStatus?.status === "legacy" && (
					<Card>
						<CardHeader>
							<CardTitle>Migration Required</CardTitle>
							<CardDescription>
								Your wallet uses the legacy payment key as its BRC-100 root.
								Migration will derive a proper identity key and sweep all assets
								from your legacy addresses.
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">Legacy Pay Address</span>
									<span className="font-mono">
										{migrationStatus.legacyPayAddress}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Legacy Ord Address</span>
									<span className="font-mono">
										{migrationStatus.legacyOrdAddress}
									</span>
								</div>
							</div>
							<div className="text-xs text-muted-foreground">
								This will: derive your identity key, re-encrypt your wallet
								backup, reinitialize the BRC-100 wallet, and sweep all BSV,
								ordinals, and tokens from the legacy addresses.
							</div>
							<Button onClick={runMigration} className="w-full">
								Migrate Now
							</Button>
						</CardContent>
					</Card>
				)}

				{step === "migrating" && (
					<Card>
						<CardHeader>
							<CardTitle>Migrating...</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div className="text-sm text-muted-foreground animate-pulse">
									{progress}
								</div>
								<div className="text-xs text-muted-foreground">
									Do not close this page or lock your wallet.
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{step === "complete" && (
					<Card>
						<CardHeader>
							<CardTitle>
								{sweepResult ? "Migration Complete" : "Already Migrated"}
							</CardTitle>
							<CardDescription>
								{sweepResult
									? "Your wallet has been migrated to the identity key system."
									: "Your wallet is already using the identity key system."}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{sweepResult && (
								<div className="space-y-2 text-sm">
									{sweepResult.bsvTxid && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">BSV Sweep</span>
											<span className="font-mono text-xs">
												{sweepResult.bsvTxid.slice(0, 12)}...
											</span>
										</div>
									)}
									{sweepResult.ordinalTxids.map((txid) => (
										<div key={txid} className="flex justify-between">
											<span className="text-muted-foreground">
												Ordinal Sweep
											</span>
											<span className="font-mono text-xs">
												{txid.slice(0, 12)}...
											</span>
										</div>
									))}
									{sweepResult.bsv21Txids.map((txid) => (
										<div key={txid} className="flex justify-between">
											<span className="text-muted-foreground">Token Sweep</span>
											<span className="font-mono text-xs">
												{txid.slice(0, 12)}...
											</span>
										</div>
									))}
									{sweepResult.errors.length > 0 && (
										<div className="space-y-1">
											<p className="text-sm font-medium text-destructive">
												Some sweeps had errors:
											</p>
											{sweepResult.errors.map((err) => (
												<p
													key={err}
													className="text-xs text-destructive/80"
												>
													{err}
												</p>
											))}
										</div>
									)}
									{!sweepResult.bsvTxid &&
										sweepResult.ordinalTxids.length === 0 &&
										sweepResult.bsv21Txids.length === 0 &&
										sweepResult.errors.length === 0 && (
											<p className="text-muted-foreground text-sm">
												No assets found at legacy addresses (fast path).
											</p>
										)}
								</div>
							)}
							<Button
								variant="outline"
								className="w-full"
								onClick={() => router.push("/wallet")}
							>
								Back to Wallet
							</Button>
						</CardContent>
					</Card>
				)}

				{step === "error" && (
					<Card className="border-destructive/50">
						<CardHeader>
							<CardTitle className="text-destructive">
								Migration Error
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-destructive">{error}</p>
							<div className="flex gap-2">
								<Button
									variant="outline"
									onClick={() => setStep("confirm")}
								>
									Retry
								</Button>
								<Button
									variant="outline"
									onClick={() => router.push("/wallet")}
								>
									Back to Wallet
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</PageContent>
		</Page>
	);
}
