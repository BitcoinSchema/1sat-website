"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLegacyAssets } from "@/lib/hooks/use-legacy-assets";
import { executeMigrationSweep } from "@/lib/sweep-migration";
import { detectMigrationStatus } from "@/lib/wallet-migration";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

const DISMISSED_KEY = "legacy_sweep_banner_dismissed_v1";

function formatBsv(satoshis: number): string {
	return (satoshis / 100_000_000).toFixed(8);
}

export function LegacySweepBanner() {
	const { walletKeys, isWalletLocked } = useWallet();
	const { wallet, services, chain, refreshBalance } = useWalletToolbox();

	const [dismissed, setDismissed] = useState(false);
	const [isSweeping, setIsSweeping] = useState(false);
	const [progressText, setProgressText] = useState<string | null>(null);
	const [errorText, setErrorText] = useState<string | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;
		setDismissed(window.sessionStorage.getItem(DISMISSED_KEY) === "1");
	}, []);

	const dismiss = useCallback(() => {
		setDismissed(true);
		if (typeof window !== "undefined") {
			window.sessionStorage.setItem(DISMISSED_KEY, "1");
		}
	}, []);

	const migrationStatus = useMemo(() => {
		if (!walletKeys || isWalletLocked) return null;
		return detectMigrationStatus(walletKeys);
	}, [walletKeys, isWalletLocked]);

	const legacyPayAddress =
		migrationStatus?.status === "migrated"
			? (migrationStatus.legacyPayAddress ?? null)
			: null;
	const legacyOrdAddress =
		migrationStatus?.status === "migrated"
			? (migrationStatus.legacyOrdAddress ?? null)
			: null;

	const assets = useLegacyAssets(legacyPayAddress, legacyOrdAddress);
	const { funding, ordinals, bsv21Tokens, totalBsv, loading, rescan } = assets;

	const sweepableAssetCount = useMemo(() => {
		return (
			funding.length +
			ordinals.length +
			bsv21Tokens.reduce((sum, token) => sum + token.outputs.length, 0)
		);
	}, [funding.length, ordinals.length, bsv21Tokens]);

	const canSweep =
		migrationStatus?.status === "migrated" &&
		!!migrationStatus.legacyPayWif &&
		!!migrationStatus.legacyOrdWif &&
		!!migrationStatus.legacyPayAddress &&
		!!migrationStatus.legacyOrdAddress &&
		!!wallet &&
		!!services;

	const hasSweepableAssets = sweepableAssetCount > 0;
	const shouldShow =
		!dismissed &&
		!loading &&
		migrationStatus?.status === "migrated" &&
		hasSweepableAssets;

	const onSweep = useCallback(async () => {
		if (
			!canSweep ||
			migrationStatus.status !== "migrated" ||
			!wallet ||
			!services ||
			!migrationStatus.legacyPayWif ||
			!migrationStatus.legacyOrdWif ||
			!migrationStatus.legacyPayAddress ||
			!migrationStatus.legacyOrdAddress
		) {
			return;
		}

		const { legacyPayWif, legacyOrdWif, legacyPayAddress, legacyOrdAddress } =
			migrationStatus;

		setIsSweeping(true);
		setErrorText(null);
		setProgressText("Starting sweep...");

		try {
			const result = await executeMigrationSweep({
				wallet,
				services,
				chain,
				legacyPayWif,
				legacyOrdWif,
				legacyPayAddress,
				legacyOrdAddress,
				onProgress: setProgressText,
				fundingUtxos: funding,
				ordinalUtxos: ordinals,
				bsv21Utxos: bsv21Tokens.flatMap((token) => token.outputs),
			});

			if (result.errors.length > 0) {
				setErrorText(result.errors.join(" | "));
				setProgressText(null);
				return;
			}

			await refreshBalance();
			rescan();
			dismiss();
		} catch (error) {
			setErrorText(error instanceof Error ? error.message : String(error));
		} finally {
			setIsSweeping(false);
		}
	}, [
		canSweep,
		migrationStatus,
		wallet,
		services,
		chain,
		funding,
		ordinals,
		bsv21Tokens,
		rescan,
		refreshBalance,
		dismiss,
	]);

	if (!shouldShow) {
		return null;
	}

	return (
		<div className="mb-4 rounded-md border border-chart-1/30 bg-chart-1/10 p-3">
			<div className="mb-2 flex items-start justify-between gap-2">
				<div className="flex items-center gap-2 text-sm font-medium">
					<AlertTriangle className="h-4 w-4 text-chart-1" />
					<span>Legacy funds detected</span>
				</div>
				<Button
					size="icon"
					variant="ghost"
					className="h-6 w-6"
					onClick={dismiss}
					disabled={isSweeping}
					aria-label="Dismiss legacy sweep notice"
				>
					<X className="h-3 w-3" />
				</Button>
			</div>

			<p className="mb-3 text-xs text-muted-foreground">
				{formatBsv(totalBsv)} BSV across {sweepableAssetCount} sweepable legacy
				asset{sweepableAssetCount === 1 ? "" : "s"}.
			</p>

			{progressText && (
				<p className="mb-2 text-xs text-muted-foreground">{progressText}</p>
			)}
			{errorText && (
				<p className="mb-2 text-xs text-destructive">{errorText}</p>
			)}

			<Button
				size="sm"
				className="w-full"
				onClick={onSweep}
				disabled={isSweeping || !canSweep}
			>
				{isSweeping ? (
					<>
						<Loader2 className="mr-2 h-3 w-3 animate-spin" />
						Sweeping...
					</>
				) : (
					"Sweep to Wallet"
				)}
			</Button>
		</div>
	);
}
