"use client";

import {
	Cable,
	Laptop,
	Loader2,
	LockKeyhole,
	LogOut,
	Puzzle,
	RefreshCw,
	Smartphone,
	Wallet,
} from "lucide-react";
import Link from "next/link";
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
import { Skeleton } from "@/components/ui/skeleton";
import { WalletHomeActions } from "@/components/wallet/wallet-home-actions";
import { WalletHomeStatus } from "@/components/wallet/wallet-home-status";
import { WalletTabs } from "@/components/wallet/wallet-tabs";
import { PRIVACY_MODE_KEY } from "@/lib/constants";
import { useSettingsStorage } from "@/lib/wallet-storage";
import { useWallet } from "@/providers/wallet-provider";
import {
	useWalletToolbox,
	type WalletConnectionMode,
} from "@/providers/wallet-toolbox-provider";

function LoadingHome({ message }: { message: string }) {
	return (
		<Page>
			<PageHeader>
				<PageTitle>Wallet</PageTitle>
			</PageHeader>
			<PageContent>
				<Card className="max-w-2xl">
					<CardContent
						aria-live="polite"
						className="flex items-center gap-3 text-muted-foreground text-sm"
						role="status"
					>
						<Loader2 className="size-4 animate-spin" />
						{message}
					</CardContent>
				</Card>
			</PageContent>
		</Page>
	);
}

function ConnectWalletHome() {
	const { isInitializing, initError, connectExternalWallet } =
		useWalletToolbox();

	return (
		<Page>
			<PageHeader>
				<PageTitle>Wallet</PageTitle>
			</PageHeader>
			<PageContent>
				<Card className="max-w-3xl">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Wallet className="size-5" />
							Choose how to use 1Sat
						</CardTitle>
						<CardDescription>
							Connect a BRC-100 wallet available to this browser, or keep a
							wallet encrypted on this device.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-5">
						<div className="grid gap-3 sm:grid-cols-3">
							{[
								{
									icon: Laptop,
									title: "1Sat Desktop",
									copy: "Connect to 1Sat Wallet on this computer.",
								},
								{
									icon: Puzzle,
									title: "Injected wallet",
									copy: "Use Yours or another injected BRC-100 wallet.",
								},
								{
									icon: Smartphone,
									title: "Embedded mobile",
									copy: "Use the wallet exposed by a compatible mobile host.",
								},
							].map(({ icon: Icon, title, copy }) => (
								<div className="rounded-lg border p-3" key={title}>
									<Icon className="mb-3 size-5 text-primary" />
									<p className="font-medium text-sm">{title}</p>
									<p className="mt-1 text-muted-foreground text-xs">{copy}</p>
								</div>
							))}
						</div>
						<Button
							disabled={isInitializing}
							onClick={() => void connectExternalWallet()}
						>
							{isInitializing ? (
								<Loader2 className="animate-spin" />
							) : (
								<Cable />
							)}
							{isInitializing ? "Connecting…" : "Connect BRC-100 wallet"}
						</Button>
						{initError && (
							<p className="text-destructive text-sm" role="alert">
								{initError}
							</p>
						)}
						<div className="flex items-center gap-3 text-muted-foreground text-xs">
							<span className="h-px flex-1 bg-border" />
							or use the built-in web wallet
							<span className="h-px flex-1 bg-border" />
						</div>
						<div className="flex flex-wrap gap-2">
							<Button asChild>
								<Link href="/wallet/create">Create wallet</Link>
							</Button>
							<Button asChild variant="outline">
								<Link href="/wallet/import">Import wallet</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</PageContent>
		</Page>
	);
}

function FailedWalletHome({ message }: { message: string }) {
	const { lockWallet } = useWallet();

	return (
		<Page>
			<PageHeader>
				<PageTitle>Wallet</PageTitle>
			</PageHeader>
			<PageContent>
				<Card className="max-w-2xl border-destructive/50">
					<CardHeader>
						<CardTitle>Wallet could not be opened</CardTitle>
						<CardDescription className="break-all">{message}</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onClick={lockWallet} variant="outline">
							Lock and retry
						</Button>
					</CardContent>
				</Card>
			</PageContent>
		</Page>
	);
}

function LockedWalletHome({ external }: { external: boolean }) {
	const { disconnectExternalWallet } = useWalletToolbox();

	return (
		<Page>
			<PageHeader>
				<PageTitle>Wallet</PageTitle>
			</PageHeader>
			<PageContent>
				<Card className="max-w-2xl">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<LockKeyhole className="size-5" /> Wallet locked
						</CardTitle>
						<CardDescription>
							{external
								? "Unlock the connected wallet, then reconnect this session."
								: "Use the unlock prompt to continue with this wallet."}
						</CardDescription>
					</CardHeader>
					{external && (
						<CardContent>
							<Button
								onClick={() => void disconnectExternalWallet()}
								variant="outline"
							>
								Choose another wallet
							</Button>
						</CardContent>
					)}
				</Card>
			</PageContent>
		</Page>
	);
}

function connectionLabel(
	mode: WalletConnectionMode,
	providerType: string | null,
) {
	if (mode === "built-in") return "Built-in web wallet";
	if (mode === "external") {
		return `External · ${providerType ?? "BRC-100"}`;
	}
	return "No wallet";
}

function ConnectedWalletHome() {
	const {
		balance,
		balanceError,
		connectionMode,
		disconnectExternalWallet,
		exchangeRate,
		isBalanceLoading,
		legacyBalance,
		providerType,
		refreshBalance,
	} = useWalletToolbox();
	const [privacyMode] = useSettingsStorage<boolean>(PRIVACY_MODE_KEY, false);
	const balanceSupported =
		connectionMode === "built-in" || isBalanceLoading || balance !== null;
	const totalBsv =
		balanceSupported && balance ? balance.total / 100_000_000 : null;
	const totalUsd =
		totalBsv !== null && exchangeRate !== null ? totalBsv * exchangeRate : null;

	return (
		<Page>
			<PageHeader className="flex-wrap gap-3">
				<div>
					<PageTitle>Wallet</PageTitle>
					<p className="mt-1 text-muted-foreground text-sm">
						Your money, assets, and connection at a glance.
					</p>
				</div>
				<div className="ml-auto flex flex-wrap items-center justify-end gap-2">
					<Badge className="gap-1.5" variant="outline">
						<span className="size-1.5 rounded-full bg-emerald-500" />
						{connectionLabel(connectionMode, providerType)}
					</Badge>
					{connectionMode === "external" && (
						<Button
							onClick={() => void disconnectExternalWallet()}
							size="sm"
							variant="ghost"
						>
							<LogOut /> Disconnect
						</Button>
					)}
				</div>
			</PageHeader>

			<PageContent className="space-y-6">
				<WalletTabs />
				{balanceSupported && balanceError && (
					<div
						className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4"
						role="alert"
					>
						<div>
							<p className="font-medium text-destructive">
								Wallet data could not be refreshed
							</p>
							<p className="mt-1 break-all text-muted-foreground text-sm">
								{balanceError.message}
							</p>
						</div>
						<Button onClick={refreshBalance} size="sm" variant="outline">
							<RefreshCw /> Retry
						</Button>
					</div>
				)}

				<section aria-labelledby="wallet-balance-heading">
					<Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
						<CardContent className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
							<div>
								<p
									className="text-muted-foreground text-sm"
									id="wallet-balance-heading"
								>
									Spendable balance
								</p>
								{!balanceSupported ? (
									<div className="mt-3">
										<p className="text-2xl font-semibold text-muted-foreground">
											Provider-managed
										</p>
										<p className="mt-1 text-muted-foreground text-sm">
											This provider does not expose a certified
											spendable-balance summary.
										</p>
									</div>
								) : isBalanceLoading || (!balance && !balanceError) ? (
									<div className="mt-3 space-y-2" role="status">
										<Skeleton className="h-10 w-60" />
										<Skeleton className="h-4 w-28" />
										<span className="sr-only">Loading wallet balance</span>
									</div>
								) : balanceError ? (
									<p className="mt-3 text-2xl font-semibold text-muted-foreground">
										Unavailable
									</p>
								) : (
									<>
										<p className="mt-2 font-mono text-3xl font-semibold tracking-tight sm:text-4xl">
											{privacyMode ? "••••••••" : `${totalBsv?.toFixed(8)} BSV`}
										</p>
										{!privacyMode && totalUsd !== null && (
											<p className="mt-1 text-muted-foreground text-sm">
												${totalUsd.toFixed(2)} USD
											</p>
										)}
									</>
								)}
							</div>
							<WalletHomeActions />
						</CardContent>
					</Card>
				</section>

				{connectionMode === "built-in" && legacyBalance > 0 && (
					<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
						<div>
							<p className="font-medium">Legacy balance found</p>
							<p className="text-muted-foreground text-sm">
								{privacyMode
									? "Funds are held on legacy addresses."
									: `${(legacyBalance / 100_000_000).toFixed(8)} BSV is held on legacy addresses.`}
							</p>
						</div>
						<Button asChild size="sm">
							<Link href="/wallet/migrate">Review migration</Link>
						</Button>
					</div>
				)}
				<WalletHomeStatus />
			</PageContent>
		</Page>
	);
}

export function WalletHome() {
	const { hasWallet, isWalletInitialized, isWalletLocked } = useWallet();
	const {
		connectionMode,
		connectionStatus,
		identityKey,
		initError,
		isInitialized,
		isInitializing,
	} = useWalletToolbox();

	if (!isWalletInitialized) return <LoadingHome message="Loading wallet…" />;
	if (isInitialized && identityKey) {
		return <ConnectedWalletHome key={identityKey} />;
	}
	if (connectionStatus === "locked" || (hasWallet && isWalletLocked)) {
		return <LockedWalletHome external={connectionMode === "external"} />;
	}
	if (isInitializing || connectionStatus === "authenticating") {
		return <LoadingHome message="Authenticating wallet…" />;
	}
	if (hasWallet) {
		return initError ? (
			<FailedWalletHome message={initError} />
		) : (
			<LoadingHome message="Unlock your wallet to continue." />
		);
	}
	return <ConnectWalletHome />;
}
