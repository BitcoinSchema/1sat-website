"use client";

import { useSignals } from "@preact/signals-react/runtime";
import {
	Box,
	FileCode,
	Hash,
	ImageIcon,
	Music,
	Plus,
	Video,
} from "lucide-react";
import Link from "next/link";
import { ArtifactType } from "@/components/artifact";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
// Use the SAME selectedType signal that OrdinalListings uses
import { selectedType } from "@/components/Wallet/filter";

const ARTIFACT_FILTERS = [
	{ type: ArtifactType.All, icon: Hash, label: "All Listings" },
	{ type: ArtifactType.Image, icon: ImageIcon, label: "Images" },
	{ type: ArtifactType.Video, icon: Video, label: "Videos" },
	{ type: ArtifactType.Audio, icon: Music, label: "Audio" },
	{ type: ArtifactType.Model, icon: Box, label: "3D Models" },
	{ type: ArtifactType.Text, icon: FileCode, label: "Text / Code" },
] as const;

export default function MarketFilterSidebar() {
	useSignals();

	const handleFilterClick = (type: ArtifactType) => {
		selectedType.value = type;
	};

	return (
		<div className="flex flex-col h-full bg-background border-r border-border w-[280px] min-w-[280px]">
			{/* Header */}
			<div className="px-4 md:px-6 py-4 border-b border-border">
				<h2 className="font-mono text-xs uppercase tracking-widest text-primary">
					MARKET_FILTER
				</h2>
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
								const isActive =
									selectedType.value === type ||
									(!selectedType.value && type === ArtifactType.All);
								return (
									<button
										key={type}
										type="button"
										onClick={() => handleFilterClick(type)}
										className={`
											w-full flex items-center justify-between px-3 py-2.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all
											${
												isActive
													? "bg-primary/10 text-primary border-r-2 border-primary"
													: "text-muted-foreground hover:text-foreground hover:bg-muted/50"
											}
										`}
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

					<Separator className="bg-border" />

					{/* Quick Actions */}
					<div>
						<h3 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
							ACTIONS
						</h3>
						<Button
							variant="outline"
							asChild
							className="w-full rounded-md font-mono text-xs uppercase tracking-wider border-border text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/10 justify-start gap-2 h-9"
						>
							<Link href="/market/ordinals/new" className="flex items-center gap-2">
								<Plus className="w-4 h-4" />
								<span className="hidden md:inline">Create Listing</span>
							</Link>
						</Button>
					</div>
				</div>
			</ScrollArea>

			{/* Footer Stats */}
			<div className="px-4 md:px-6 py-4 border-t border-border">
				<div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
					<span>MARKET_STATUS</span>
					<span className="text-primary flex items-center gap-1.5">
						<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
						ONLINE
					</span>
				</div>
			</div>
		</div>
	);
}
