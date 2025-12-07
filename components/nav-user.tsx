"use client";

import { ChevronsUpDown, Download, LogOut, Wallet } from "lucide-react";
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
  const { isMobile } = useSidebar();
  const { walletKeys } = useWallet();

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
                <SigmaAvatar name={user.address} colors={["#ff3366", "#33ccff", "#33ff99", "#ffcc33", "#cc33ff"]} className="h-full w-full" />
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
                <div className="h-8 w-8 rounded-lg overflow-hidden">
                  <SigmaAvatar name={user.address} colors={["#ff3366", "#33ccff", "#33ff99", "#ffcc33", "#cc33ff"]} className="h-full w-full" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export Keys
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Wallet className="mr-2 h-4 w-4" />
                Wallet Details
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/wallet/delete"
                className="flex w-full items-center text-destructive focus:text-destructive cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      {/* Modal removed from here as it is now a page */}
    </SidebarMenu>
  );
}
