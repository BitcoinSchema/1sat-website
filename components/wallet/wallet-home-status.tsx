"use client";

import {
	CircleDollarSign,
	Copy,
	Gem,
	History,
	Inbox,
	LockKeyhole,
	RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCopyWithSound } from "@/hooks/use-copy-with-sound";
import type { SyncTaskState } from "@/providers/hooks/use-sync-engine";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

function describeSyncTask(task: SyncTaskState) {
	if (task.status === "provider-managed") return "Managed by connected wallet";
	if (task.status === "running") return "Checking now";
	if (task.status === "failed") return task.error ?? "Needs retry";
	if (task.lastRunAt === null) return "Waiting for first check";
	const time = new Date(task.lastRunAt).toISOString().slice(11, 19);
	return `Processed ${task.processed ?? "unknown"}, failed ${task.failed ?? "unknown"} · ${time} UTC`;
}

export function WalletHomeStatus() {
	const {
		balanceError,
		bsv21Tokens,
		connectionMode,
		hasActiveSync,
		identityKey,
		isBalanceLoading,
		ordinals,
		syncStatus,
		syncTasks,
		syncWallet,
	} = useWalletToolbox();
	const [, copy] = useCopyWithSound();
	const shortenedIdentity = identityKey
		? `${identityKey.slice(0, 14)}…${identityKey.slice(-10)}`
		: "Unavailable";

	return (
		<>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
				<Card>
					<CardHeader>
						<Gem className="size-5 text-primary" />
						<CardTitle>Ordinals</CardTitle>
						<CardDescription>Indexed inscriptions</CardDescription>
					</CardHeader>
					<CardContent>
						{isBalanceLoading ? (
							<Skeleton className="h-8 w-16" />
						) : balanceError ? (
							<span className="text-muted-foreground text-sm">Unavailable</span>
						) : (
							<p className="font-mono text-2xl font-semibold">
								{ordinals.length}
							</p>
						)}
						<Button asChild className="mt-4 px-0" size="sm" variant="link">
							<Link href="/wallet/ordinals">View ordinals</Link>
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CircleDollarSign className="size-5 text-primary" />
						<CardTitle>BSV21</CardTitle>
						<CardDescription>Distinct token balances</CardDescription>
					</CardHeader>
					<CardContent>
						{isBalanceLoading ? (
							<Skeleton className="h-8 w-16" />
						) : balanceError ? (
							<span className="text-muted-foreground text-sm">Unavailable</span>
						) : (
							<p className="font-mono text-2xl font-semibold">
								{bsv21Tokens.length}
							</p>
						)}
						<Button asChild className="mt-4 px-0" size="sm" variant="link">
							<Link href="/wallet/bsv21">View tokens</Link>
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<RefreshCw
							className={`size-5 text-primary ${syncTasks.addresses.status === "running" ? "animate-spin" : ""}`}
						/>
						<CardTitle>Address sync</CardTitle>
						<CardDescription>
							{describeSyncTask(syncTasks.addresses)}
						</CardDescription>
					</CardHeader>
					<CardContent>
						{connectionMode === "built-in" ? (
							<Button
								disabled={hasActiveSync}
								onClick={syncWallet}
								size="sm"
								variant="outline"
							>
								<RefreshCw className={hasActiveSync ? "animate-spin" : ""} />
								{syncStatus.error ? "Retry sync" : "Sync now"}
							</Button>
						) : (
							<Badge variant="secondary">Provider managed</Badge>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<Inbox className="size-5 text-primary" />
						<CardTitle>Payment inbox</CardTitle>
						<CardDescription>
							{describeSyncTask(syncTasks.payments)}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Badge
							variant={
								syncTasks.payments.status === "failed"
									? "destructive"
									: "secondary"
							}
						>
							{syncTasks.payments.status === "failed"
								? "Retry available"
								: syncTasks.payments.status}
						</Badge>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<Inbox className="size-5 text-primary" />
						<CardTitle>Token inbox</CardTitle>
						<CardDescription>
							{describeSyncTask(syncTasks.cosignDeliveries)}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Badge
							variant={
								syncTasks.cosignDeliveries.status === "failed"
									? "destructive"
									: "secondary"
							}
						>
							{syncTasks.cosignDeliveries.status === "failed"
								? "Retry available"
								: syncTasks.cosignDeliveries.status}
						</Badge>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
				<Card>
					<CardHeader>
						<LockKeyhole className="size-5 text-primary" />
						<CardTitle>Authenticated identity</CardTitle>
						<CardDescription>
							BRC-100 identity currently authorizing this wallet session.
						</CardDescription>
					</CardHeader>
					<CardContent className="flex min-w-0 items-center gap-2">
						<code className="min-w-0 flex-1 break-all rounded-md bg-muted p-3 text-xs">
							{shortenedIdentity}
						</code>
						<Button
							aria-label="Copy authenticated identity key"
							disabled={!identityKey}
							onClick={() => identityKey && void copy(identityKey)}
							size="icon"
							variant="outline"
						>
							<Copy />
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<History className="size-5 text-primary" />
						<CardTitle>Activity</CardTitle>
						<CardDescription>
							Review wallet actions and transaction status.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button asChild variant="outline">
							<Link href="/wallet/history">Open history</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		</>
	);
}
