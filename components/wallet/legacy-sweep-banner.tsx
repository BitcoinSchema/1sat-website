"use client";

import { AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useLegacyAssets } from "@/lib/hooks/use-legacy-assets";
import { detectMigrationStatus } from "@/lib/wallet-migration";
import { useWallet } from "@/providers/wallet-provider";

const DISMISSED_KEY = "legacy_sweep_banner_dismissed_v1";

export function LegacySweepBanner() {
	const { walletKeys, isWalletLocked } = useWallet();
	const { isMobile, setOpenMobile } = useSidebar();

	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		setDismissed(window.sessionStorage.getItem(DISMISSED_KEY) === "1");
	}, []);

	const dismiss = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDismissed(true);
		if (typeof window !== "undefined") {
			window.sessionStorage.setItem(DISMISSED_KEY, "1");
		}
	}, []);

	const migrationStatus = useMemo(() => {
		if (!walletKeys || isWalletLocked) return null;
		return detectMigrationStatus(walletKeys);
	}, [walletKeys, isWalletLocked]);

	const isLegacy = migrationStatus?.status === "legacy";

	const legacyPayAddress =
		migrationStatus?.status === "migrated"
			? (migrationStatus.legacyPayAddress ?? null)
			: null;
	const legacyOrdAddress =
		migrationStatus?.status === "migrated"
			? (migrationStatus.legacyOrdAddress ?? null)
			: null;
	const legacyIdentityAddress =
		migrationStatus?.status === "migrated"
			? (migrationStatus.legacyIdentityAddress ?? null)
			: null;

	const { funding, ordinals, opnsNames, bsv21Tokens, mneeBalance, loading } =
		useLegacyAssets(legacyPayAddress, legacyOrdAddress, legacyIdentityAddress);

	const sweepableAssetCount = useMemo(() => {
		return (
			funding.length +
			ordinals.length +
			opnsNames.length +
			bsv21Tokens.reduce((sum, token) => sum + token.outputs.length, 0) +
			(mneeBalance > 0 ? 1 : 0)
		);
	}, [
		funding.length,
		ordinals.length,
		opnsNames.length,
		bsv21Tokens,
		mneeBalance,
	]);

	const leftoverAfterMigrate =
		!loading &&
		migrationStatus?.status === "migrated" &&
		sweepableAssetCount > 0;

	if (dismissed || (!isLegacy && !leftoverAfterMigrate)) {
		return null;
	}

	const title = isLegacy ? "Migrate assets" : "Legacy assets";
	const detail = isLegacy
		? "Optional. Run this when you are ready."
		: `${sweepableAssetCount} item${sweepableAssetCount === 1 ? "" : "s"} need sweeping`;

	return (
		<SidebarMenu>
			<SidebarMenuItem className="relative">
				<SidebarMenuButton
					asChild
					className="text-chart-1 hover:text-chart-1 hover:bg-chart-1/10 pr-8 h-auto"
				>
					<Link
						href="/wallet/migrate"
						onClick={() => {
							if (isMobile) setOpenMobile(false);
						}}
					>
						<AlertTriangle className="h-4 w-4 shrink-0" />
						<div className="flex flex-col min-w-0">
							<span className="truncate">{title}</span>
							<span className="text-[10px] text-muted-foreground leading-none mt-0.5">
								{detail}
							</span>
						</div>
					</Link>
				</SidebarMenuButton>
				{/* dismiss lives outside the anchor — nested interactive elements
				inside a link misfire tap handling on iOS */}
				<button
					type="button"
					onClick={dismiss}
					aria-label="Dismiss migration notice"
					className="absolute right-1 top-1/2 -translate-y-1/2 shrink-0 rounded p-1 opacity-60 hover:opacity-100 hover:bg-chart-1/20 transition-opacity"
				>
					<X className="h-3 w-3" />
				</button>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
