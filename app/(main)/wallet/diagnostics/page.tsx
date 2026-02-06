"use client";

/**
 * Wallet Diagnostic Page
 *
 * This page provides detailed diagnostics for wallet-toolbox integration testing.
 * It shows wallet state, connection status, balance, and allows testing operations.
 */

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
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
import { Separator } from "@/components/ui/separator";
import { useSound } from "@/hooks/use-sound";
import { wifToAddress, wifToRootKeyHex } from "@/lib/keys";
import { GorillaPoolService } from "@/lib/wallet/gorillapool-service";
import { detectMigrationStatus } from "@/lib/wallet-migration";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

interface DiagnosticItem {
	label: string;
	value: string | number | boolean | null | undefined;
	status?: "success" | "warning" | "error" | "info";
}

function DiagnosticRow({ item }: { item: DiagnosticItem }) {
	const statusColors = {
		success: "bg-green-500",
		warning: "bg-yellow-500",
		error: "bg-red-500",
		info: "bg-blue-500",
	};

	return (
		<div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
			<span className="text-sm text-muted-foreground">{item.label}</span>
			<div className="flex items-center gap-2">
				<code className="text-sm font-mono bg-muted px-2 py-1 rounded max-w-[300px] truncate">
					{item.value === null
						? "null"
						: item.value === undefined
							? "undefined"
							: String(item.value)}
				</code>
				{item.status && (
					<span
						className={`w-2 h-2 rounded-full ${statusColors[item.status]}`}
					/>
				)}
			</div>
		</div>
	);
}

export default function WalletDiagnosticPage() {
	const { play } = useSound();
	const wallet = useWallet();
	const toolbox = useWalletToolbox();

	const [testResults, setTestResults] = useState<string[]>([]);
	const [isTestingToolbox, setIsTestingToolbox] = useState(false);

	// Derived values
	const payAddress = wallet.walletKeys?.payPk
		? wifToAddress(wallet.walletKeys.payPk)
		: null;
	const ordAddress = wallet.walletKeys?.ordPk
		? wifToAddress(wallet.walletKeys.ordPk)
		: null;
	const rootKeyHex = wallet.walletKeys?.payPk
		? wifToRootKeyHex(wallet.walletKeys.payPk)
		: null;
	const identityAddress = wallet.walletKeys?.identityPk
		? wifToAddress(wallet.walletKeys.identityPk)
		: null;
	const identityRootKeyHex = wallet.walletKeys?.identityPk
		? wifToRootKeyHex(wallet.walletKeys.identityPk)
		: null;

	// Migration status
	const migrationStatus = useMemo(() => {
		if (!wallet.walletKeys || wallet.isWalletLocked) return null;
		return detectMigrationStatus(wallet.walletKeys);
	}, [wallet.walletKeys, wallet.isWalletLocked]);

	// Quick scan state
	const [legacyUtxoCounts, setLegacyUtxoCounts] = useState<{
		pay: number | null;
		ord: number | null;
	}>({ pay: null, ord: null });
	const [isScanning, setIsScanning] = useState(false);

	const quickScan = async () => {
		if (migrationStatus?.status !== "legacy") return;
		setIsScanning(true);
		try {
			const gp = new GorillaPoolService();
			const [payUtxos, ordUtxos] = await Promise.all([
				gp.getUnspentOutputs(migrationStatus.legacyPayAddress),
				migrationStatus.legacyPayAddress !== migrationStatus.legacyOrdAddress
					? gp.getUnspentOutputs(migrationStatus.legacyOrdAddress)
					: Promise.resolve([]),
			]);
			setLegacyUtxoCounts({
				pay: payUtxos.length,
				ord:
					migrationStatus.legacyPayAddress !== migrationStatus.legacyOrdAddress
						? ordUtxos.length
						: null,
			});
		} catch {
			setLegacyUtxoCounts({ pay: null, ord: null });
		} finally {
			setIsScanning(false);
		}
	};

	// Test wallet-toolbox initialization
	const testToolboxInit = async () => {
		setIsTestingToolbox(true);
		setTestResults([]);

		const results: string[] = [];

		try {
			results.push("Starting wallet-toolbox initialization test...");

			if (!wallet.walletKeys?.payPk) {
				results.push("No wallet keys available - unlock wallet first");
				setTestResults(results);
				setIsTestingToolbox(false);
				return;
			}

			results.push(`Pay key available: ${payAddress?.slice(0, 8)}...`);
			results.push(`Ord key available: ${ordAddress?.slice(0, 8)}...`);
			results.push(`Root key hex length: ${rootKeyHex?.length} chars`);
			// TODO(wallet-v2): Use identity-derived root key for diagnostics init tests.
			// This test currently uses pay-key root for backward compatibility checks.

			// Try to initialize wallet-toolbox
			if (!toolbox.isInitialized) {
				results.push("Initializing wallet-toolbox...");
				if (!rootKeyHex || !ordAddress) {
					results.push("Missing derived wallet keys");
					setTestResults(results);
					setIsTestingToolbox(false);
					return;
				}
				const success = await toolbox.initializeWallet(rootKeyHex, ordAddress);

				if (success) {
					results.push("Wallet-toolbox initialized successfully!");
					results.push(`Identity key: ${toolbox.identityKey?.slice(0, 16)}...`);
				} else {
					results.push("Wallet-toolbox initialization failed");
				}
			} else {
				results.push("Wallet-toolbox already initialized");
				results.push(`Identity key: ${toolbox.identityKey?.slice(0, 16)}...`);
			}

			// Test balance refresh
			results.push("Refreshing balance...");
			await toolbox.refreshBalance();
			results.push(`Balance: ${toolbox.balance?.total ?? 0} sats`);
			results.push(`Ordinals: ${toolbox.ordinals.length} items`);
		} catch (error) {
			results.push(
				`Error: ${error instanceof Error ? error.message : String(error)}`,
			);
		}

		setTestResults(results);
		setIsTestingToolbox(false);
	};

	// Key Manager diagnostics (stripped legacy provider)
	const keyManagerDiagnostics: DiagnosticItem[] = [
		{
			label: "Has Wallet",
			value: wallet.hasWallet,
			status: wallet.hasWallet ? "success" : "warning",
		},
		{
			label: "Is Locked",
			value: wallet.isWalletLocked,
			status: wallet.isWalletLocked ? "warning" : "success",
		},
		{
			label: "Is Initialized",
			value: wallet.isWalletInitialized,
			status: wallet.isWalletInitialized ? "success" : "info",
		},
		{
			label: "Pay Address",
			value: payAddress,
			status: payAddress ? "success" : "warning",
		},
		{
			label: "Ord Address",
			value: ordAddress,
			status: ordAddress ? "success" : "warning",
		},
		{
			label: "Root Key Hex (from Pay)",
			value: rootKeyHex ? `${rootKeyHex.slice(0, 16)}...` : null,
			status: rootKeyHex ? "success" : "warning",
		},
		{
			label: "Identity Key (WIF)",
			value: wallet.walletKeys?.identityPk
				? `${wallet.walletKeys.identityPk.slice(0, 12)}...`
				: null,
			status: wallet.walletKeys?.identityPk ? "success" : "warning",
		},
		{
			label: "Identity Address",
			value: identityAddress,
			status: identityAddress ? "success" : "warning",
		},
		{
			label: "Root Key Hex (from Identity)",
			value: identityRootKeyHex
				? `${identityRootKeyHex.slice(0, 16)}...`
				: null,
			status: identityRootKeyHex ? "success" : "info",
		},
		{
			label: "Mnemonic Present",
			value: !!wallet.walletKeys?.mnemonic,
			status: wallet.walletKeys?.mnemonic ? "success" : "info",
		},
		{
			label: "Change Address Path",
			value: wallet.walletKeys?.changeAddressPath ?? null,
			status: "info",
		},
		{
			label: "Ord Address Path",
			value: wallet.walletKeys?.ordAddressPath ?? null,
			status: "info",
		},
		{
			label: "Identity Address Path",
			value: wallet.walletKeys?.identityAddressPath ?? null,
			status: "info",
		},
		{
			label: "Migration Status",
			value: migrationStatus?.status ?? "unknown",
			status:
				migrationStatus?.status === "migrated"
					? "success"
					: migrationStatus?.status === "legacy"
						? "warning"
						: "error",
		},
	];

	const toolboxDiagnostics: DiagnosticItem[] = [
		{
			label: "Is Initialized",
			value: toolbox.isInitialized,
			status: toolbox.isInitialized ? "success" : "warning",
		},
		{
			label: "Is Initializing",
			value: toolbox.isInitializing,
			status: toolbox.isInitializing ? "info" : "success",
		},
		{
			label: "Init Error",
			value: toolbox.initError,
			status: toolbox.initError ? "error" : "success",
		},
		{ label: "Chain", value: toolbox.chain, status: "info" },
		{
			label: "Identity Key",
			value: toolbox.identityKey
				? `${toolbox.identityKey.slice(0, 16)}...`
				: null,
			status: toolbox.identityKey ? "success" : "warning",
		},
		{
			label: "Wallet Instance",
			value: toolbox.wallet ? "Created" : "Not Created",
			status: toolbox.wallet ? "success" : "warning",
		},
		{
			label: "Is Syncing",
			value: toolbox.syncStatus.isSyncing,
			status: toolbox.syncStatus.isSyncing ? "info" : "success",
		},
		{
			label: "Sync Progress",
			value: toolbox.syncStatus.isSyncing ? "Refreshing..." : null,
			status: "info",
		},
		{
			label: "Last Sync",
			value: toolbox.syncStatus.lastSync?.toLocaleTimeString() ?? null,
			status: toolbox.syncStatus.lastSync ? "success" : "warning",
		},
		{
			label: "Sync Error",
			value: toolbox.syncStatus.error,
			status: toolbox.syncStatus.error ? "error" : "success",
		},
	];

	const balanceDiagnostics: DiagnosticItem[] = [
		{
			label: "Toolbox Balance (total)",
			value: toolbox.balance?.total ?? 0,
			status: "info",
		},
		{ label: "Ordinals Count", value: toolbox.ordinals.length, status: "info" },
		{
			label: "Exchange Rate",
			value: toolbox.exchangeRate,
			status: toolbox.exchangeRate ? "success" : "warning",
		},
	];

	return (
		<Page>
			<PageHeader className="gap-2 justify-start">
				<Button
					variant="ghost"
					size="icon"
					asChild
					className="-ml-2"
					onClick={() => play("click")}
				>
					<Link href="/wallet/settings">
						<ArrowLeft className="h-4 w-4" />
					</Link>
				</Button>
				<div className="flex-1">
					<PageTitle>Wallet Diagnostics</PageTitle>
					<p className="text-muted-foreground">
						Debug and test wallet-toolbox integration
					</p>
				</div>
				<Badge variant={wallet.isWalletLocked ? "destructive" : "default"}>
					{wallet.isWalletLocked ? "Locked" : "Unlocked"}
				</Badge>
			</PageHeader>
			<PageContent className="space-y-6">
				<div className="grid gap-6 md:grid-cols-2">
					{/* Key Manager (stripped legacy provider) */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Key Manager</CardTitle>
							<CardDescription>
								wallet-provider.tsx state (key storage only)
							</CardDescription>
						</CardHeader>
						<CardContent>
							{keyManagerDiagnostics.map((item) => (
								<DiagnosticRow key={item.label} item={item} />
							))}
						</CardContent>
					</Card>

					{/* Wallet Toolbox Provider */}
					<Card>
						<CardHeader>
							<CardTitle className="text-lg">Wallet Toolbox Provider</CardTitle>
							<CardDescription>
								wallet-toolbox-provider.tsx state
							</CardDescription>
						</CardHeader>
						<CardContent>
							{toolboxDiagnostics.map((item) => (
								<DiagnosticRow key={item.label} item={item} />
							))}
						</CardContent>
					</Card>
				</div>

				{/* Balance */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Balance</CardTitle>
						<CardDescription>Toolbox balance and exchange rate</CardDescription>
					</CardHeader>
					<CardContent>
						{balanceDiagnostics.map((item) => (
							<DiagnosticRow key={item.label} item={item} />
						))}
					</CardContent>
				</Card>

				{/* Migration Status */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<div>
								<CardTitle className="text-lg">Migration Status</CardTitle>
								<CardDescription>
									Identity key derivation and legacy sweep status
								</CardDescription>
							</div>
							<Badge
								variant={
									migrationStatus?.status === "migrated"
										? "default"
										: migrationStatus?.status === "legacy"
											? "secondary"
											: "destructive"
								}
							>
								{migrationStatus?.status ?? "unknown"}
							</Badge>
						</div>
					</CardHeader>
					<CardContent className="space-y-4">
						{migrationStatus?.status === "legacy" && (
							<>
								<div className="space-y-2 text-sm">
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Legacy Pay Address
										</span>
										<code className="text-xs font-mono bg-muted px-2 py-1 max-w-[300px] truncate">
											{migrationStatus.legacyPayAddress}
										</code>
									</div>
									<div className="flex justify-between">
										<span className="text-muted-foreground">
											Legacy Ord Address
										</span>
										<code className="text-xs font-mono bg-muted px-2 py-1 max-w-[300px] truncate">
											{migrationStatus.legacyOrdAddress}
										</code>
									</div>
									{legacyUtxoCounts.pay !== null && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Legacy Pay UTXOs
											</span>
											<code className="text-xs font-mono bg-muted px-2 py-1">
												{legacyUtxoCounts.pay}
											</code>
										</div>
									)}
									{legacyUtxoCounts.ord !== null && (
										<div className="flex justify-between">
											<span className="text-muted-foreground">
												Legacy Ord UTXOs
											</span>
											<code className="text-xs font-mono bg-muted px-2 py-1">
												{legacyUtxoCounts.ord}
											</code>
										</div>
									)}
								</div>
								<div className="flex gap-2">
									<Button
										variant="outline"
										size="sm"
										onClick={quickScan}
										disabled={isScanning}
									>
										{isScanning ? "Scanning..." : "Quick Scan UTXOs"}
									</Button>
									<Button size="sm" asChild>
										<Link href="/wallet/migrate">Open Migration Tool</Link>
									</Button>
								</div>
							</>
						)}

						{migrationStatus?.status === "migrated" && (
							<div className="text-sm text-muted-foreground">
								Wallet is using the identity key system. No migration needed.
							</div>
						)}

						{migrationStatus?.status === "unmigrateable" && (
							<div className="text-sm text-destructive">
								Wallet is missing required keys for migration.
							</div>
						)}
					</CardContent>
				</Card>

				{/* Address Comparison */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Address Comparison</CardTitle>
						<CardDescription>
							Side-by-side view of wallet addresses and root key sources
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b border-border/50">
										<th className="text-left py-2 pr-4 text-muted-foreground font-normal">
											Role
										</th>
										<th className="text-left py-2 text-muted-foreground font-normal">
											Address / Value
										</th>
									</tr>
								</thead>
								<tbody>
									<tr className="border-b border-border/50">
										<td className="py-2 pr-4 text-muted-foreground">
											Legacy Pay
										</td>
										<td className="py-2">
											<code className="text-xs font-mono break-all">
												{payAddress || "n/a"}
											</code>
										</td>
									</tr>
									<tr className="border-b border-border/50">
										<td className="py-2 pr-4 text-muted-foreground">
											Legacy Ord
										</td>
										<td className="py-2">
											<code className="text-xs font-mono break-all">
												{ordAddress || "n/a"}
											</code>
										</td>
									</tr>
									<tr className="border-b border-border/50">
										<td className="py-2 pr-4 text-muted-foreground">
											Identity
										</td>
										<td className="py-2">
											<code className="text-xs font-mono break-all">
												{identityAddress || "not derived"}
											</code>
										</td>
									</tr>
									<tr>
										<td className="py-2 pr-4 text-muted-foreground">
											BRC-100 Root Source
										</td>
										<td className="py-2">
											<Badge
												variant={identityRootKeyHex ? "default" : "secondary"}
											>
												{identityRootKeyHex
													? "Identity Key"
													: "Pay Key (legacy)"}
											</Badge>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>

				{/* Test Actions */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Test Actions</CardTitle>
						<CardDescription>Run diagnostic tests</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap gap-4">
							<Button
								onClick={testToolboxInit}
								disabled={isTestingToolbox || wallet.isWalletLocked}
							>
								{isTestingToolbox ? "Testing..." : "Test Toolbox Init"}
							</Button>
							<Button
								variant="outline"
								onClick={() => toolbox.syncWallet()}
								disabled={
									!toolbox.isInitialized || toolbox.syncStatus.isSyncing
								}
							>
								{toolbox.syncStatus.isSyncing ? "Syncing..." : "Sync Toolbox"}
							</Button>
							<Button
								variant="outline"
								onClick={() => toolbox.refreshBalance()}
								disabled={!toolbox.isInitialized}
							>
								Refresh Balance
							</Button>
						</div>

						{testResults.length > 0 && (
							<>
								<Separator />
								<div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
									{testResults.map((result) => (
										<div key={result}>{result}</div>
									))}
								</div>
							</>
						)}
					</CardContent>
				</Card>
			</PageContent>
		</Page>
	);
}
