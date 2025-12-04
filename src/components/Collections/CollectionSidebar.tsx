"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import {
	Library,
	TrendingUp,
	Star,
	Search,
	X,
	Sparkles,
	Grid3X3,
	LayoutGrid,
	ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Signals for collection filtering
export const collectionSearch = signal("");
export const collectionView = signal<"featured" | "all">("featured");

interface CollectionSidebarProps {
	showBackLink?: boolean;
	collectionName?: string;
}

const NAV_ITEMS = [
	{ id: "featured", label: "Featured", icon: Star, href: "/collection" },
	{ id: "trending", label: "Trending", icon: TrendingUp, href: "/collection?sort=trending" },
] as const;

export default function CollectionSidebar({ 
	showBackLink,
	collectionName 
}: CollectionSidebarProps) {
	useSignals();
	const pathname = usePathname();

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		collectionSearch.value = e.target.value;
	};

	const handleClearSearch = () => {
		collectionSearch.value = "";
	};

	const isDetailPage = pathname.includes("/collection/") && pathname !== "/collection";

	return (
		<div className="flex flex-col h-full bg-background border-r border-border w-[280px] min-w-[280px]">
			{/* Header */}
			<div className="px-4 md:px-6 py-4 border-b border-border">
				<h2 className="font-mono text-xs uppercase tracking-widest text-primary mb-1">
					COLLECTIONS
				</h2>
				<p className="text-[10px] text-muted-foreground uppercase tracking-wider">
					{isDetailPage && collectionName ? collectionName : "NFT Collections"}
				</p>
			</div>

			{/* Scrollable Content */}
			<ScrollArea className="flex-1">
				<div className="px-4 md:px-6 py-4 space-y-6">
					{/* Back to Collections (on detail pages) */}
					{showBackLink && (
						<>
							<Button
								asChild
								variant="ghost"
								className="w-full rounded-md font-mono text-xs uppercase tracking-wider justify-start gap-2 h-10 text-muted-foreground hover:text-primary hover:bg-primary/10"
							>
								<Link href="/collection">
									<ArrowLeft className="w-4 h-4" />
									All Collections
								</Link>
							</Button>
							<Separator className="bg-border" />
						</>
					)}

					{/* Navigation Section */}
					{!isDetailPage && (
						<>
							<div>
								<h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
									BROWSE
								</h3>
								<div className="space-y-1">
									{NAV_ITEMS.map(({ id, label, icon: Icon, href }) => {
										const isActive = pathname === href || (pathname === "/collection" && id === "featured");
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
						</>
					)}

					{/* Search */}
					<div>
						<h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
							SEARCH
						</h3>
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
							<Input
								value={collectionSearch.value}
								onChange={handleSearch}
								placeholder="SEARCH COLLECTIONS..."
								className="pl-10 pr-8 bg-muted/50 border-border rounded-md font-mono text-xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring h-9"
							/>
							{collectionSearch.value && (
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

					{/* View Mode */}
					{!isDetailPage && (
						<div>
							<h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
								VIEW_MODE
							</h3>
							<div className="space-y-1">
								<button
									type="button"
									onClick={() => { collectionView.value = "featured"; }}
									className={cn(
										"w-full flex items-center px-3 py-2.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all",
										collectionView.value === "featured"
											? "bg-primary/10 text-primary border-l-2 border-primary"
											: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
									)}
								>
									<Sparkles className="w-4 h-4 mr-2" />
									Featured
								</button>
								<button
									type="button"
									onClick={() => { collectionView.value = "all"; }}
									className={cn(
										"w-full flex items-center px-3 py-2.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all",
										collectionView.value === "all"
											? "bg-primary/10 text-primary border-l-2 border-primary"
											: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
									)}
								>
									<LayoutGrid className="w-4 h-4 mr-2" />
									All Collections
								</button>
							</div>
						</div>
					)}

					{/* Quick Links (on detail pages) */}
					{isDetailPage && (
						<div>
							<h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
								QUICK_ACTIONS
							</h3>
							<Button
								asChild
								variant="outline"
								className="w-full rounded-md font-mono text-xs uppercase tracking-wider justify-start gap-2 h-9 border-border text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10"
							>
								<Link href="/market/ordinals">
									<Grid3X3 className="w-4 h-4" />
									Browse Market
								</Link>
							</Button>
						</div>
					)}
				</div>
			</ScrollArea>

			{/* Footer */}
			<div className="px-4 md:px-6 py-4 border-t border-border">
				<div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					<span>1SAT_COLLECTIONS</span>
					<span className="text-primary flex items-center gap-1.5">
						<Library className="w-3 h-3" />
						<span>NFT</span>
					</span>
				</div>
			</div>
		</div>
	);
}

