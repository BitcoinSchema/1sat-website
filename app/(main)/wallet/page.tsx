"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncActivityTerminal } from "@/components/wallet/sync-activity-terminal";
import { SyncProgress } from "@/components/wallet/sync-progress";
import { TransactionTimeline } from "@/components/wallet/transaction-timeline";
import { WalletTabs } from "@/components/wallet/wallet-tabs";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

export default function WalletPage() {
	const { walletKeys } = useWallet();
	const {
		balance,
		syncWallet,
		wallet,
		isInitialized,
		ordinals,
		bsv20Tokens,
		bsv21Tokens,
	} = useWalletToolbox();

	// Sync wallet on mount
	useEffect(() => {
		syncWallet();
	}, [syncWallet]);

	// Format satoshis to BSV
	const formatBSV = (satoshis: number) => {
		return (satoshis / 100000000).toFixed(8);
	};

	const walletScope = walletKeys?.identityPk ?? walletKeys?.payPk ?? "unknown";

	// Fetch actions (transactions) via BRC-100 wallet
	const actionsQuery = useQuery({
		queryKey: ["wallet-actions", walletScope],
		queryFn: async () => {
			if (!wallet) throw new Error("Wallet not initialized");
			const result = await wallet.listActions({
				labels: [],
				includeLabels: true,
				includeInputs: true,
				includeOutputs: true,
				limit: 100,
			});
			return result.actions;
		},
		enabled: isInitialized && !!wallet,
		staleTime: 30_000,
	});

	const actions = actionsQuery.data ?? [];
	const outgoingCount = actions.filter((a) => a.isOutgoing).length;

	return (
		<Page>
			<PageHeader>
				<PageTitle>Wallet</PageTitle>
				<SyncProgress compact className="ml-auto" />
			</PageHeader>

			<PageContent>
				<SyncActivityTerminal className="mb-6" />
				<WalletTabs />
				<TransactionTimeline className="mt-6" days={30} />
				<div className="space-y-6 mt-6">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Total Balance
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">
									{balance ? formatBSV(balance.total) : "0.00000000"} BSV
								</div>
								{balance && balance.unconfirmed > 0 && (
									<p className="text-xs text-muted-foreground">
										{formatBSV(balance.unconfirmed)} unconfirmed
									</p>
								)}
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Ordinals</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{ordinals.length}</div>
								<p className="text-xs text-muted-foreground">
									Indexed inscriptions
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Actions</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{actions.length}</div>
								<p className="text-xs text-muted-foreground">Total actions</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Outgoing
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{outgoingCount}</div>
								<p className="text-xs text-muted-foreground">Outgoing actions</p>
							</CardContent>
						</Card>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<Card className="min-h-[300px]">
							<CardHeader>
								<CardTitle>Recent Actions</CardTitle>
							</CardHeader>
							<CardContent>
								{actions.length > 0 ? (
									<div className="space-y-2">
										{actions.slice(0, 5).map((action) => (
											<div
												key={action.txid}
												className="flex justify-between items-center text-sm"
											>
												<div className="flex flex-col">
													<span className="font-mono text-xs">
														{action.txid.substring(0, 8)}...
													</span>
													<span className="text-xs text-muted-foreground">
														{action.description}
													</span>
												</div>
												<div className="text-right">
													<div>{formatBSV(action.satoshis)} BSV</div>
													<div className="text-xs text-muted-foreground">
														{action.status}
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="text-sm text-muted-foreground">
										No actions yet
									</div>
								)}
							</CardContent>
						</Card>
						<Card className="min-h-[300px]">
							<CardHeader>
								<CardTitle>Asset Summary</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span>Ordinals</span>
										<span className="font-mono">{ordinals.length}</span>
									</div>
									<div className="flex justify-between">
										<span>BSV20 Tokens</span>
										<span className="font-mono">{bsv20Tokens.length}</span>
									</div>
									<div className="flex justify-between">
										<span>BSV21 Tokens</span>
										<span className="font-mono">{bsv21Tokens.length}</span>
									</div>
									<div className="flex justify-between">
										<span>Spendable Balance</span>
										<span className="font-mono">
											{formatBSV(balance?.total ?? 0)} BSV
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</PageContent>
		</Page>
	);
}
