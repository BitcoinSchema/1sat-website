"use client";

import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toBitcoin } from "satoshi-token";
import { Badge } from "@/components/ui/badge";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

interface HistoryAction {
	txid?: string;
	description?: string;
	satoshis?: number;
	status?: string;
	labels?: string[];
}

const WOC_TX_URL = "https://whatsonchain.com/tx";

const HistoryList = () => {
	const { wallet } = useWalletToolbox();
	const [actions, setActions] = useState<HistoryAction[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		if (!wallet) return;
		try {
			const result = await wallet.listActions({
				labels: [],
				labelQueryMode: "any",
				includeLabels: true,
				limit: 100,
			});
			setActions((result.actions as HistoryAction[]) ?? []);
		} catch (e) {
			setError(e instanceof Error ? e.message : String(e));
		}
	}, [wallet]);

	useEffect(() => {
		load();
	}, [load]);

	if (!wallet) {
		return (
			<div className="text-sm text-muted-foreground">
				Unlock your wallet to view transaction history.
			</div>
		);
	}

	if (error) {
		return <div className="text-sm text-destructive break-all">{error}</div>;
	}

	if (actions === null) {
		return (
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Loader2 className="w-4 h-4 animate-spin" /> Loading history...
			</div>
		);
	}

	if (actions.length === 0) {
		return (
			<div className="text-sm text-muted-foreground">
				No recent transactions found for this wallet.
			</div>
		);
	}

	return (
		<ul className="flex flex-col divide-y divide-border/60">
			{actions.map((a, i) => (
				<li
					key={a.txid ?? i}
					className="py-3 flex flex-wrap items-center gap-x-4 gap-y-1"
				>
					<div className="flex-1 min-w-0">
						<div className="text-sm truncate">
							{a.description || "Transaction"}
						</div>
						{a.txid && (
							<a
								href={`${WOC_TX_URL}/${a.txid}`}
								target="_blank"
								rel="noreferrer"
								className="text-[11px] font-mono text-muted-foreground hover:text-primary break-all"
							>
								{a.txid}
							</a>
						)}
					</div>
					<div className="flex items-center gap-2 shrink-0">
						{a.labels
							?.filter((l) => l !== "p 1sat action")
							.slice(0, 3)
							.map((l) => (
								<Badge key={l} variant="outline" className="text-[10px]">
									{l}
								</Badge>
							))}
						{a.status && a.status !== "completed" && (
							<Badge variant="secondary" className="text-[10px]">
								{a.status}
							</Badge>
						)}
						{typeof a.satoshis === "number" && (
							<span
								className={`text-sm font-mono ${a.satoshis >= 0 ? "text-primary" : "text-muted-foreground"}`}
							>
								{a.satoshis >= 0 ? "+" : ""}
								{toBitcoin(a.satoshis)} BSV
							</span>
						)}
					</div>
				</li>
			))}
		</ul>
	);
};

export default HistoryList;
