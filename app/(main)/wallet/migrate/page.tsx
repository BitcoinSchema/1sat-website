"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Bsv20Section,
	FundingSection,
	LockedSection,
	MneeSection,
	OpnsSection,
	OrdinalsSection,
	RunSection,
	SweepStepsList,
	TokensSection,
} from "@/components/wallet/migration-sections";
import { useLegacyAssets } from "@/lib/hooks/use-legacy-assets";
import { deriveIdentityKey } from "@/lib/keys";
import {
	executeMigrationSweep,
	type SweepProgress,
	type SweepResult,
} from "@/lib/sweep-migration";
import {
	detectMigrationStatus,
	type MigrationStatus,
} from "@/lib/wallet-migration";
import { reencryptWallet } from "@/lib/wallet-storage";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

type MigrationPhase = "scan" | "preview" | "migrate" | "complete" | "error";
const SCANNING_SKELETON_KEYS = [
	"scan-card-1",
	"scan-card-2",
	"scan-card-3",
	"scan-card-4",
	"scan-card-5",
	"scan-card-6",
] as const;

// ---------------------------------------------------------------------------
// Scanning skeleton
// ---------------------------------------------------------------------------

function ScanningState({ scanDetail }: { scanDetail: string | null }) {
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Scanning Legacy Addresses</CardTitle>
					<CardDescription className="animate-pulse">
						{scanDetail ??
							"Looking for BSV, ordinals, tokens and MNEE at your legacy addresses..."}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<Skeleton className="h-16 w-full" />
					<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
						{SCANNING_SKELETON_KEYS.map((key) => (
							<Skeleton key={key} className="aspect-square w-full" />
						))}
					</div>
					<Skeleton className="h-12 w-full" />
				</CardContent>
			</Card>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Migration Progress
// ---------------------------------------------------------------------------

function MigrationProgress({
	progress,
	progressPercent,
	sweepProgress,
}: {
	progress: string;
	progressPercent: number;
	sweepProgress: SweepProgress | null;
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Migrating</CardTitle>
				<CardDescription>
					Do not close this page or lock your wallet.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<Progress value={progressPercent} />
				<div className="text-sm text-muted-foreground animate-pulse">
					{progress}
				</div>
				{sweepProgress && <SweepStepsList steps={sweepProgress.steps} />}
			</CardContent>
		</Card>
	);
}

// ---------------------------------------------------------------------------
// Completion State
// ---------------------------------------------------------------------------

function CompletionState({
	sweepResult,
	onBackToWallet,
	onRetryFailed,
}: {
	sweepResult: SweepResult | null;
	onBackToWallet: () => void;
	onRetryFailed: () => void;
}) {
	const hadErrors = (sweepResult?.errors.length ?? 0) > 0;
	return (
		<Card>
			<CardHeader>
				<CardTitle>
					{sweepResult
						? hadErrors
							? "Sweep Finished With Errors"
							: "Migration Complete"
						: "Already Migrated"}
				</CardTitle>
				<CardDescription>
					{sweepResult
						? hadErrors
							? "Some assets could not be swept. You can rescan and retry the remainder — successfully swept assets are already safe in your wallet."
							: "Your wallet has been migrated to the identity key system."
						: "Your wallet is already using the identity key system and no sweepable assets remain at your legacy addresses."}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{sweepResult && (
					<div className="space-y-2 text-sm">
						{sweepResult.bsvTxids.map((txid) => (
							<div key={txid} className="flex justify-between">
								<span className="text-muted-foreground">BSV Sweep</span>
								<code className="text-xs font-mono">
									{txid.slice(0, 16)}...
								</code>
							</div>
						))}
						{sweepResult.ordinalTxids.map((txid) => (
							<div key={txid} className="flex justify-between">
								<span className="text-muted-foreground">Ordinal Sweep</span>
								<code className="text-xs font-mono">
									{txid.slice(0, 16)}...
								</code>
							</div>
						))}
						{sweepResult.bsv21Txids.map((txid) => (
							<div key={txid} className="flex justify-between">
								<span className="text-muted-foreground">Token Sweep</span>
								<code className="text-xs font-mono">
									{txid.slice(0, 16)}...
								</code>
							</div>
						))}
						{sweepResult.mneeTxid && (
							<div className="flex justify-between">
								<span className="text-muted-foreground">MNEE Sweep</span>
								<code className="text-xs font-mono">
									{sweepResult.mneeTxid.slice(0, 16)}...
								</code>
							</div>
						)}
						{sweepResult.errors.length > 0 && (
							<div className="space-y-1">
								<p className="text-sm font-medium text-destructive">
									Some sweeps had errors:
								</p>
								{sweepResult.errors.map((err) => (
									<p key={err} className="text-xs text-destructive/80">
										{err}
									</p>
								))}
							</div>
						)}
						{sweepResult.bsvTxids.length === 0 &&
							sweepResult.ordinalTxids.length === 0 &&
							sweepResult.bsv21Txids.length === 0 &&
							!sweepResult.mneeTxid &&
							sweepResult.errors.length === 0 && (
								<p className="text-sm text-muted-foreground">
									No assets found at legacy addresses.
								</p>
							)}
					</div>
				)}
				{hadErrors && (
					<Button className="w-full" onClick={onRetryFailed}>
						Rescan &amp; Retry Failed Sweeps
					</Button>
				)}
				<Button variant="outline" className="w-full" onClick={onBackToWallet}>
					Back to Wallet
				</Button>
			</CardContent>
		</Card>
	);
}

// ---------------------------------------------------------------------------
// Error State
// ---------------------------------------------------------------------------

function ErrorState({
	error,
	onRetry,
	onBack,
}: {
	error: string;
	onRetry: () => void;
	onBack: () => void;
}) {
	return (
		<Card className="border-destructive/50">
			<CardHeader>
				<CardTitle className="text-destructive">Migration Error</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-sm text-destructive">{error}</p>
				<div className="flex gap-2">
					<Button variant="outline" onClick={onRetry}>
						Retry
					</Button>
					<Button variant="outline" onClick={onBack}>
						Back to Wallet
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function MigratePage() {
	const router = useRouter();
	const { walletKeys, isWalletLocked } = useWallet();
	const toolbox = useWalletToolbox();

	const [phase, setPhase] = useState<MigrationPhase>("scan");
	const [progress, setProgress] = useState("");
	const [progressPercent, setProgressPercent] = useState(0);
	const [sweepProgress, setSweepProgress] = useState<SweepProgress | null>(
		null,
	);
	const [scanDetail, setScanDetail] = useState<string | null>(null);
	const [sweepResult, setSweepResult] = useState<SweepResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Ordinal selection state
	const [selectedOrdinals, setSelectedOrdinals] = useState<Set<string>>(
		new Set(),
	);
	const [ordinalPage, setOrdinalPage] = useState(0);

	// Detect migration status
	const migrationStatus: MigrationStatus | null = useMemo(() => {
		if (!walletKeys || isWalletLocked) return null;
		return detectMigrationStatus(walletKeys);
	}, [walletKeys, isWalletLocked]);

	// Legacy key material is available in both the "legacy" (pre-migration)
	// and "migrated" (sweep-only re-entry) states
	const legacy = useMemo(() => {
		if (!migrationStatus) return null;
		if (migrationStatus.status === "legacy") {
			return {
				sweepOnly: false,
				payWif: migrationStatus.legacyPayWif,
				ordWif: migrationStatus.legacyOrdWif,
				identityWif: undefined as string | undefined,
				payAddress: migrationStatus.legacyPayAddress,
				ordAddress: migrationStatus.legacyOrdAddress,
				identityAddress: undefined as string | undefined,
			};
		}
		if (
			migrationStatus.status === "migrated" &&
			migrationStatus.legacyPayWif &&
			migrationStatus.legacyOrdWif
		) {
			return {
				sweepOnly: true,
				payWif: migrationStatus.legacyPayWif,
				ordWif: migrationStatus.legacyOrdWif,
				identityWif: migrationStatus.legacyIdentityWif,
				payAddress: migrationStatus.legacyPayAddress ?? null,
				ordAddress: migrationStatus.legacyOrdAddress ?? null,
				identityAddress: migrationStatus.legacyIdentityAddress,
			};
		}
		return null;
	}, [migrationStatus]);

	const assets = useLegacyAssets(
		legacy?.payAddress ?? null,
		legacy?.ordAddress ?? null,
		legacy?.identityAddress ?? null,
		(p) => setScanDetail(p.detail ?? p.phase),
	);

	// Sweepable asset counts (opns names sweep together with ordinals)
	const totalAssets =
		assets.funding.length +
		assets.ordinals.length +
		assets.opnsNames.length +
		assets.bsv21Tokens.reduce((sum, t) => sum + t.outputs.length, 0);

	// Transition from scan to preview when scan completes
	useEffect(() => {
		if (!migrationStatus) return;

		if (phase !== "scan") return;

		if (!legacy) {
			if (migrationStatus.status === "migrated") {
				// Migrated and no recoverable legacy keys — nothing to sweep
				setPhase("complete");
			} else {
				setError("Wallet cannot be migrated (missing pay or ord key)");
				setPhase("error");
			}
			return;
		}

		if (assets.loading || assets.error) return;

		if (legacy.sweepOnly && totalAssets === 0 && assets.mneeBalance <= 0) {
			// Already migrated and legacy addresses are empty
			setPhase("complete");
		} else {
			setPhase("preview");
		}
	}, [
		migrationStatus,
		legacy,
		phase,
		assets.loading,
		assets.error,
		assets.mneeBalance,
		totalAssets,
	]);

	// Select all ordinals by default when assets load
	useEffect(() => {
		if (assets.ordinals.length > 0 && selectedOrdinals.size === 0) {
			setSelectedOrdinals(new Set(assets.ordinals.map((o) => o.outpoint)));
		}
	}, [assets.ordinals, selectedOrdinals.size]);

	// Ordinal selection handlers
	const handleToggleOrdinal = useCallback((outpoint: string) => {
		setSelectedOrdinals((prev) => {
			const next = new Set(prev);
			if (next.has(outpoint)) {
				next.delete(outpoint);
			} else {
				next.add(outpoint);
			}
			return next;
		});
	}, []);

	const handleSelectAll = useCallback(() => {
		setSelectedOrdinals(new Set(assets.ordinals.map((o) => o.outpoint)));
	}, [assets.ordinals]);

	const handleDeselectAll = useCallback(() => {
		setSelectedOrdinals(new Set());
	}, []);

	// Ordinals to sweep: user selection plus all OpNS names
	const sweepOrdinals = useMemo(() => {
		return [
			...assets.ordinals.filter((o) => selectedOrdinals.has(o.outpoint)),
			...assets.opnsNames,
		];
	}, [assets.ordinals, assets.opnsNames, selectedOrdinals]);

	// Run migration (or sweep-only re-entry for already-migrated wallets)
	const runMigration = useCallback(async () => {
		if (!walletKeys || !legacy) return;

		setPhase("migrate");
		setError(null);
		setProgressPercent(0);
		setSweepProgress(null);

		try {
			let identityWif = legacy.identityWif;

			if (!legacy.sweepOnly) {
				// 1. Derive identity key
				setProgress("Deriving identity key...");
				setProgressPercent(10);
				const identityKey = deriveIdentityKey(legacy.payWif, legacy.ordWif);
				identityWif = identityKey.toWif();

				// 2. Update keys with identity
				const updatedKeys = {
					...walletKeys,
					identityPk: identityWif,
					identityAddressPath: "derived" as string | number | undefined,
				};

				// 3. Re-encrypt wallet
				setProgress("Updating encrypted wallet...");
				setProgressPercent(25);
				const reencrypted = await reencryptWallet(updatedKeys);
				if (!reencrypted) {
					throw new Error(
						"Failed to re-encrypt wallet. Try unlocking your wallet again first.",
					);
				}

				// 4. Reinitialize BRC-100 wallet with identity key
				setProgress("Reinitializing BRC-100 wallet...");
				setProgressPercent(40);
				if (toolbox.isInitialized) {
					await toolbox.destroyWallet();
				}

				await new Promise((r) => setTimeout(r, 500));

				const { wifToHex } = await import("@1sat/utils");
				const rootKeyHex = wifToHex(identityWif);
				const initialized = await toolbox.initializeWallet(rootKeyHex);

				if (!initialized) {
					throw new Error("Failed to initialize wallet with identity key");
				}
			}

			// 5. Sweep legacy assets
			if (!toolbox.wallet || !toolbox.services) {
				throw new Error(
					"BRC-100 wallet is not initialized — unlock your wallet and try again",
				);
			}

			const totalSweepable =
				assets.funding.length +
				sweepOrdinals.length +
				assets.bsv21Tokens.reduce((sum, t) => sum + t.outputs.length, 0);

			if (totalSweepable > 0 || assets.mneeBalance > 0) {
				setProgress(
					`Sweeping ${totalSweepable} asset${totalSweepable !== 1 ? "s" : ""}...`,
				);
				// Pre-sweep stages (key derivation, re-encryption, re-init) span
				// 0-60%; the sweep's own unit-based percent fills the rest. For a
				// sweep-only re-entry the sweep owns the whole bar.
				const base = legacy.sweepOnly ? 0 : 60;
				const span = 100 - base;
				setProgressPercent(base);

				const result = await executeMigrationSweep({
					wallet: toolbox.wallet,
					services: toolbox.services,
					chain: toolbox.chain,
					legacyPayWif: legacy.payWif,
					legacyOrdWif: legacy.ordWif,
					legacyIdentityWif: identityWif,
					onProgress: (p) => {
						setProgress(p.message);
						setProgressPercent(base + Math.round((p.percent / 100) * span));
						setSweepProgress(p);
					},
					funding: assets.funding,
					ordinals: sweepOrdinals,
					bsv21Tokens: assets.bsv21Tokens,
					mneeBalance: assets.mneeBalance,
				});

				setSweepResult(result);
				// Refresh so the banner and any re-entry reflect what's left
				assets.rescan();
			} else {
				setSweepResult({
					bsvTxids: [],
					ordinalTxids: [],
					bsv21Txids: [],
					errors: [],
				});
			}

			setProgressPercent(100);
			setPhase("complete");
		} catch (err) {
			console.error("[Migration] Failed:", err);
			setError(err instanceof Error ? err.message : String(err));
			setPhase("error");
		}
	}, [walletKeys, legacy, toolbox, assets, sweepOrdinals]);

	// Locked state
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
				{phase === "preview" && totalAssets > 0 && (
					<Badge variant="secondary">
						{totalAssets} sweepable asset
						{totalAssets !== 1 ? "s" : ""}
					</Badge>
				)}
			</PageHeader>

			<PageContent className="space-y-4">
				{/* Scanning */}
				{phase === "scan" && assets.loading && (
					<ScanningState scanDetail={scanDetail} />
				)}

				{/* Scan error */}
				{phase === "scan" && assets.error && (
					<Card className="border-destructive/50">
						<CardContent className="py-6 space-y-3">
							<p className="text-sm text-destructive">{assets.error}</p>
							<Button variant="outline" onClick={assets.rescan}>
								Retry Scan
							</Button>
						</CardContent>
					</Card>
				)}

				{/* Preview: show categorized assets */}
				{phase === "preview" && legacy && (
					<>
						{/* Legacy addresses */}
						<Card>
							<CardHeader>
								<CardTitle>
									{legacy.sweepOnly
										? "Legacy Assets Found"
										: "Migration Required"}
								</CardTitle>
								<CardDescription>
									{legacy.sweepOnly
										? "Your wallet is already migrated, but assets remain at your legacy addresses. Review them below, then sweep."
										: "Your wallet uses the legacy payment key as its BRC-100 root. Review the assets below, then migrate."}
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Legacy Pay Address
									</span>
									<code className="text-xs">{legacy.payAddress}</code>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Legacy Ord Address
									</span>
									<code className="text-xs">{legacy.ordAddress}</code>
								</div>
							</CardContent>
						</Card>

						{/* Asset sections */}
						<div className="space-y-3">
							<FundingSection
								funding={assets.funding}
								totalBsv={assets.totalBsv}
							/>

							<OrdinalsSection
								ordinals={assets.ordinals}
								selectedOrdinals={selectedOrdinals}
								onToggle={handleToggleOrdinal}
								onSelectAll={handleSelectAll}
								onDeselectAll={handleDeselectAll}
								ordinalPage={ordinalPage}
								onPageChange={setOrdinalPage}
							/>

							<OpnsSection opnsNames={assets.opnsNames} />

							<TokensSection tokens={assets.bsv21Tokens} />

							<MneeSection mneeBalance={assets.mneeBalance} />

							<Bsv20Section tokens={assets.bsv20Tokens} />

							<LockedSection locked={assets.locked} />

							<RunSection run={assets.run} />
						</div>

						{/* No assets found */}
						{totalAssets === 0 &&
							assets.bsv20Tokens.length === 0 &&
							assets.mneeBalance <= 0 && (
								<Card>
									<CardContent className="py-8 text-center text-muted-foreground">
										No assets found at legacy addresses.
										{!legacy.sweepOnly &&
											" Migration will still derive your identity key."}
									</CardContent>
								</Card>
							)}

						{/* Migration CTA */}
						<Separator />

						<div className="space-y-3">
							<div className="text-xs text-muted-foreground">
								{legacy.sweepOnly
									? "This will sweep all selected assets from your legacy addresses into your BRC-100 wallet."
									: `This will: derive your identity key, re-encrypt your wallet backup, reinitialize the BRC-100 wallet${
											totalAssets > 0
												? ", and sweep all selected assets from legacy addresses"
												: ""
										}.`}
							</div>
							<Button onClick={runMigration} className="w-full">
								{legacy.sweepOnly
									? "Sweep Legacy Assets"
									: "Derive Identity Key & Sweep"}
								{totalAssets > 0 &&
									` (${totalAssets} asset${totalAssets !== 1 ? "s" : ""})`}
							</Button>
						</div>
					</>
				)}

				{/* Migrating */}
				{phase === "migrate" && (
					<MigrationProgress
						progress={progress}
						progressPercent={progressPercent}
						sweepProgress={sweepProgress}
					/>
				)}

				{/* Complete */}
				{phase === "complete" && (
					<CompletionState
						sweepResult={sweepResult}
						onBackToWallet={() => router.push("/wallet")}
						onRetryFailed={() => {
							setSweepResult(null);
							setSweepProgress(null);
							setScanDetail(null);
							setPhase("scan");
							assets.rescan();
						}}
					/>
				)}

				{/* Error */}
				{phase === "error" && error && (
					<ErrorState
						error={error}
						onRetry={() => setPhase("preview")}
						onBack={() => router.push("/wallet")}
					/>
				)}
			</PageContent>
		</Page>
	);
}
