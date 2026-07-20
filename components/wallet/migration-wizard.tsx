"use client";

import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	Download,
	Loader2,
	RefreshCw,
	Shield,
	Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Bsv20Section,
	FundingSection,
	LockedSection,
	MneeSection,
	OpnsSection,
	OrdinalsSection,
	RunSection,
	TokensSection,
} from "@/components/wallet/migration-sections";
import { WALLET_STORAGE_KEY } from "@/lib/constants";
import { useLegacyAssets } from "@/lib/hooks/use-legacy-assets";
import { deriveIdentityKey } from "@/lib/keys";
import { executeMigrationSweep, type SweepResult } from "@/lib/sweep-migration";
import {
	detectMigrationStatus,
	type MigrationStatus,
} from "@/lib/wallet-migration";
import { reencryptWallet } from "@/lib/wallet-storage";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

type WizardStep =
	| "intro"
	| "scan"
	| "preview"
	| "migrate"
	| "complete"
	| "error";

const SCAN_SKELETON_KEYS = [
	"scan-step-1",
	"scan-step-2",
	"scan-step-3",
	"scan-step-4",
	"scan-step-5",
	"scan-step-6",
] as const;

function downloadBackup() {
	if (typeof window === "undefined") return;
	const raw = localStorage.getItem(WALLET_STORAGE_KEY);
	if (!raw) return;
	const blob = new Blob([raw], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `1sat-wallet-backup-${Date.now()}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export function MigrationWizard() {
	const router = useRouter();
	const { walletKeys, isWalletLocked, isWalletInitialized, hasWallet } =
		useWallet();
	const toolbox = useWalletToolbox();

	const [step, setStep] = useState<WizardStep>("intro");
	const [progress, setProgress] = useState("");
	const [progressPercent, setProgressPercent] = useState(0);
	const [sweepResult, setSweepResult] = useState<SweepResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Ordinal selection
	const [selectedOrdinals, setSelectedOrdinals] = useState<Set<string>>(
		new Set(),
	);
	const [ordinalPage, setOrdinalPage] = useState(0);

	// Detect migration status
	const migrationStatus: MigrationStatus | null = useMemo(() => {
		if (!walletKeys || isWalletLocked) return null;
		return detectMigrationStatus(walletKeys);
	}, [walletKeys, isWalletLocked]);

	const needsMigration = migrationStatus?.status === "legacy";

	// Legacy addresses for scanning
	const legacyPayAddress =
		migrationStatus?.status === "legacy"
			? migrationStatus.legacyPayAddress
			: null;
	const legacyOrdAddress =
		migrationStatus?.status === "legacy"
			? migrationStatus.legacyOrdAddress
			: null;

	// Only scan when we've moved past intro
	const shouldScan = step !== "intro" && needsMigration;
	const assets = useLegacyAssets(
		shouldScan ? legacyPayAddress : null,
		shouldScan ? legacyOrdAddress : null,
	);

	// Transition from scan to preview when scan completes
	useEffect(() => {
		if (step !== "scan") return;
		if (!assets.loading && !assets.error) {
			setStep("preview");
		}
	}, [step, assets.loading, assets.error]);

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

	const bsv21OutputCount = useMemo(() => {
		return assets.bsv21Tokens.reduce((sum, tb) => sum + tb.outputs.length, 0);
	}, [assets.bsv21Tokens]);

	// Run migration
	const runMigration = useCallback(async () => {
		if (!walletKeys || !migrationStatus || migrationStatus.status !== "legacy")
			return;

		setStep("migrate");
		setError(null);
		setProgressPercent(0);

		try {
			setProgress("Deriving identity key...");
			setProgressPercent(10);
			const identityKey = deriveIdentityKey(
				migrationStatus.legacyPayWif,
				migrationStatus.legacyOrdWif,
			);
			const identityWif = identityKey.toWif();

			const updatedKeys = {
				...walletKeys,
				identityPk: identityWif,
				identityAddressPath: "derived" as string | number | undefined,
			};

			setProgress("Updating encrypted wallet...");
			setProgressPercent(25);
			const reencrypted = await reencryptWallet(updatedKeys);
			if (!reencrypted) {
				throw new Error(
					"Failed to re-encrypt wallet. Try unlocking your wallet again first.",
				);
			}

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

			if (toolbox.wallet && toolbox.services) {
				const totalSweepable =
					assets.funding.length + sweepOrdinals.length + bsv21OutputCount;

				if (totalSweepable > 0 || assets.mneeBalance > 0) {
					setProgress(
						`Sweeping ${totalSweepable} asset${totalSweepable !== 1 ? "s" : ""}...`,
					);
					setProgressPercent(60);

					const result = await executeMigrationSweep({
						wallet: toolbox.wallet,
						services: toolbox.services,
						chain: toolbox.chain,
						legacyPayWif: migrationStatus.legacyPayWif,
						legacyOrdWif: migrationStatus.legacyOrdWif,
						legacyIdentityWif: identityWif,
						onProgress: (stage) => {
							setProgress(stage);
							setProgressPercent((prev) => Math.min(prev + 10, 95));
						},
						funding: assets.funding,
						ordinals: sweepOrdinals,
						bsv21Tokens: assets.bsv21Tokens,
						mneeBalance: assets.mneeBalance,
					});

					setSweepResult(result);
				} else {
					setSweepResult({
						ordinalTxids: [],
						bsv21Txids: [],
						errors: [],
					});
				}
			}

			setProgressPercent(100);
			setStep("complete");
		} catch (err) {
			console.error("[Migration] Failed:", err);
			setError(err instanceof Error ? err.message : String(err));
			setStep("error");
		}
	}, [
		walletKeys,
		migrationStatus,
		toolbox,
		assets.funding,
		assets.bsv21Tokens,
		assets.mneeBalance,
		sweepOrdinals,
		bsv21OutputCount,
	]);

	const totalAssets =
		assets.funding.length +
		assets.ordinals.length +
		assets.opnsNames.length +
		assets.bsv21Tokens.reduce((sum, t) => sum + t.outputs.length, 0);

	// Don't render if not applicable
	if (!isWalletInitialized) return null;
	if (!hasWallet) return null;
	if (isWalletLocked) return null;
	if (!needsMigration) return null;
	// Once complete or dismissed, don't show
	if (step === "complete" && !sweepResult) return null;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-label="Wallet migration"
			className="fixed inset-0 z-[120] flex items-center justify-center bg-background backdrop-blur-md"
		>
			{/* Ambient glow */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="absolute -top-1/4 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />
			</div>

			<div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 animate-in fade-in zoom-in-95 duration-300">
				{step === "intro" && (
					<IntroStep
						onContinue={() => setStep("scan")}
						onStartFresh={() => {
							downloadBackup();
							router.push("/wallet/create");
						}}
					/>
				)}

				{step === "scan" && (
					<ScanStep error={assets.error} onRetry={assets.rescan} />
				)}

				{step === "preview" && migrationStatus?.status === "legacy" && (
					<PreviewStep
						migrationStatus={migrationStatus}
						assets={assets}
						selectedOrdinals={selectedOrdinals}
						ordinalPage={ordinalPage}
						totalAssets={totalAssets}
						onToggleOrdinal={handleToggleOrdinal}
						onSelectAll={handleSelectAll}
						onDeselectAll={handleDeselectAll}
						onPageChange={setOrdinalPage}
						onBeginMigration={runMigration}
					/>
				)}

				{step === "migrate" && (
					<MigrateStep progress={progress} progressPercent={progressPercent} />
				)}

				{step === "complete" && (
					<CompleteStep
						sweepResult={sweepResult}
						onDismiss={() => {
							// Force re-render by navigating to wallet
							router.push("/wallet");
							// The wizard will unmount since migrationStatus will be "migrated"
							router.refresh();
						}}
					/>
				)}

				{step === "error" && error && (
					<ErrorStep error={error} onRetry={() => setStep("preview")} />
				)}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Step: Intro
// ---------------------------------------------------------------------------

function IntroStep({
	onContinue,
	onStartFresh,
}: {
	onContinue: () => void;
	onStartFresh: () => void;
}) {
	return (
		<div className="space-y-8 text-center">
			<div className="space-y-4">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
					<Shield className="h-8 w-8 text-primary" />
				</div>
				<h1 className="text-3xl font-bold tracking-tight">
					Wallet Upgrade Required
				</h1>
				<p className="mx-auto max-w-md text-muted-foreground leading-relaxed">
					Your wallet uses a legacy key structure. We need to derive an identity
					key and migrate your assets to the new system.
				</p>
			</div>

			<div className="mx-auto max-w-sm space-y-3">
				<Button
					onClick={onContinue}
					className="w-full h-12 text-base gap-2"
					size="lg"
				>
					Continue
					<ArrowRight className="h-4 w-4" />
				</Button>

				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-border/50" />
					</div>
					<div className="relative flex justify-center text-xs">
						<span className="bg-background px-3 text-muted-foreground/60">
							or
						</span>
					</div>
				</div>

				<Button
					variant="ghost"
					onClick={onStartFresh}
					className="w-full gap-2 text-muted-foreground hover:text-foreground"
				>
					<Download className="h-4 w-4" />
					Download Backup &amp; Start Fresh
				</Button>
				<p className="text-[11px] text-muted-foreground/50">
					Downloads your encrypted wallet file, then creates a new wallet.
				</p>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Step: Scan
// ---------------------------------------------------------------------------

function ScanStep({
	error,
	onRetry,
}: {
	error: string | null;
	onRetry: () => void;
}) {
	if (error) {
		return (
			<div className="space-y-6 text-center">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
					<AlertTriangle className="h-8 w-8 text-destructive" />
				</div>
				<div className="space-y-2">
					<h2 className="text-xl font-semibold">Scan Failed</h2>
					<p className="text-sm text-destructive">{error}</p>
				</div>
				<Button variant="outline" onClick={onRetry} className="gap-2">
					<RefreshCw className="h-4 w-4" />
					Retry Scan
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-8 text-center">
			<div className="space-y-4">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
					<Loader2 className="h-8 w-8 text-primary animate-spin" />
				</div>
				<h2 className="text-xl font-semibold">Scanning Legacy Addresses</h2>
				<p className="text-sm text-muted-foreground">
					Looking for BSV, ordinals, and tokens...
				</p>
			</div>
			<div className="mx-auto max-w-sm space-y-4">
				<Skeleton className="h-16 w-full" />
				<div className="grid grid-cols-3 gap-3">
					{SCAN_SKELETON_KEYS.map((key) => (
						<Skeleton key={key} className="aspect-square w-full" />
					))}
				</div>
				<Skeleton className="h-12 w-full" />
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Step: Preview
// ---------------------------------------------------------------------------

function PreviewStep({
	migrationStatus,
	assets,
	selectedOrdinals,
	ordinalPage,
	totalAssets,
	onToggleOrdinal,
	onSelectAll,
	onDeselectAll,
	onPageChange,
	onBeginMigration,
}: {
	migrationStatus: Extract<MigrationStatus, { status: "legacy" }>;
	assets: ReturnType<typeof useLegacyAssets>;
	selectedOrdinals: Set<string>;
	ordinalPage: number;
	totalAssets: number;
	onToggleOrdinal: (outpoint: string) => void;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	onPageChange: (page: number) => void;
	onBeginMigration: () => void;
}) {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="text-center space-y-2">
				<h2 className="text-2xl font-bold tracking-tight">
					Review Your Assets
				</h2>
				<p className="text-sm text-muted-foreground">
					{totalAssets > 0
						? `Found ${totalAssets} asset${totalAssets !== 1 ? "s" : ""} to migrate from your legacy addresses.`
						: "No sweepable assets found. Migration will still derive your identity key."}
				</p>
			</div>

			{/* Legacy addresses */}
			<div className="border border-border/50 bg-muted/20 p-4 space-y-2 text-sm">
				<div className="flex justify-between">
					<span className="text-muted-foreground">Legacy Pay</span>
					<code className="text-xs font-mono">
						{migrationStatus.legacyPayAddress}
					</code>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Legacy Ord</span>
					<code className="text-xs font-mono">
						{migrationStatus.legacyOrdAddress}
					</code>
				</div>
			</div>

			{/* Asset sections */}
			<div className="space-y-3">
				<FundingSection funding={assets.funding} totalBsv={assets.totalBsv} />
				<OrdinalsSection
					ordinals={assets.ordinals}
					selectedOrdinals={selectedOrdinals}
					onToggle={onToggleOrdinal}
					onSelectAll={onSelectAll}
					onDeselectAll={onDeselectAll}
					ordinalPage={ordinalPage}
					onPageChange={onPageChange}
				/>
				<OpnsSection opnsNames={assets.opnsNames} />
				<TokensSection tokens={assets.bsv21Tokens} />
				<MneeSection mneeBalance={assets.mneeBalance} />
				<Bsv20Section tokens={assets.bsv20Tokens} />
				<LockedSection locked={assets.locked} />
				<RunSection run={assets.run} />
			</div>

			{/* CTA */}
			<div className="space-y-3 pt-2">
				<div className="text-xs text-muted-foreground text-center">
					This will derive your identity key, re-encrypt your wallet,
					reinitialize BRC-100
					{totalAssets > 0 && ", and sweep selected assets"}.
				</div>
				<Button
					onClick={onBeginMigration}
					className="w-full h-12 text-base gap-2"
					size="lg"
				>
					<Sparkles className="h-4 w-4" />
					Begin Migration
					{totalAssets > 0 &&
						` (${totalAssets} asset${totalAssets !== 1 ? "s" : ""})`}
				</Button>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Step: Migrate
// ---------------------------------------------------------------------------

function MigrateStep({
	progress,
	progressPercent,
}: {
	progress: string;
	progressPercent: number;
}) {
	return (
		<div className="space-y-8 text-center">
			<div className="space-y-4">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
					<Loader2 className="h-8 w-8 text-primary animate-spin" />
				</div>
				<h2 className="text-2xl font-bold tracking-tight">Migrating</h2>
				<p className="text-sm text-destructive/80 font-medium">
					Do not close this page or lock your wallet.
				</p>
			</div>
			<div className="mx-auto max-w-sm space-y-4">
				<Progress value={progressPercent} className="h-2" />
				<p className="text-sm text-muted-foreground animate-pulse">
					{progress}
				</p>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Step: Complete
// ---------------------------------------------------------------------------

function CompleteStep({
	sweepResult,
	onDismiss,
}: {
	sweepResult: SweepResult | null;
	onDismiss: () => void;
}) {
	return (
		<div className="space-y-8 text-center">
			<div className="space-y-4">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-chart-2/10 ring-1 ring-chart-2/20">
					<CheckCircle2 className="h-8 w-8 text-chart-2" />
				</div>
				<h2 className="text-2xl font-bold tracking-tight">
					Migration Complete
				</h2>
				<p className="text-sm text-muted-foreground">
					Your wallet has been upgraded to the identity key system.
				</p>
			</div>

			{sweepResult && (
				<div className="mx-auto max-w-sm space-y-2 text-sm text-left">
					{sweepResult.bsvTxid && (
						<div className="flex justify-between border-b border-border/30 pb-2">
							<span className="text-muted-foreground">BSV Sweep</span>
							<code className="text-xs font-mono">
								{sweepResult.bsvTxid.slice(0, 16)}...
							</code>
						</div>
					)}
					{sweepResult.ordinalTxids.map((txid) => (
						<div
							key={txid}
							className="flex justify-between border-b border-border/30 pb-2"
						>
							<span className="text-muted-foreground">Ordinal Sweep</span>
							<code className="text-xs font-mono">{txid.slice(0, 16)}...</code>
						</div>
					))}
					{sweepResult.bsv21Txids.map((txid) => (
						<div
							key={txid}
							className="flex justify-between border-b border-border/30 pb-2"
						>
							<span className="text-muted-foreground">Token Sweep</span>
							<code className="text-xs font-mono">{txid.slice(0, 16)}...</code>
						</div>
					))}
					{sweepResult.mneeTxid && (
						<div className="flex justify-between border-b border-border/30 pb-2">
							<span className="text-muted-foreground">MNEE Sweep</span>
							<code className="text-xs font-mono">
								{sweepResult.mneeTxid.slice(0, 16)}...
							</code>
						</div>
					)}
					{sweepResult.errors.length > 0 && (
						<div className="space-y-1 pt-2">
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
					{!sweepResult.bsvTxid &&
						sweepResult.ordinalTxids.length === 0 &&
						sweepResult.bsv21Txids.length === 0 &&
						sweepResult.errors.length === 0 && (
							<p className="text-center text-muted-foreground">
								No assets found at legacy addresses.
							</p>
						)}
				</div>
			)}

			<Button
				onClick={onDismiss}
				className="mx-auto h-12 px-8 text-base gap-2"
				size="lg"
			>
				Go to Wallet
				<ArrowRight className="h-4 w-4" />
			</Button>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Step: Error
// ---------------------------------------------------------------------------

function ErrorStep({ error, onRetry }: { error: string; onRetry: () => void }) {
	return (
		<div className="space-y-8 text-center">
			<div className="space-y-4">
				<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 ring-1 ring-destructive/20">
					<AlertTriangle className="h-8 w-8 text-destructive" />
				</div>
				<h2 className="text-2xl font-bold tracking-tight">Migration Failed</h2>
				<p className="text-sm text-destructive">{error}</p>
			</div>

			<Button variant="outline" onClick={onRetry} className="gap-2">
				<RefreshCw className="h-4 w-4" />
				Retry
			</Button>
		</div>
	);
}
