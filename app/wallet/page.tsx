"use client";

import { RefreshCw } from "lucide-react";
import { useEffect } from "react";
import {
	Page,
	PageContent,
	PageHeader,
	PageTitle,
} from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletTabs } from "@/components/wallet/wallet-tabs";
import { useWallet } from "@/providers/wallet-provider";

export default function WalletPage() {
	const { balance, transactions, utxos, syncWallet } = useWallet();

	// Sync wallet on mount
	useEffect(() => {
		syncWallet();
	}, [syncWallet]);

	// Format satoshis to BSV
	const formatBSV = (satoshis: number) => {
		return (satoshis / 100000000).toFixed(8);
	};

	// Calculate stats
	const totalUTXOs = utxos.length;
	const recentTxCount = transactions.filter((tx) => {
		const txDate = new Date(tx.timestamp);
		const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
		return txDate > dayAgo;
	}).length;

	return (
		<Page>
			<PageHeader>
				<PageTitle>Wallet</PageTitle>
				<Button
					variant="outline"
					size="sm"
					onClick={syncWallet}
					className="ml-auto"
				>
					<RefreshCw className="h-4 w-4 mr-2" />
					Sync
				</Button>
			</PageHeader>

			<PageContent>
				<WalletTabs />
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
								<CardTitle className="text-sm font-medium">UTXOs</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{totalUTXOs}</div>
								<p className="text-xs text-muted-foreground">Unspent outputs</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									Transactions
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{transactions.length}</div>
								<p className="text-xs text-muted-foreground">
									Total transactions
								</p>
							</CardContent>
						</Card>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">
									24h Activity
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">{recentTxCount}</div>
								<p className="text-xs text-muted-foreground">
									Recent transactions
								</p>
							</CardContent>
						</Card>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<Card className="min-h-[300px]">
							<CardHeader>
								<CardTitle>Recent Transactions</CardTitle>
							</CardHeader>
							<CardContent>
								{transactions.length > 0 ? (
									<div className="space-y-2">
										{transactions.slice(0, 5).map((tx) => (
											<div
												key={tx.txid}
												className="flex justify-between items-center text-sm"
											>
												<div className="flex flex-col">
													<span className="font-mono text-xs">
														{tx.txid.substring(0, 8)}...
													</span>
													<span className="text-xs text-muted-foreground">
														{new Date(tx.timestamp).toLocaleString()}
													</span>
												</div>
												<div className="text-right">
													<div>{formatBSV(tx.satoshis)} BSV</div>
													<div className="text-xs text-muted-foreground">
														{tx.status}
													</div>
												</div>
											</div>
										))}
									</div>
								) : (
									<div className="text-sm text-muted-foreground">
										No transactions yet
									</div>
								)}
							</CardContent>
						</Card>
						<Card className="min-h-[300px]">
							<CardHeader>
								<CardTitle>UTXO Distribution</CardTitle>
							</CardHeader>
							<CardContent>
								{utxos.length > 0 ? (
									<div className="space-y-2">
										<div className="text-sm">
											<div className="flex justify-between mb-1">
												<span>Total UTXOs:</span>
												<span className="font-mono">{utxos.length}</span>
											</div>
											<div className="flex justify-between mb-1">
												<span>Largest UTXO:</span>
												<span className="font-mono">
													{utxos.length > 0
														? formatBSV(
																Math.max(...utxos.map((u) => u.satoshis)),
															)
														: "0"}{" "}
													BSV
												</span>
											</div>
											<div className="flex justify-between mb-1">
												<span>Smallest UTXO:</span>
												<span className="font-mono">
													{utxos.length > 0
														? formatBSV(
																Math.min(...utxos.map((u) => u.satoshis)),
															)
														: "0"}{" "}
													BSV
												</span>
											</div>
											<div className="flex justify-between">
												<span>Average UTXO:</span>
												<span className="font-mono">
													{utxos.length > 0
														? formatBSV(
																utxos.reduce((sum, u) => sum + u.satoshis, 0) /
																	utxos.length,
															)
														: "0"}{" "}
													BSV
												</span>
											</div>
										</div>
									</div>
								) : (
									<div className="text-sm text-muted-foreground">
										No UTXOs available
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</PageContent>
		</Page>
	);
}
