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
import { MigrationOrdinalCard } from "@/components/wallet/migration-ordinal-card";
import {
	type OrdinalWithMeta,
	type TokenBalance,
	useLegacyAssets,
} from "@/lib/hooks/use-legacy-assets";
import { deriveIdentityKey } from "@/lib/keys";
import { executeMigrationSweep, type SweepResult } from "@/lib/sweep-migration";
import type { WalletOrdinal } from "@/lib/types/ordinals";
import {
	detectMigrationStatus,
	type MigrationStatus,
} from "@/lib/wallet-migration";
import { reencryptWallet, saveSessionKeys } from "@/lib/wallet-storage";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ORDINALS_PER_PAGE = 20;

type MigrationPhase = "scan" | "preview" | "migrate" | "complete" | "error";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSats(sats: number): string {
	return sats.toLocaleString();
}

function formatTokenAmount(rawAmount: string, decimals: number): string {
	if (decimals === 0) return rawAmount;
	const padded = rawAmount.padStart(decimals + 1, "0");
	const intPart = padded.slice(0, -decimals) || "0";
	const decPart = padded.slice(-decimals).replace(/0+$/, "");
	return decPart ? `${intPart}.${decPart}` : intPart;
}

// ---------------------------------------------------------------------------
// Scanning skeleton
// ---------------------------------------------------------------------------

function ScanningState() {
	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-72" />
				</CardHeader>
				<CardContent className="space-y-4">
					<Skeleton className="h-16 w-full" />
					<div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
						{Array.from({ length: 6 }).map((_, i) => (
							<Skeleton key={`skel-${i}`} className="aspect-square w-full" />
						))}
					</div>
					<Skeleton className="h-12 w-full" />
				</CardContent>
			</Card>
		</div>
	);
}

// ---------------------------------------------------------------------------
// BSV Funding Section
// ---------------------------------------------------------------------------

function FundingSection({
	funding,
	totalBsv,
}: {
	funding: WalletOrdinal[];
	totalBsv: number;
}) {
	if (funding.length === 0) return null;

	return (
		<div className="bg-gradient-to-br from-chart-2/5 to-transparent border border-chart-2/20 p-5">
			<div className="flex items-center gap-2 mb-3">
				<span className="h-2 w-2 bg-chart-2" />
				<span className="text-sm font-semibold text-chart-2">BSV Funding</span>
			</div>

			<div className="flex items-baseline justify-between">
				<div>
					<div className="text-2xl font-bold text-chart-2">
						{formatSats(totalBsv)} sats
					</div>
					<div className="text-xs text-muted-foreground">
						{(totalBsv / 100_000_000).toFixed(8)} BSV
					</div>
				</div>
				<Badge variant="secondary" className="text-xs">
					{funding.length} UTXO{funding.length !== 1 ? "s" : ""}
				</Badge>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Ordinals Section with selection & pagination
// ---------------------------------------------------------------------------

function OrdinalsSection({
	ordinals,
	selectedOrdinals,
	onToggle,
	onSelectAll,
	onDeselectAll,
	ordinalPage,
	onPageChange,
}: {
	ordinals: OrdinalWithMeta[];
	selectedOrdinals: Set<string>;
	onToggle: (outpoint: string) => void;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	ordinalPage: number;
	onPageChange: (page: number) => void;
}) {
	if (ordinals.length === 0) return null;

	const totalPages = Math.ceil(ordinals.length / ORDINALS_PER_PAGE);
	const start = ordinalPage * ORDINALS_PER_PAGE;
	const pageItems = ordinals.slice(start, start + ORDINALS_PER_PAGE);
	const selectedCount = selectedOrdinals.size;

	return (
		<div className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/20 p-5">
			<div className="flex items-start justify-between mb-4">
				<div>
					<div className="flex items-center gap-2 mb-1">
						<span className="h-2 w-2 bg-primary" />
						<span className="text-sm font-semibold text-primary">Ordinals</span>
					</div>
					<div className="text-xs text-muted-foreground">
						{ordinals.length} inscription
						{ordinals.length !== 1 ? "s" : ""} found
						{selectedCount > 0 && (
							<span className="text-primary ml-1">
								({selectedCount} selected)
							</span>
						)}
					</div>
				</div>

				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-7 text-[11px]"
						onClick={onSelectAll}
					>
						Select All
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-7 text-[11px]"
						onClick={onDeselectAll}
						disabled={selectedCount === 0}
					>
						Deselect
					</Button>
				</div>
			</div>

			{/* Grid */}
			<div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 mb-4">
				{pageItems.map((ordinal) => (
					<MigrationOrdinalCard
						key={ordinal.outpoint}
						ordinal={ordinal}
						isSelected={selectedOrdinals.has(ordinal.outpoint)}
						onToggle={() => onToggle(ordinal.outpoint)}
					/>
				))}
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="flex items-center justify-center gap-4">
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="text-xs"
						onClick={() => onPageChange(ordinalPage - 1)}
						disabled={ordinalPage === 0}
					>
						Prev
					</Button>
					<span className="text-xs text-muted-foreground">
						Page {ordinalPage + 1} of {totalPages}
					</span>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="text-xs"
						onClick={() => onPageChange(ordinalPage + 1)}
						disabled={ordinalPage >= totalPages - 1}
					>
						Next
					</Button>
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// BSV-21 Tokens Section
// ---------------------------------------------------------------------------

function TokensSection({ tokens }: { tokens: TokenBalance[] }) {
	if (tokens.length === 0) return null;

	return (
		<div className="bg-gradient-to-br from-chart-4/5 to-transparent border border-chart-4/20 p-5">
			<div className="flex items-center gap-2 mb-4">
				<span className="h-2 w-2 bg-chart-4" />
				<span className="text-sm font-semibold text-chart-4">
					BSV-21 Tokens
				</span>
			</div>

			<div className="space-y-3">
				{tokens.map((tb) => (
					<div
						key={tb.tokenId}
						className="flex items-center justify-between border border-chart-4/10 bg-black/10 p-3"
					>
						<div className="flex items-center gap-3">
							{tb.icon ? (
								<img
									src={tb.icon}
									alt={tb.symbol || "Token"}
									className="h-8 w-8 object-cover"
									onError={(e) => {
										(e.target as HTMLImageElement).style.display = "none";
									}}
								/>
							) : (
								<div className="flex h-8 w-8 items-center justify-center bg-chart-4/20 text-chart-4 text-sm">
									T
								</div>
							)}
							<div>
								<div className="font-medium text-foreground">
									{tb.symbol || tb.tokenId.slice(0, 8)}
								</div>
								<div className="text-xs text-muted-foreground">
									{formatTokenAmount(tb.totalAmount, tb.decimals)}{" "}
									{tb.symbol || ""}
								</div>
							</div>
						</div>
						<Badge variant="secondary" className="text-xs">
							{tb.outputs.length} output
							{tb.outputs.length !== 1 ? "s" : ""}
						</Badge>
					</div>
				))}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// BSV-20 Display-only Section
// ---------------------------------------------------------------------------

function Bsv20Section({ tokens }: { tokens: WalletOrdinal[] }) {
	if (tokens.length === 0) return null;

	const ticks = tokens.map((t) => {
		const bsv20 = t.origin?.data?.bsv20 ?? t.data?.bsv20;
		return bsv20?.tick || bsv20?.sym || "?";
	});

	return (
		<div className="bg-gradient-to-br from-muted/20 to-transparent border border-muted/30 p-5">
			<div className="flex items-center gap-2 mb-3">
				<span className="h-2 w-2 bg-muted-foreground" />
				<span className="text-sm font-semibold text-muted-foreground">
					BSV-20 Tokens
				</span>
			</div>
			<p className="text-xs text-muted-foreground mb-3">
				BSV-20 tokens cannot be swept automatically.
			</p>
			<div className="flex flex-wrap gap-2">
				{ticks.slice(0, 10).map((tick, i) => (
					<Badge
						key={`${tick}-${tokens[i]?.outpoint}`}
						variant="outline"
						className="text-xs text-muted-foreground"
					>
						{tick}
					</Badge>
				))}
				{ticks.length > 10 && (
					<span className="text-xs text-muted-foreground">
						+{ticks.length - 10} more
					</span>
				)}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Migration Progress
// ---------------------------------------------------------------------------

function MigrationProgress({
	progress,
	progressPercent,
}: {
	progress: string;
	progressPercent: number;
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
}: {
	sweepResult: SweepResult | null;
	onBackToWallet: () => void;
}) {
	return (
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
								<code className="text-xs font-mono">
									{sweepResult.bsvTxid.slice(0, 16)}...
								</code>
							</div>
						)}
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
						{!sweepResult.bsvTxid &&
							sweepResult.ordinalTxids.length === 0 &&
							sweepResult.bsv21Txids.length === 0 &&
							sweepResult.errors.length === 0 && (
								<p className="text-sm text-muted-foreground">
									No assets found at legacy addresses.
								</p>
							)}
					</div>
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

	// Scan legacy assets
	const legacyPayAddress =
		migrationStatus?.status === "legacy"
			? migrationStatus.legacyPayAddress
			: null;
	const legacyOrdAddress =
		migrationStatus?.status === "legacy"
			? migrationStatus.legacyOrdAddress
			: null;

	const assets = useLegacyAssets(legacyPayAddress, legacyOrdAddress);

	// Transition from scan to preview when scan completes
	useEffect(() => {
		if (!migrationStatus) return;

		if (migrationStatus.status === "migrated") {
			setPhase("complete");
		} else if (migrationStatus.status === "legacy") {
			if (!assets.loading && !assets.error) {
				setPhase("preview");
			}
		} else {
			setError("Wallet cannot be migrated (missing pay or ord key)");
			setPhase("error");
		}
	}, [migrationStatus, assets.loading, assets.error]);

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

	// Build pre-scanned asset arrays for sweep
	const selectedOrdinalUtxos = useMemo(() => {
		return assets.ordinals.filter((o) =>
			selectedOrdinals.has(o.outpoint),
		) as WalletOrdinal[];
	}, [assets.ordinals, selectedOrdinals]);

	const bsv21Utxos = useMemo(() => {
		return assets.bsv21Tokens.flatMap((tb) => tb.outputs);
	}, [assets.bsv21Tokens]);

	// Run migration
	const runMigration = useCallback(async () => {
		if (!walletKeys || !migrationStatus || migrationStatus.status !== "legacy")
			return;

		setPhase("migrate");
		setError(null);
		setProgressPercent(0);

		try {
			// 1. Derive identity key
			setProgress("Deriving identity key...");
			setProgressPercent(10);
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

			// 3. Re-encrypt wallet
			setProgress("Updating encrypted wallet...");
			setProgressPercent(25);
			const reencrypted = await reencryptWallet(updatedKeys);
			if (!reencrypted) {
				throw new Error(
					"Failed to re-encrypt wallet. Try unlocking your wallet again first.",
				);
			}

			// 4. Update session storage
			saveSessionKeys(
				updatedKeys.payPk,
				updatedKeys.ordPk,
				updatedKeys.identityPk,
			);

			// 5. Reinitialize BRC-100 wallet with identity key
			setProgress("Reinitializing BRC-100 wallet...");
			setProgressPercent(40);
			if (toolbox.isInitialized) {
				await toolbox.destroyWallet();
			}

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
				const totalSweepable =
					assets.funding.length +
					selectedOrdinalUtxos.length +
					bsv21Utxos.length;

				if (totalSweepable > 0) {
					setProgress(
						`Sweeping ${totalSweepable} asset${totalSweepable !== 1 ? "s" : ""}...`,
					);
					setProgressPercent(60);

					const result = await executeMigrationSweep({
						wallet: toolbox.wallet,
						services: toolbox.services,
						legacyPayWif: migrationStatus.legacyPayWif,
						legacyOrdWif: migrationStatus.legacyOrdWif,
						legacyPayAddress: migrationStatus.legacyPayAddress,
						legacyOrdAddress: migrationStatus.legacyOrdAddress,
						onProgress: (stage) => {
							setProgress(stage);
							setProgressPercent((prev) => Math.min(prev + 10, 95));
						},
						fundingUtxos: assets.funding,
						ordinalUtxos: selectedOrdinalUtxos,
						bsv21Utxos,
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
			setPhase("complete");
		} catch (err) {
			console.error("[Migration] Failed:", err);
			setError(err instanceof Error ? err.message : String(err));
			setPhase("error");
		}
	}, [
		walletKeys,
		migrationStatus,
		toolbox,
		assets.funding,
		selectedOrdinalUtxos,
		bsv21Utxos,
	]);

	// Asset counts for the summary
	const totalAssets =
		assets.funding.length +
		assets.ordinals.length +
		assets.bsv21Tokens.reduce((sum, t) => sum + t.outputs.length, 0);

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
				{phase === "scan" && assets.loading && <ScanningState />}

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
				{phase === "preview" && migrationStatus?.status === "legacy" && (
					<>
						{/* Legacy addresses */}
						<Card>
							<CardHeader>
								<CardTitle>Migration Required</CardTitle>
								<CardDescription>
									Your wallet uses the legacy payment key as its BRC-100 root.
									Review the assets below, then migrate.
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Legacy Pay Address
									</span>
									<code className="text-xs">
										{migrationStatus.legacyPayAddress}
									</code>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">
										Legacy Ord Address
									</span>
									<code className="text-xs">
										{migrationStatus.legacyOrdAddress}
									</code>
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

							<TokensSection tokens={assets.bsv21Tokens} />

							<Bsv20Section tokens={assets.bsv20Tokens} />
						</div>

						{/* No assets found */}
						{totalAssets === 0 && assets.bsv20Tokens.length === 0 && (
							<Card>
								<CardContent className="py-8 text-center text-muted-foreground">
									No assets found at legacy addresses. Migration will still
									derive your identity key.
								</CardContent>
							</Card>
						)}

						{/* Migration CTA */}
						<Separator />

						<div className="space-y-3">
							<div className="text-xs text-muted-foreground">
								This will: derive your identity key, re-encrypt your wallet
								backup, reinitialize the BRC-100 wallet
								{totalAssets > 0 &&
									", and sweep all selected assets from legacy addresses"}
								.
							</div>
							<Button onClick={runMigration} className="w-full">
								Derive Identity Key &amp; Sweep
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
					/>
				)}

				{/* Complete */}
				{phase === "complete" && (
					<CompletionState
						sweepResult={sweepResult}
						onBackToWallet={() => router.push("/wallet")}
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
