"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
	clearSelection,
	searchQuery,
	selectedCount,
	selectAll,
} from "@/signals/wallet/selection";
import { useSignals } from "@preact/signals-react/runtime";
import {
	CheckSquare,
	Hash,
	ImageIcon,
	Music,
	Box,
	FileCode,
	Video,
	Palette,
	Search,
	X,
	Wallet,
	Coins,
	History,
	Plus,
	CircleDollarSign,
	Clock,
	Tag,
	AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArtifactType } from "../artifact";
import { selectedType, changeFilter } from "./filter";
import { WalletTab } from "./tabs";
import { cn } from "@/lib/utils";

interface WalletSidebarProps {
	tab: WalletTab;
	address?: string;
	counts?: Record<string, number>;
	ordinalOutpoints?: string[];
}

const NAV_ITEMS = [
	{ id: WalletTab.Ordinals, label: "Ordinals", icon: Wallet },
	{ id: WalletTab.BSV20, label: "BSV20", icon: Coins },
	{ id: WalletTab.BSV21, label: "BSV21", icon: CircleDollarSign },
	{ id: WalletTab.History, label: "History", icon: History },
] as const;

const ARTIFACT_FILTERS = [
	{ type: ArtifactType.All, icon: Hash, label: "All Assets" },
	{ type: ArtifactType.Image, icon: ImageIcon, label: "Images" },
	{ type: ArtifactType.Video, icon: Video, label: "Videos" },
	{ type: ArtifactType.Audio, icon: Music, label: "Audio" },
	{ type: ArtifactType.Model, icon: Box, label: "3D Models" },
	{ type: ArtifactType.Text, icon: FileCode, label: "Text / Code" },
] as const;

enum BalanceFilter {
	Confirmed = "confirmed",
	Pending = "pending",
	Listed = "listed",
	Unindexed = "unindexed",
}

const BALANCE_FILTERS = [
	{ id: BalanceFilter.Confirmed, label: "Confirmed", icon: CheckSquare },
	{ id: BalanceFilter.Pending, label: "Pending", icon: Clock },
	{ id: BalanceFilter.Listed, label: "Listed", icon: Tag },
	{ id: BalanceFilter.Unindexed, label: "Unindexed", icon: AlertTriangle },
] as const;

// Export for use in bsv20List
export { BalanceFilter };

import { signal } from "@preact/signals-react";
export const selectedBalanceFilter = signal<BalanceFilter>(BalanceFilter.Confirmed);

export default function WalletSidebar({ 
	tab, 
	address, 
	counts = {}, 
	ordinalOutpoints = [] 
}: WalletSidebarProps) {
	useSignals();
	const pathname = usePathname();

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		searchQuery.value = e.target.value;
	};

	const handleClearSearch = () => {
		searchQuery.value = "";
	};

	const handleSelectAll = () => {
		if (selectedCount.value === ordinalOutpoints.length) {
			clearSelection();
		} else {
			selectAll(ordinalOutpoints);
		}
	};

	const isOrdinals = tab === WalletTab.Ordinals;
	const isBsv20 = tab === WalletTab.BSV20;
	const isBsv21 = tab === WalletTab.BSV21;
	const isTokenPage = isBsv20 || isBsv21;

	return (
		<div className="flex flex-col h-full bg-background border-r border-border w-[280px] min-w-[280px]">
			{/* Header */}
			<div className="px-4 md:px-6 py-4 border-b border-border">
				<h2 className="font-mono text-xs uppercase tracking-widest text-primary mb-1">
					WALLET
				</h2>
				<p className="text-[10px] text-muted-foreground uppercase tracking-wider">
					Asset Management
				</p>
			</div>

			{/* Scrollable Content */}
			<ScrollArea className="flex-1">
				<div className="px-4 md:px-6 py-4 space-y-6">
					{/* Navigation Section */}
					<div>
						<h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
							NAVIGATION
						</h3>
						<div className="space-y-1">
							{NAV_ITEMS.map(({ id, label, icon: Icon }) => {
								const isActive = tab === id;
								const href = address ? `/activity/${address}/${id}` : `/wallet/${id}`;
								
								return (
									<Link
										key={id}
										href={href}
										className={cn(
											"w-full flex items-center justify-between px-3 py-2.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all",
											isActive
												? "bg-primary/10 text-primary border-l-2 border-primary"
												: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
										)}
									>
										<span className="flex items-center gap-2">
											<Icon className="w-4 h-4" />
											{label}
										</span>
									</Link>
								);
							})}
						</div>
					</div>

					<Separator className="bg-border" />

					{/* Mint Button */}
					<Button
						asChild
						variant="outline"
						className="w-full rounded-md font-mono text-xs uppercase tracking-wider justify-start gap-2 h-10 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
					>
						<Link href={`/inscribe?tab=${isOrdinals ? "image" : tab}`}>
							<Plus className="w-4 h-4" />
							Mint New
						</Link>
					</Button>

					<Separator className="bg-border" />

					{/* Ordinals-specific filters */}
					{isOrdinals && (
						<>
							{/* Search */}
							<div>
								<h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
									SEARCH
								</h3>
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
									<Input
										value={searchQuery.value}
										onChange={handleSearch}
										placeholder="SEARCH TXID..."
										className="pl-10 pr-8 bg-muted/50 border-border rounded-md font-mono text-xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring h-9"
									/>
									{searchQuery.value && (
										<Button
											variant="ghost"
											size="sm"
											onClick={handleClearSearch}
											className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
										>
											<X className="w-3 h-3" />
										</Button>
									)}
								</div>
							</div>

							<Separator className="bg-border" />

							{/* Artifact Type Filters */}
							<div>
								<h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
									ARTIFACT_TYPE
								</h3>
								<div className="space-y-1">
									{ARTIFACT_FILTERS.map(({ type, icon: Icon, label }) => {
										const isActive = selectedType.value === type;
										return (
											<button
												key={type}
												type="button"
												onClick={() => changeFilter(type)}
												className={cn(
													"w-full flex items-center justify-between px-3 py-2.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all",
													isActive
														? "bg-primary/10 text-primary border-l-2 border-primary"
														: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
												)}
											>
												<span className="flex items-center gap-2">
													<Icon className="w-4 h-4" />
													{label}
												</span>
												{type === ArtifactType.All && counts.total !== undefined && (
													<Badge
														variant="outline"
														className="rounded-md border-border text-muted-foreground font-mono text-[10px] h-5 px-1.5"
													>
														{counts.total}
													</Badge>
												)}
											</button>
										);
									})}
								</div>
							</div>

							{/* Theme Filter */}
							{(counts.theme ?? 0) > 0 && (
								<>
									<Separator className="bg-border" />
									<div>
										<h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
											PROTOCOLS
										</h3>
										<button
											type="button"
											onClick={() => changeFilter("theme" as ArtifactType)}
											className={cn(
												"w-full flex items-center justify-between px-3 py-2.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all",
												selectedType.value === ("theme" as ArtifactType)
													? "bg-purple-500/20 text-purple-400 border-l-2 border-purple-500"
													: "text-purple-400/70 hover:text-purple-400 hover:bg-purple-500/10"
											)}
										>
											<span className="flex items-center gap-2">
												<Palette className="w-4 h-4" />
												Themes
											</span>
											<Badge
												variant="outline"
												className="rounded-md border-purple-500/50 text-purple-400 font-mono text-[10px] h-5 px-1.5"
											>
												{counts.theme}
											</Badge>
										</button>
									</div>
								</>
							)}

							{/* Batch Actions */}
							{ordinalOutpoints.length > 0 && (
								<>
									<Separator className="bg-border" />
									<div>
										<h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
											BATCH_ACTIONS
										</h3>
										<Button
											variant="ghost"
											onClick={handleSelectAll}
											className="w-full rounded-md font-mono text-xs uppercase tracking-wider text-muted-foreground hover:text-primary hover:bg-primary/10 justify-start gap-2 h-9"
										>
											<CheckSquare className="w-4 h-4" />
											{selectedCount.value === ordinalOutpoints.length ? "Clear Selection" : "Select All"}
											{selectedCount.value > 0 && (
												<Badge className="ml-auto rounded-md bg-primary/20 text-primary border-primary/50 font-mono text-[10px] h-5 px-1.5">
													{selectedCount.value}
												</Badge>
											)}
										</Button>
									</div>
								</>
							)}
						</>
					)}

					{/* Token-specific filters (BSV20/BSV21) */}
					{isTokenPage && (
						<div>
							<h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
								BALANCE_FILTER
							</h3>
							<div className="space-y-1">
								{BALANCE_FILTERS.map(({ id, label, icon: Icon }) => {
									// Hide Unindexed for BSV21
									if (id === BalanceFilter.Unindexed && isBsv21) return null;
									
									const isActive = selectedBalanceFilter.value === id;
									return (
										<button
											key={id}
											type="button"
											onClick={() => { selectedBalanceFilter.value = id; }}
											className={cn(
												"w-full flex items-center justify-between px-3 py-2.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all",
												isActive
													? "bg-primary/10 text-primary border-l-2 border-primary"
													: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
											)}
										>
											<span className="flex items-center gap-2">
												<Icon className="w-4 h-4" />
												{label}
											</span>
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>
			</ScrollArea>

			{/* Footer */}
			<div className="px-4 md:px-6 py-4 border-t border-border">
				<div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					<span>1SAT_WALLET</span>
					<span className="text-primary">v2.0</span>
				</div>
			</div>
		</div>
	);
}

