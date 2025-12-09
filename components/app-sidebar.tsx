"use client";

import { PrivateKey } from "@bsv/sdk";
import {
	ArrowDown,
	Copy,
	Import,
	Loader2,
	Plus,
	QrCode,
	Send,
	Wallet,
} from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import * as React from "react";
import { useState } from "react";
import { NavUser } from "@/components/nav-user";
import { Button } from "@/components/ui/button";
import {
	SoundDialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/sound-dialog";
import { useCopyWithSound } from "@/hooks/use-copy-with-sound";
import { useSound } from "@/hooks/use-sound";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarSeparator,
} from "@/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { UnlockWalletDialog } from "@/components/wallet/unlock-wallet-dialog";
import { PRIVACY_MODE_KEY } from "@/lib/constants";
import { useSettingsStorage } from "@/lib/wallet-storage";
import { useWallet } from "@/providers/wallet-provider";

const navData = [
	{
		title: "Wallet",
		icon: Wallet,
		items: [
			{
				title: "My Listings",
				url: "/listings",
				shortcut: "g l",
			},
			{
				title: "Ordinals",
				url: "/wallet/ordinals",
				shortcut: "g o",
			},
			{
				title: "BSV20",
				url: "/wallet/bsv20",
				shortcut: "g 2",
			},
			{
				title: "BSV21",
				url: "/wallet/bsv21",
				shortcut: "g 1",
			},
			{
				title: "History",
				url: "/wallet/history",
				shortcut: "g y",
			},
			{
				title: "Settings",
				url: "/wallet/settings",
				shortcut: "g ,",
			},
		],
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const {
		isWalletLocked: _isWalletLocked,
		isWalletInitialized,
		hasWallet,
		balance,
		isSyncing,
		walletKeys,
		exchangeRate,
	} = useWallet();

	const [isPrivacyModeEnabled] = useSettingsStorage<boolean>(
		PRIVACY_MODE_KEY,
		false,
	);
	const [isUnlockDialogOpen, setIsUnlockDialogOpen] = useState(false);
	const [_, copy] = useCopyWithSound();
	const { play } = useSound();
	const [copiedPay, setCopiedPay] = useState(false);
	const [copiedOrd, setCopiedOrd] = useState(false);

	const bsvBalance = balance ? balance.total / 100_000_000 : 0;
	const usdBalance = exchangeRate ? bsvBalance * exchangeRate : 0;

	const payAddress = React.useMemo(() => {
		if (!walletKeys?.payPk) return "";
		try {
			return PrivateKey.fromWif(walletKeys.payPk).toAddress().toString();
		} catch (e) {
			console.error("Error deriving pay address:", e);
			return "";
		}
	}, [walletKeys]);

	const ordAddress = React.useMemo(() => {
		if (!walletKeys?.ordPk) return "";
		try {
			return PrivateKey.fromWif(walletKeys.ordPk).toAddress().toString();
		} catch (e) {
			console.error("Error deriving ord address:", e);
			return "";
		}
	}, [walletKeys]);

	const identityAddress = React.useMemo(() => {
		if (!walletKeys?.identityPk) return "";
		try {
			return PrivateKey.fromWif(walletKeys.identityPk).toAddress().toString();
		} catch (e) {
			console.error("Error deriving identity address:", e);
			return "";
		}
	}, [walletKeys]);

	const handleCopyPay = () => {
		copy(payAddress);
		setCopiedPay(true);
		setTimeout(() => setCopiedPay(false), 2000);
	};

	const handleCopyOrd = () => {
		copy(ordAddress);
		setCopiedOrd(true);
		setTimeout(() => setCopiedOrd(false), 2000);
	};

	if (!isWalletInitialized) {
		return (
			<Sidebar {...props}>
				<SidebarHeader className="p-4 pb-0">
					<div className="flex flex-col items-center justify-center h-24 text-muted-foreground">
						<Loader2 className="h-6 w-6 animate-spin" />
						<p className="text-sm mt-2">Loading Wallet...</p>
					</div>
				</SidebarHeader>
				<SidebarContent>
					<p className="p-4 text-sm text-muted-foreground">Initializing...</p>
				</SidebarContent>
				<SidebarRail />
			</Sidebar>
		);
	}

	// State 1: No Wallet (Create/Import)
	if (!hasWallet) {
		return (
			<Sidebar {...props}>
				<SidebarHeader className="p-4 pb-0">
					<div className="flex flex-col items-center justify-center gap-4 py-4">
						<Wallet className="h-8 w-8 text-muted-foreground" />
						<p className="text-sm text-muted-foreground">No Wallet</p>
						<div className="grid grid-cols-1 gap-2 w-full">
							<Link href="/wallet/create" className="w-full">
								<Button variant="outline" className="w-full" onClick={() => play("click")}>
									<Plus className="h-4 w-4 mr-2" /> Create New
								</Button>
							</Link>
							<Link href="/wallet/import" className="w-full">
								<Button variant="ghost" className="w-full" onClick={() => play("click")}>
									<Import className="h-4 w-4 mr-2" /> Import Existing
								</Button>
							</Link>
						</div>
					</div>
				</SidebarHeader>
				<SidebarContent>
					<div className="p-4 text-sm text-muted-foreground text-center">
						Create or import a wallet to get started.
					</div>
				</SidebarContent>
				<SidebarRail />
			</Sidebar>
		);
	}

	const activeAddress = identityAddress || ordAddress || payAddress;

	// State 3: Unlocked (or Locked but covered by overlay)
	return (
		<Sidebar {...props}>
			<SidebarHeader className="p-4 pb-0">
				{/* Unlocked Content */}
				<div className="flex flex-col gap-1">
					<Link
						href="/wallet"
						className="flex flex-col gap-1 hover:opacity-80 transition-opacity cursor-pointer mb-4"
						onClick={() => play("click")}
					>
						<span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
							Total Balance
							{isSyncing && <Loader2 className="h-3 w-3 animate-spin" />}
						</span>
						<div className="flex items-baseline gap-2">
							<span className="text-2xl font-bold tracking-tight">
								{isPrivacyModeEnabled
									? "*****"
									: usdBalance
										? `$${usdBalance.toFixed(2)}`
										: "$ ---"}
							</span>
							<span className="text-sm text-muted-foreground">USD</span>
						</div>
						<span className="text-sm text-muted-foreground">
							{isPrivacyModeEnabled ? "*****" : `${bsvBalance.toFixed(8)} BSV`}
						</span>
					</Link>

					{/* Address Copy Buttons */}
					<div className="grid grid-cols-1 gap-2 mb-4">
						<div className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50 border border-border/50">
							<div className="flex flex-col overflow-hidden">
								<span className="text-[10px] uppercase text-muted-foreground font-medium">
									Payment Address
								</span>
								<span className="text-xs truncate font-mono text-foreground/80">
									{payAddress || "Locked"}
								</span>
							</div>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6 shrink-0"
											onClick={(e) => {
												e.preventDefault();
												handleCopyPay();
											}}
											disabled={!payAddress}
										>
											<Copy className="h-3 w-3" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>{copiedPay ? "Copied!" : "Copy Address"}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>

						<div className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50 border border-border/50">
							<div className="flex flex-col overflow-hidden">
								<span className="text-[10px] uppercase text-muted-foreground font-medium">
									Ordinals Address
								</span>
								<span className="text-xs truncate font-mono text-foreground/80">
									{ordAddress || "Locked"}
								</span>
							</div>
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6 shrink-0"
											onClick={(e) => {
												e.preventDefault();
												handleCopyOrd();
											}}
											disabled={!ordAddress}
										>
											<Copy className="h-3 w-3" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>{copiedOrd ? "Copied!" : "Copy Address"}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-2">
						<SoundDialog>
							<DialogTrigger asChild>
								<Button size="sm" className="w-full gap-2" onClick={() => play("click")}>
									<ArrowDown className="h-4 w-4" /> Deposit
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Deposit Funds</DialogTitle>
									<DialogDescription>
										Send BSV to this address to deposit funds into your wallet.
									</DialogDescription>
								</DialogHeader>
								<div className="flex flex-col items-center gap-4 py-4">
									<div className="p-4 bg-white rounded-lg flex items-center justify-center shadow-sm">
										{payAddress ? (
											<QRCodeSVG
												value={payAddress}
												size={180}
												className="h-48 w-48"
											/>
										) : (
											<div className="h-48 w-48 bg-muted rounded-lg flex items-center justify-center">
												<QrCode className="h-24 w-24 text-muted-foreground" />
											</div>
										)}
									</div>
									<div className="w-full space-y-2">
										<Label htmlFor="address" className="sr-only">
											Address
										</Label>
										<div className="flex gap-2">
											<Input
												id="address"
												value={payAddress || "Loading..."}
												readOnly
												className="font-mono text-xs"
											/>
											<Button
												size="icon"
												variant="outline"
												onClick={handleCopyPay}
											>
												<Copy className="h-4 w-4" />
											</Button>
										</div>
										<p className="text-[10px] text-muted-foreground text-center">
											Send BSV only. For Ordinals, use the Ordinals address.
										</p>
									</div>
								</div>
							</DialogContent>
						</SoundDialog>

						<SoundDialog>
							<DialogTrigger asChild>
								<Button size="sm" variant="outline" className="w-full gap-2" onClick={() => play("click")}>
									<Send className="h-4 w-4" /> Send
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Send Funds</DialogTitle>
									<DialogDescription>
										Enter the recipient address and amount to send.
									</DialogDescription>
								</DialogHeader>
								<div className="grid gap-4 py-4">
									<div className="grid gap-2">
										<Label htmlFor="recipient">Recipient Address</Label>
										<Input id="recipient" placeholder="1A1z..." />
									</div>
									<div className="grid gap-2">
										<Label htmlFor="amount">Amount (BSV)</Label>
										<Input id="amount" placeholder="0.00" type="number" />
									</div>
								</div>
								<Button className="w-full" onClick={() => play("success")}>Confirm Send</Button>
							</DialogContent>
						</SoundDialog>
					</div>
				</div>
			</SidebarHeader>
			<SidebarSeparator className="my-4" />
			<SidebarContent>
				{navData.map((group) => (
					<SidebarGroup key={group.title}>
						<SidebarGroupLabel>{group.title}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{group.items.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton asChild>
											<Link href={item.url} onClick={() => play("click")}>
												{item.title}
												{item.shortcut && (
													<span className="ml-auto text-xs tracking-widest text-muted-foreground hidden md:block">
														{item.shortcut}
													</span>
												)}
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>
			<SidebarFooter>
				<NavUser
					user={{
						name: "1Sat User",
						email: activeAddress ? activeAddress.slice(0, 8) : "No Wallet",
						address: activeAddress || "1sat",
					}}
				/>
			</SidebarFooter>
			<SidebarRail />
			<UnlockWalletDialog
				open={isUnlockDialogOpen}
				onOpenChange={setIsUnlockDialogOpen}
			/>
		</Sidebar>
	);
}
