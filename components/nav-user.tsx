"use client";

import {
	ChevronsUpDown,
	Download,
	Github,
	Key,
	LogOut,
	Wallet,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import SigmaAvatar from "sigma-avatars";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";
import { useSound } from "@/hooks/use-sound";
import { useAuth } from "@/providers/auth-provider";
import { useWallet } from "@/providers/wallet-provider";

export function NavUser({
	user,
}: {
	user: {
		name: string;
		email: string;
		address: string;
	};
}) {
	const { play } = useSound();
	const { isMobile } = useSidebar();
	const { walletKeys } = useWallet();
	const {
		user: authUser,
		isAuthenticated,
		signInSigma,
		signInGitHub,
		signOut: authSignOut,
	} = useAuth();

	const handleExport = () => {
		if (!walletKeys?.mnemonic) return;

		const element = document.createElement("a");
		const file = new Blob([walletKeys.mnemonic], { type: "text/plain" });
		element.href = URL.createObjectURL(file);
		element.download = "1sat-wallet-backup.txt";
		document.body.appendChild(element);
		element.click();
		document.body.removeChild(element);
	};

	const displayName = isAuthenticated ? authUser?.name || user.name : user.name;
	const displayEmail = isAuthenticated
		? authUser?.email || user.email
		: user.email;

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<div className="h-8 w-8 rounded-lg overflow-hidden">
								{isAuthenticated && authUser?.picture ? (
									<Image
										src={authUser.picture}
										alt={displayName}
										width={32}
										height={32}
										className="h-full w-full object-cover"
										unoptimized
									/>
								) : (
									<SigmaAvatar
										name={user.address}
										colors={[
											"var(--chart-1)",
											"var(--chart-2)",
											"var(--chart-3)",
											"var(--chart-4)",
											"var(--chart-5)",
										]}
										className="h-full w-full"
									/>
								)}
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{displayName}</span>
								<span className="truncate text-xs">{displayEmail}</span>
							</div>
							<ChevronsUpDown className="ml-auto size-4" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						side={isMobile ? "bottom" : "right"}
						align="end"
						sideOffset={4}
					>
						<DropdownMenuLabel className="p-0 font-normal">
							<div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
								<div className="h-8 w-8 rounded-lg overflow-hidden">
									{isAuthenticated && authUser?.picture ? (
										<Image
											src={authUser.picture}
											alt={displayName}
											width={32}
											height={32}
											className="h-full w-full object-cover"
											unoptimized
										/>
									) : (
										<SigmaAvatar
											name={user.address}
											colors={[
												"var(--chart-1)",
												"var(--chart-2)",
												"var(--chart-3)",
												"var(--chart-4)",
												"var(--chart-5)",
											]}
											className="h-full w-full"
										/>
									)}
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{displayName}</span>
									<span className="truncate text-xs">{displayEmail}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />

						{!isAuthenticated && (
							<>
								<DropdownMenuGroup>
									<DropdownMenuItem
										onSelect={() => {
											play("click");
											signInSigma();
										}}
									>
										<Key className="mr-2 h-4 w-4" />
										Sign in with Sigma
									</DropdownMenuItem>
									<DropdownMenuItem
										onSelect={() => {
											play("click");
											signInGitHub();
										}}
									>
										<Github className="mr-2 h-4 w-4" />
										Sign in with GitHub
									</DropdownMenuItem>
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
							</>
						)}

						<DropdownMenuGroup>
							<DropdownMenuItem
								onSelect={() => {
									play("click");
									handleExport();
								}}
							>
								<Download className="mr-2 h-4 w-4" />
								Export Keys
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => play("click")}>
								<Wallet className="mr-2 h-4 w-4" />
								Wallet Details
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />

						{isAuthenticated && (
							<DropdownMenuItem
								onSelect={() => {
									play("click");
									authSignOut();
								}}
								className="text-muted-foreground"
							>
								<LogOut className="mr-2 h-4 w-4" />
								Sign Out (Identity)
							</DropdownMenuItem>
						)}

						<DropdownMenuItem asChild onClick={() => play("click")}>
							<Link
								href="/wallet/delete"
								className="flex w-full items-center text-destructive focus:text-destructive cursor-pointer"
							>
								<LogOut className="mr-2 h-4 w-4" />
								Delete Wallet
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
