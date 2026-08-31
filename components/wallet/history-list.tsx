"use client";

import { ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toBitcoin } from "satoshi-token";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	ACTION_HISTORY_PAGE_SIZE,
	type ActionHistoryState,
	actionExplorerUrl,
	actionHistoryForIdentity,
	actionReferenceLabel,
	listActionHistoryPage,
	ordinaryActionLabels,
} from "@/lib/wallet/action-history";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

const HistoryList = () => {
	const { chain, identityKey, isInitialized, wallet } = useWalletToolbox();
	const [history, setHistory] = useState<ActionHistoryState>({
		identityKey: null,
		actions: null,
		totalActions: 0,
		error: null,
	});
	const [pagination, setPagination] = useState({ identityKey, page: 0 });
	const [refreshRevision, setRefreshRevision] = useState(0);
	const requestSequence = useRef(0);
	const requestId = useRef("");
	const page = pagination.identityKey === identityKey ? pagination.page : 0;
	const currentHistory = actionHistoryForIdentity(history, identityKey);
	const { actions, error, totalActions } = currentHistory;

	useEffect(() => {
		const currentRequest = `${identityKey}:${page}:${refreshRevision}:${++requestSequence.current}`;
		requestId.current = currentRequest;

		if (!wallet || !isInitialized) {
			setHistory({ identityKey, actions: null, totalActions: 0, error: null });
			return;
		}

		setHistory({ identityKey, actions: null, totalActions: 0, error: null });
		void listActionHistoryPage(wallet, page * ACTION_HISTORY_PAGE_SIZE).then(
			(result) => {
				if (requestId.current !== currentRequest) return;
				setHistory({
					identityKey,
					actions: result.actions,
					totalActions: result.totalActions,
					error: null,
				});
			},
			(reason: unknown) => {
				if (requestId.current !== currentRequest) return;
				setHistory({
					identityKey,
					actions: [],
					totalActions: 0,
					error: reason instanceof Error ? reason.message : String(reason),
				});
			},
		);

		return () => {
			requestId.current = "cancelled";
		};
	}, [identityKey, isInitialized, page, refreshRevision, wallet]);

	if (!wallet) {
		return (
			<div className="text-sm text-muted-foreground">
				Unlock your wallet to view transaction history.
			</div>
		);
	}

	if (error) {
		return (
			<div
				role="alert"
				className="flex flex-wrap items-center gap-3 text-sm text-destructive"
			>
				<span className="break-all">{error}</span>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setRefreshRevision((revision) => revision + 1)}
				>
					<RefreshCw /> Retry
				</Button>
			</div>
		);
	}

	if (!isInitialized || actions === null) {
		return (
			<div
				role="status"
				className="flex items-center gap-2 text-sm text-muted-foreground"
			>
				<Loader2 className="w-4 h-4 animate-spin" /> Loading history...
			</div>
		);
	}

	if (actions.length === 0) {
		return (
			<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
				<span>
					{page === 0
						? "No transactions found for this wallet."
						: "No transactions found on this page."}
				</span>
				{page > 0 && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setPagination({ identityKey, page: page - 1 })}
					>
						Previous
					</Button>
				)}
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setRefreshRevision((revision) => revision + 1)}
				>
					<RefreshCw /> Refresh
				</Button>
			</div>
		);
	}

	const firstAction = page * ACTION_HISTORY_PAGE_SIZE + 1;
	const lastAction = Math.min(firstAction + actions.length - 1, totalActions);

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => setRefreshRevision((revision) => revision + 1)}
				>
					<RefreshCw /> Refresh
				</Button>
			</div>
			<ul className="flex flex-col divide-y divide-border/60">
				{actions.map((action) => {
					const explorerUrl = actionExplorerUrl(action.txid, chain);
					const referenceLabel = actionReferenceLabel(action);
					return (
						<li
							key={action.txid}
							className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
						>
							<div className="min-w-0 flex-1">
								<div className="text-sm">{action.description}</div>
								{explorerUrl ? (
									<a
										href={explorerUrl}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-1 break-all font-mono text-[11px] text-muted-foreground hover:text-primary"
									>
										{action.txid} <ExternalLink className="size-3" />
									</a>
								) : (
									<div className="break-all font-mono text-[11px] text-muted-foreground">
										{action.txid}
									</div>
								)}
								{referenceLabel && (
									<div className="break-all font-mono text-[11px] text-muted-foreground">
										{referenceLabel}
									</div>
								)}
							</div>
							<div className="flex max-w-full flex-wrap items-center justify-end gap-2">
								{ordinaryActionLabels(action).map((label) => (
									<Badge key={label} variant="outline" className="text-[10px]">
										{label}
									</Badge>
								))}
								<Badge variant="outline" className="text-[10px]">
									{action.isOutgoing ? "Outgoing" : "Incoming"}
								</Badge>
								<Badge variant="secondary" className="text-[10px]">
									{action.status}
								</Badge>
								<span
									className={`font-mono text-sm ${action.isOutgoing ? "text-muted-foreground" : "text-primary"}`}
								>
									{action.isOutgoing ? "−" : "+"}
									{toBitcoin(action.satoshis)} BSV
								</span>
							</div>
						</li>
					);
				})}
			</ul>
			<div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
				<span>
					Showing {firstAction}–{lastAction} of {totalActions}
				</span>
				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={page === 0}
						onClick={() =>
							setPagination({ identityKey, page: Math.max(0, page - 1) })
						}
					>
						Previous
					</Button>
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={lastAction >= totalActions}
						onClick={() => setPagination({ identityKey, page: page + 1 })}
					>
						Next
					</Button>
				</div>
			</div>
		</div>
	);
};

export default HistoryList;
