"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { ArtifactType } from "../artifact";
import { selectedType } from "./filter";

interface FilterSidebarProps {
	counts: Record<string, number>;
	ordinalOutpoints?: string[];
}

const ARTIFACT_FILTERS = [
	{ type: ArtifactType.All, icon: Hash, label: "All Assets" },
	{ type: ArtifactType.Image, icon: ImageIcon, label: "Images" },
	{ type: ArtifactType.Video, icon: Video, label: "Videos" },
	{ type: ArtifactType.Audio, icon: Music, label: "Audio" },
	{ type: ArtifactType.Model, icon: Box, label: "3D Models" },
	{ type: ArtifactType.Text, icon: FileCode, label: "Text / Code" },
] as const;

export default function FilterSidebar({ counts, ordinalOutpoints = [] }: FilterSidebarProps) {
	useSignals();

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

	return (
		<div className="flex flex-col h-full bg-background border-r border-border w-[280px] min-w-[280px]">
			{/* Header - matches main header padding */}
			<div className="px-4 md:px-6 py-4 border-b border-border">
				<h2 className="font-mono text-xs uppercase tracking-widest text-primary mb-3">
					INVENTORY_FILTER
				</h2>

				{/* Search */}
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

			{/* Scrollable Filter Area */}
			<ScrollArea className="flex-1">
				<div className="px-4 md:px-6 py-4 space-y-6">
					{/* Artifact Types Section */}
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
										onClick={() => {
											selectedType.value = type;
										}}
										className={`
											w-full flex items-center justify-between px-3 py-2.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all
											${isActive
												? "bg-primary/10 text-primary border-r-2 border-primary"
												: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
											}
										`}
									>
										<span className="flex items-center gap-2">
											<Icon className="w-4 h-4" />
											{label}
										</span>
										{type === ArtifactType.All && (
											<Badge
												variant="outline"
												className="rounded-md border-border text-muted-foreground font-mono text-[10px] h-5 px-1.5"
											>
												{counts.total || 0}
											</Badge>
										)}
									</button>
								);
							})}
						</div>
					</div>

					<Separator className="bg-border" />

					{/* Special Protocols Section */}
					<div>
						<h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
							PROTOCOLS
						</h3>
						<div className="space-y-1">
							{/* Theme Filter */}
							{(counts.theme ?? 0) > 0 && (
								<button
									type="button"
									onClick={() => {
										selectedType.value = "theme" as ArtifactType;
									}}
									className={`
										w-full flex items-center justify-between px-3 py-2.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all
										${selectedType.value === ("theme" as ArtifactType)
											? "bg-accent/20 text-accent border-r-2 border-accent"
											: "text-accent/70 hover:text-accent hover:bg-accent/10"
										}
									`}
								>
									<span className="flex items-center gap-2">
										<Palette className="w-4 h-4" />
										Themes
									</span>
									<Badge
										variant="outline"
										className="rounded-md border-accent/50 text-accent font-mono text-[10px] h-5 px-1.5"
									>
										{counts.theme}
									</Badge>
								</button>
							)}
						</div>
					</div>

					<Separator className="bg-border" />

					{/* Selection Actions */}
					{ordinalOutpoints.length > 0 && (
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
					)}
				</div>
			</ScrollArea>

			{/* Footer Stats */}
			<div className="px-4 md:px-6 py-4 border-t border-border">
				<div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					<span>TOTAL_ITEMS</span>
					<span className="text-primary">{counts.total || 0}</span>
				</div>
			</div>
		</div>
	);
}
