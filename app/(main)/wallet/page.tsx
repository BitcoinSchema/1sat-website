"use client";

import { createContext, sweepBsv } from "@1sat/actions";
import { PrivateKey } from "@bsv/sdk";
import { useQuery } from "@tanstack/react-query";
import { Wallet as WalletIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncActivityTerminal } from "@/components/wallet/sync-activity-terminal";
import { SyncProgress } from "@/components/wallet/sync-progress";
import { TransactionTimeline } from "@/components/wallet/transaction-timeline";
import { WalletTabs } from "@/components/wallet/wallet-tabs";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

export default function WalletPage() {
	const {
		walletKeys,
		hasWallet,
		isWalletLocked,
		isWalletInitialized: isWalletProviderInitialized,
	} = useWallet();
	const {
		balance,
		syncWallet,
		wallet,
		services,
		isInitialized,
		initError,
		ordinals,
		bsv20Tokens,
		bsv21Tokens,
		legacyBalance,
		legacyFundingUtxos,
		chain,
		refreshBalance,
	} = useWalletToolbox();

	// Sync wallet on mount
	useEffect(() => {
		if (!hasWallet || isWalletLocked || !isInitialized || !wallet) return;
		syncWallet();
	}, [hasWallet, isWalletLocked, isInitialized, wallet, syncWallet]);

	// Format satoshis to BSV
	const formatBSV = (satoshis: number) => {
		return (satoshis / 100000000).toFixed(8);
	};

	const [isSweeping, setIsSweeping] = useState(false);
	const [sweepError, setSweepError] = useState<string | null>(null);

	const handleSweepBsv = useCallback(async () => {
		if (
			!wallet ||
			!services ||
			!walletKeys?.payPk ||
			legacyFundingUtxos.length === 0
		)
			return;
		setIsSweeping(true);
		setSweepError(null);
		try {
			const ctx = createContext(wallet, { services, chain });
			const payKey = PrivateKey.fromWif(walletKeys.payPk);
			const result = await sweepBsv.execute(ctx, {
				inputs: legacyFundingUtxos,
				keys: legacyFundingUtxos.map(() => payKey),
			});
			if (result.error) {
				setSweepError(result.error);
			} else {
				refreshBalance();
			}
		} catch (error) {
			setSweepError(error instanceof Error ? error.message : String(error));
		} finally {
			setIsSweeping(false);
		}
	}, [
		wallet,
		services,
		walletKeys?.payPk,
		legacyFundingUtxos,
		chain,
		refreshBalance,
	]);

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
		enabled: hasWallet && !isWalletLocked && isInitialized && !!wallet,
		staleTime: 30_000,
	});

	const actions = actionsQuery.data ?? [];
	const outgoingCount = actions.filter((a) => a.isOutgoing).length;

	if (!isWalletProviderInitialized) {
		return (
			<Page>
				<PageHeader>
					<PageTitle>Wallet</PageTitle>
				</PageHeader>
				<PageContent>
					<div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
						Loading wallet...
					</div>
				</PageContent>
			</Page>
		);
	}

	if (!hasWallet) {
		return (
			<Page>
				<PageHeader>
					<PageTitle>Wallet</PageTitle>
				</PageHeader>
				<PageContent>
					<Card className="max-w-xl">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<WalletIcon className="h-5 w-5" />
								No Wallet Connected
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<p className="text-sm text-muted-foreground">
								Create or import a wallet to view balances, activity, and
								connected assets.
							</p>
							<div className="flex flex-wrap gap-2">
								<Button asChild>
									<Link href="/wallet/create">Create Wallet</Link>
								</Button>
								<Button variant="outline" asChild>
									<Link href="/wallet/import">Import Wallet</Link>
								</Button>
							</div>
						</CardContent>
					</Card>
				</PageContent>
			</Page>
		);
	}

	return (
		<Page>
			<PageHeader>
				<PageTitle>Wallet</PageTitle>
				<SyncProgress compact className="ml-auto" />
			</PageHeader>

			<PageContent>
				{initError && (
					<div className="mb-6 rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm">
						<p className="font-medium text-destructive">
							Wallet initialization failed
						</p>
						<p className="mt-1 text-muted-foreground break-all">{initError}</p>
						<p className="mt-2 text-xs text-muted-foreground">
							Lock and unlock the wallet to retry.
						</p>
					</div>
				)}
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
						{legacyBalance > 0 && (
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Legacy Balance
									</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">
										{formatBSV(legacyBalance)} BSV
									</div>
									<p className="text-xs text-muted-foreground mb-2">
										{legacyFundingUtxos.length} UTXO
										{legacyFundingUtxos.length !== 1 ? "s" : ""} on old
										addresses
									</p>
									<Button
										size="sm"
										onClick={handleSweepBsv}
										disabled={isSweeping || !walletKeys?.payPk}
									>
										{isSweeping ? "Sweeping..." : "Sweep to Wallet"}
									</Button>
									{sweepError && (
										<p className="text-xs text-destructive mt-1">
											{sweepError}
										</p>
									)}
								</CardContent>
							</Card>
						)}
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
								<CardTitle className="text-sm font-medium">Outgoing</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{outgoingCount}</div>
								<p className="text-xs text-muted-foreground">
									Outgoing actions
								</p>
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
