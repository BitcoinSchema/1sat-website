"use client";

import { exchangeRate } from "@/signals/wallet";
import { useSignals } from "@preact/signals-react/runtime";
import Link from "next/link";
import { Store, ChevronDown } from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MarketMenu: React.FC = () => {
	useSignals();

	return (
		<div className="flex items-center gap-2">
			{/* Exchange Rate Display */}
			{exchangeRate.value > 0 && (
				<div className="hidden md:flex items-center text-xs text-muted-foreground border border-border px-3 py-1.5 bg-card font-mono">
					<span>
						1 BSV = <span className="text-primary">${exchangeRate.value.toFixed(2)}</span>
					</span>
				</div>
			)}

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="flex items-center gap-2 px-3 py-1.5 text-sm font-mono transition-colors bg-card text-muted-foreground border border-border hover:border-primary/50 hover:text-primary focus:outline-none focus:ring-1 focus:ring-ring"
					>
						<Store className="w-4 h-4" />
						<span className="hidden sm:inline uppercase tracking-wider text-xs">Market</span>
						<ChevronDown className="h-3 w-3 opacity-50" />
					</button>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					align="end"
					className="w-56 bg-background border border-border text-foreground font-mono"
				>
					<DropdownMenuLabel className="text-primary/70 text-xs uppercase tracking-widest">
						Collectables
					</DropdownMenuLabel>

					<DropdownMenuSeparator className="bg-border" />

					<DropdownMenuItem asChild className="focus:bg-accent focus:text-accent-foreground cursor-pointer rounded-sm">
						<Link href="/market/ordinals" className="flex items-center justify-between w-full">
							<span>Ordinals</span>
							<span className="text-muted-foreground text-xs">NFT</span>
						</Link>
					</DropdownMenuItem>

					<DropdownMenuItem asChild className="focus:bg-green-900/20 focus:text-green-400 cursor-pointer rounded-none">
						<Link href="/collection" className="flex items-center justify-between w-full">
							<span>Collections</span>
							<span className="text-muted-foreground text-xs">NFT</span>
						</Link>
					</DropdownMenuItem>

					<DropdownMenuSeparator className="bg-zinc-800" />

					<DropdownMenuLabel className="text-green-500/70 text-xs uppercase tracking-widest">
						Token Market
					</DropdownMenuLabel>

					<DropdownMenuItem asChild className="focus:bg-green-900/20 focus:text-green-400 cursor-pointer rounded-none">
						<Link href="/market/bsv20" className="flex items-center justify-between w-full">
							<span>BSV20</span>
							<span className="text-zinc-600 text-xs">FT</span>
						</Link>
					</DropdownMenuItem>

					<DropdownMenuItem asChild className="focus:bg-green-900/20 focus:text-green-400 cursor-pointer rounded-none">
						<Link href="/market/bsv21" className="flex items-center justify-between w-full">
							<span>BSV21</span>
							<span className="text-zinc-600 text-xs">FT</span>
						</Link>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

export default MarketMenu;
