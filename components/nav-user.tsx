"use client";

import { ChevronsUpDown, LogOut, Wallet } from "lucide-react";
import Link from "next/link";

import {
	DropdownMenu,
	DropdownMenuContent,
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
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

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
	const { connectionMode, disconnectExternalWallet } = useWalletToolbox();

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
								<Wallet className="h-4 w-4" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">{user.name}</span>
								<span className="truncate text-xs">{user.email}</span>
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
								<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
									<Wallet className="h-4 w-4" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">{user.name}</span>
									<span className="truncate text-xs">{user.email}</span>
								</div>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />

						{connectionMode === "external" ? (
							<DropdownMenuItem
								onSelect={() => {
									play("click");
									void disconnectExternalWallet();
								}}
							>
								<LogOut className="mr-2 h-4 w-4" />
								Disconnect Wallet
							</DropdownMenuItem>
						) : (
							<DropdownMenuItem asChild onClick={() => play("click")}>
								<Link
									href="/wallet/delete"
									className="flex w-full items-center text-destructive focus:text-destructive cursor-pointer"
								>
									<LogOut className="mr-2 h-4 w-4" />
									Delete Wallet
								</Link>
							</DropdownMenuItem>
						)}
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
