"use client";

import {
	Bug,
	Cable,
	Eye,
	EyeOff,
	Loader2,
	LogOut,
	RefreshCw,
	Shield,
	Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useSound } from "@/hooks/use-sound";
import { CURRENCY_KEY, PRIVACY_MODE_KEY } from "@/lib/constants";
import { useSettingsStorage } from "@/lib/wallet-storage";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

export function WalletSettingsForm() {
	const { play } = useSound();
	const {
		syncWallet,
		hasActiveSync: isSyncing,
		isInitialized,
		connectionMode,
		providerType,
		disconnectExternalWallet,
	} = useWalletToolbox();
	const [isPrivacyModeEnabled, setIsPrivacyModeEnabled] =
		useSettingsStorage<boolean>(PRIVACY_MODE_KEY, false);
	const [currency, setCurrency] = useSettingsStorage<string>(
		CURRENCY_KEY,
		"USD",
	);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) return null;

	return (
		<div className="grid gap-6">
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="p-2 bg-primary/10 rounded-full">
							<Cable className="h-6 w-6 text-primary" />
						</div>
						<div>
							<CardTitle>Wallet Connection</CardTitle>
							<CardDescription>
								{connectionMode === "external"
									? `Connected through ${providerType ?? "a BRC-100 provider"}.`
									: "Using the wallet built into this browser."}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				{connectionMode === "external" && (
					<CardContent>
						<Button
							onClick={() => void disconnectExternalWallet()}
							variant="outline"
						>
							<LogOut className="h-4 w-4 mr-2" />
							Disconnect External Wallet
						</Button>
					</CardContent>
				)}
			</Card>

			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="p-2 bg-primary/10 rounded-full">
							<Wallet className="h-6 w-6 text-primary" />
						</div>
						<div>
							<CardTitle>Wallet Preferences</CardTitle>
							<CardDescription>
								Manage how your wallet behaves and displays data.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* Currency Selection */}
					<div className="flex items-center justify-between space-x-2">
						<div className="flex flex-col space-y-1">
							<Label htmlFor="currency" className="text-base">
								Display Currency
							</Label>
							<span className="text-sm text-muted-foreground">
								Select your preferred currency for fiat value display.
							</span>
						</div>
						<div className="flex items-center gap-2">
							<Select
								value={currency}
								onValueChange={(v) => {
									play("click");
									setCurrency(v);
								}}
							>
								<SelectTrigger className="w-[100px]" id="currency">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="USD">USD</SelectItem>
									<SelectItem value="BSV">BSV</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<Separator />

					{/* Privacy Mode */}
					<div className="flex items-center justify-between space-x-2">
						<div className="flex flex-col space-y-1">
							<div className="flex items-center gap-2">
								<Label htmlFor="privacy" className="text-base">
									Privacy Mode
								</Label>
								{isPrivacyModeEnabled ? (
									<EyeOff className="h-4 w-4 text-muted-foreground" />
								) : (
									<Eye className="h-4 w-4 text-muted-foreground" />
								)}
							</div>
							<span className="text-sm text-muted-foreground">
								Hide wallet balances by default in the sidebar and dashboard.
							</span>
						</div>
						<Switch
							id="privacy"
							checked={isPrivacyModeEnabled}
							onCheckedChange={(v) => {
								play("click");
								setIsPrivacyModeEnabled(v);
							}}
						/>
					</div>

					<Separator />

					{/* Sync */}
					<div className="flex items-center justify-between space-x-2">
						<div className="flex flex-col space-y-1">
							<Label className="text-base">Blockchain Sync</Label>
							<span className="text-sm text-muted-foreground">
								Manually refresh your spendable balance and indexed assets.
							</span>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => {
								play("click");
								syncWallet();
							}}
							disabled={!isInitialized || isSyncing}
							className="min-w-[100px]"
						>
							{isSyncing ? (
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
							) : (
								<RefreshCw className="h-4 w-4 mr-2" />
							)}
							{isSyncing ? "Syncing..." : "Sync Now"}
						</Button>
					</div>

					<Separator />

					{connectionMode === "built-in" && (
						<div className="flex items-center justify-between space-x-2">
							<div className="flex flex-col space-y-1">
								<Label className="text-base">Connected Apps</Label>
								<span className="text-sm text-muted-foreground">
									Review and revoke permissions granted to external apps.
								</span>
							</div>
							<Button
								variant="outline"
								size="sm"
								asChild
								onClick={() => play("click")}
							>
								<Link href="/wallet/permissions">
									<Shield className="h-4 w-4 mr-2" />
									Manage
								</Link>
							</Button>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Developer Tools */}
			<Card>
				<CardHeader>
					<div className="flex items-center gap-2">
						<div className="p-2 bg-chart-3/10 rounded-full">
							<Bug className="h-6 w-6 text-chart-3" />
						</div>
						<div>
							<CardTitle>Developer Tools</CardTitle>
							<CardDescription>
								Advanced debugging and diagnostic features.
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-between space-x-2">
						<div className="flex flex-col space-y-1">
							<Label className="text-base">Wallet Diagnostics</Label>
							<span className="text-sm text-muted-foreground">
								View wallet state, test integrations, and debug issues.
							</span>
						</div>
						<Button
							variant="outline"
							size="sm"
							asChild
							onClick={() => play("click")}
						>
							<Link href="/wallet/diagnostics">
								<Bug className="h-4 w-4 mr-2" />
								Open
							</Link>
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Danger Zone */}
			{connectionMode === "built-in" && (
				<Card className="border-destructive/50">
					<CardHeader>
						<CardTitle className="text-destructive">Danger Zone</CardTitle>
						<CardDescription>
							Irreversible actions that affect your wallet access.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center justify-between space-x-2">
							<div className="flex flex-col space-y-1">
								<Label className="text-base">Sign Out</Label>
								<span className="text-sm text-muted-foreground">
									Remove this wallet from the browser. Ensure you have your
									recovery phrase backed up.
								</span>
							</div>
							<Button
								variant="destructive"
								size="sm"
								asChild
								onClick={() => play("click")}
							>
								<Link href="/wallet/delete">
									<LogOut className="h-4 w-4 mr-2" />
									Sign Out
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
