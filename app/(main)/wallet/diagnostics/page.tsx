"use client";

import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
import {
	createCorrelationId,
	reportDiagnostic,
	sanitizeDiagnosticContext,
} from "@/lib/runtime-diagnostics";
import { useWalletDiagnostics } from "@/providers/hooks/use-wallet-diagnostics";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

function StatusRow({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between gap-4 border-b border-border/50 py-2 last:border-0">
			<span className="text-sm text-muted-foreground">{label}</span>
			<code className="max-w-[60%] truncate rounded bg-muted px-2 py-1 text-xs">
				{value}
			</code>
		</div>
	);
}

export default function WalletDiagnosticsPage() {
	const wallet = useWallet();
	const toolbox = useWalletToolbox();
	const { syncEvents, clearSyncEvents } = useWalletDiagnostics();
	const [pendingAction, setPendingAction] = useState<string | null>(null);
	const reportedSyncFailures = useRef(new Set<string>());

	const providerName = String(
		sanitizeDiagnosticContext({ provider: toolbox.providerType }).provider ??
			"none",
	);
	const failedSyncTasks = useMemo(
		() =>
			Object.entries(toolbox.syncTasks).filter(
				([, task]) => task.status === "failed",
			),
		[toolbox.syncTasks],
	);

	useEffect(() => {
		for (const [name, task] of failedSyncTasks) {
			const failureKey = `${name}:${task.lastRunAt ?? "current"}`;
			if (reportedSyncFailures.current.has(failureKey)) continue;
			reportedSyncFailures.current.add(failureKey);
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation: `wallet.sync.${name}`,
				recoverable: true,
				context: { status: task.status, retryable: true },
			});
		}
	}, [failedSyncTasks]);

	const runAction = async (
		operation: string,
		action: () => boolean | Promise<boolean> | undefined,
	) => {
		const correlationId = createCorrelationId();
		reportDiagnostic({
			category: "action",
			code: "action.requested",
			operation,
			correlationId,
			recoverable: true,
		});
		setPendingAction(operation);
		try {
			const result = await action();
			if (result === false) {
				reportDiagnostic({
					category: "action",
					code: "action.failed",
					operation,
					correlationId,
					recoverable: true,
					context: { retryable: true },
				});
			}
		} catch {
			reportDiagnostic({
				category: "action",
				code: "action.failed",
				operation,
				correlationId,
				recoverable: true,
				context: { retryable: true },
			});
		} finally {
			setPendingAction(null);
		}
	};

	return (
		<Page>
			<PageHeader className="justify-start gap-2">
				<Button variant="ghost" size="icon" asChild className="-ml-2">
					<Link href="/wallet/settings">
						<span className="sr-only">Back to wallet settings</span>
						<ArrowLeft className="size-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<PageTitle>Wallet Diagnostics</PageTitle>
					<p className="text-muted-foreground">
						Redacted provider, action, and route health
					</p>
				</div>
				<Badge variant={toolbox.isInitialized ? "default" : "secondary"}>
					{toolbox.connectionStatus}
				</Badge>
			</PageHeader>

			<PageContent className="space-y-6">
				{(toolbox.initError || failedSyncTasks.length > 0) && (
					<div
						role="alert"
						className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm"
					>
						A wallet operation failed. Retry below or return to the wallet. No
						secret error details are displayed or retained.
					</div>
				)}

				<div className="grid gap-6 md:grid-cols-2">
					<Card>
						<CardHeader>
							<CardTitle>Wallet state</CardTitle>
							<CardDescription>Non-secret runtime state only</CardDescription>
						</CardHeader>
						<CardContent>
							<StatusRow
								label="Installed"
								value={wallet.hasWallet ? "yes" : "no"}
							/>
							<StatusRow
								label="Locked"
								value={wallet.isWalletLocked ? "yes" : "no"}
							/>
							<StatusRow label="Connection" value={toolbox.connectionStatus} />
							<StatusRow label="Mode" value={toolbox.connectionMode} />
							<StatusRow label="Provider" value={providerName} />
							<StatusRow label="Chain" value={toolbox.chain} />
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>Sync state</CardTitle>
							<CardDescription>
								Counts and status, without payloads
							</CardDescription>
						</CardHeader>
						<CardContent>
							{Object.entries(toolbox.syncTasks).map(([name, task]) => (
								<StatusRow
									key={name}
									label={name}
									value={`${task.status} · ${task.processed ?? 0} processed · ${task.failed ?? 0} failed`}
								/>
							))}
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Recovery</CardTitle>
						<CardDescription>Retry safe, idempotent checks</CardDescription>
					</CardHeader>
					<CardContent className="flex flex-wrap gap-3">
						<Button
							onClick={() =>
								runAction("wallet.sync", () => {
									toolbox.syncWallet();
									return undefined;
								})
							}
							disabled={!toolbox.isInitialized || pendingAction !== null}
						>
							<RefreshCw className="mr-2 size-4" />
							Retry sync
						</Button>
						<Button
							variant="outline"
							onClick={() =>
								runAction("wallet.refresh-balance", () => {
									toolbox.refreshBalance();
									return undefined;
								})
							}
							disabled={!toolbox.isInitialized || pendingAction !== null}
						>
							Refresh balance
						</Button>
						{toolbox.connectionMode !== "built-in" && (
							<Button
								variant="outline"
								onClick={() =>
									runAction("wallet.connect", toolbox.connectExternalWallet)
								}
								disabled={toolbox.isInitializing || pendingAction !== null}
							>
								Retry connection
							</Button>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex-row items-center justify-between">
						<div>
							<CardTitle>Runtime events</CardTitle>
							<CardDescription>
								In-memory, fixed-message events with correlation IDs
							</CardDescription>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={clearSyncEvents}
							disabled={syncEvents.length === 0}
						>
							<Trash2 className="mr-2 size-4" />
							Clear
						</Button>
					</CardHeader>
					<CardContent>
						{syncEvents.length === 0 ? (
							<p className="text-sm text-muted-foreground">
								No runtime events yet.
							</p>
						) : (
							<div className="space-y-2">
								{syncEvents.toReversed().map((event) => (
									<div key={event.id} className="rounded border p-3 text-xs">
										<div className="flex flex-wrap items-center gap-2">
											<Badge
												variant={
													event.level === "error" ? "destructive" : "secondary"
												}
											>
												{event.category}
											</Badge>
											<code>{event.code}</code>
											<span>{event.message}</span>
										</div>
										<code className="mt-2 block break-all text-muted-foreground">
											{event.operation} · {event.correlationId}
										</code>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</PageContent>
		</Page>
	);
}
