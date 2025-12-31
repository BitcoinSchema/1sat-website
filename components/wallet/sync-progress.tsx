"use client";

/**
 * Sync Progress Component
 *
 * Shows real-time sync progress from wallet-toolbox events.
 */

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";
import { cn } from "@/lib/utils";

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
	const { syncStatus, syncWallet, isInitialized } = useWalletToolbox();

	const progressPercent = syncStatus.progress
		? Math.round(
				(syncStatus.progress.done /
					(syncStatus.progress.done + syncStatus.progress.pending)) *
					100,
			) || 0
		: 0;

	if (compact) {
		return (
			<div className={cn("flex items-center gap-2", className)}>
				{syncStatus.isSyncing ? (
					<>
						<RefreshCw className="size-4 animate-spin text-muted-foreground" />
						<span className="text-xs text-muted-foreground">
							Syncing... {progressPercent}%
						</span>
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
			</div>
		);
	}

	return (
		<div className={cn("space-y-2", className)}>
			{syncStatus.isSyncing ? (
				<>
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<RefreshCw className="size-4 animate-spin" />
							<span className="text-sm font-medium">Syncing wallet...</span>
						</div>
						<span className="text-sm text-muted-foreground">
							{progressPercent}%
						</span>
					</div>
					<Progress value={progressPercent} className="h-2" />
					{syncStatus.progress && (
						<p className="text-xs text-muted-foreground">
							{syncStatus.progress.done} done, {syncStatus.progress.pending}{" "}
							pending
							{syncStatus.progress.failed > 0 &&
								`, ${syncStatus.progress.failed} failed`}
						</p>
					)}
				</>
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
								<span className="size-2 rounded-full bg-green-500" />
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
