"use client";

/**
 * Sync Progress Component
 *
 * Shows sync status based on balance query state plus monitor task indicators.
 */

import { RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

interface SyncProgressProps {
	className?: string;
	showButton?: boolean;
	compact?: boolean;
}

export function SyncProgress({
	className,
	showButton = true,
	compact = false,
}: SyncProgressProps) {
	const { syncStatus, syncWallet, isInitialized, walletEvents } =
		useWalletToolbox();

	// Derive monitor stats from walletEvents
	const { lastProvenHeight, hasRecentTasks } = useMemo(() => {
		let lastHeight = 0;
		let latestTaskTimestamp = 0;
		for (const e of walletEvents) {
			if (e.type === "proven" && e.blockHeight > lastHeight) {
				lastHeight = e.blockHeight;
			}
			if (e.type === "task:run" && e.timestamp > latestTaskTimestamp) {
				latestTaskTimestamp = e.timestamp;
			}
		}
		// Consider tasks "recent" if one ran within the last 30 seconds
		const recent = latestTaskTimestamp > Date.now() - 30_000;
		return { lastProvenHeight: lastHeight || null, hasRecentTasks: recent };
	}, [walletEvents]);

	const monitorActive = syncStatus.isSyncing || hasRecentTasks;

	if (compact) {
		return (
			<div className={cn("flex items-center gap-2", className)}>
				{/* Pulsing dot when monitor tasks are running */}
				{monitorActive && (
					<span className="relative flex size-2">
						<span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
						<span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
					</span>
				)}

				{syncStatus.isSyncing ? (
					<>
						<RefreshCw className="size-4 animate-spin text-muted-foreground" />
						<span className="text-xs text-muted-foreground">Syncing...</span>
					</>
				) : syncStatus.lastSync ? (
					<span className="text-xs text-muted-foreground">
						Last sync: {syncStatus.lastSync.toLocaleTimeString()}
					</span>
				) : (
					showButton && (
						<Button
							variant="ghost"
							size="sm"
							onClick={syncWallet}
							disabled={!isInitialized}
							className="h-6 px-2 text-xs"
						>
							<RefreshCw className="size-3 mr-1" />
							Sync
						</Button>
					)
				)}

				{/* Last proven block height */}
				{lastProvenHeight && (
					<span className="font-mono text-[10px] text-muted-foreground">
						blk {lastProvenHeight.toLocaleString()}
					</span>
				)}
			</div>
		);
	}

	return (
		<div className={cn("space-y-2", className)}>
			{syncStatus.isSyncing ? (
				<div className="flex items-center gap-2">
					<RefreshCw className="size-4 animate-spin" />
					<span className="text-sm font-medium">Refreshing wallet...</span>
				</div>
			) : (
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						{syncStatus.error ? (
							<>
								<span className="size-2 rounded-full bg-destructive" />
								<span className="text-sm text-destructive">Sync failed</span>
							</>
						) : syncStatus.lastSync ? (
							<>
								{monitorActive ? (
									<span className="relative flex size-2">
										<span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
										<span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
									</span>
								) : (
									<span className="size-2 rounded-full bg-green-500" />
								)}
								<span className="text-sm text-muted-foreground">
									Synced at {syncStatus.lastSync.toLocaleTimeString()}
								</span>
							</>
						) : (
							<>
								<span className="size-2 rounded-full bg-yellow-500" />
								<span className="text-sm text-muted-foreground">
									Not synced yet
								</span>
							</>
						)}

						{/* Last proven block height indicator */}
						{lastProvenHeight && (
							<span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
								blk {lastProvenHeight.toLocaleString()}
							</span>
						)}
					</div>
					{showButton && (
						<Button
							variant="outline"
							size="sm"
							onClick={syncWallet}
							disabled={!isInitialized || syncStatus.isSyncing}
						>
							<RefreshCw className="size-4 mr-2" />
							Sync Now
						</Button>
					)}
				</div>
			)}
			{syncStatus.error && (
				<p className="text-xs text-destructive">{syncStatus.error}</p>
			)}
		</div>
	);
}
