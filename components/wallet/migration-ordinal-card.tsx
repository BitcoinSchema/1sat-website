"use client";

import { Badge } from "@/components/ui/badge";
import type { OrdinalWithMeta } from "@/lib/hooks/use-legacy-assets";
import { cn } from "@/lib/utils";

export interface MigrationOrdinalCardProps {
	ordinal: OrdinalWithMeta;
	isSelected: boolean;
	onToggle: () => void;
}

function isIframeType(contentType: string): boolean {
	return contentType === "image/svg+xml" || contentType.startsWith("text/html");
}

function isImageType(contentType: string): boolean {
	return contentType.startsWith("image/") && contentType !== "image/svg+xml";
}

export function MigrationOrdinalCard({
	ordinal,
	isSelected,
	onToggle,
}: MigrationOrdinalCardProps) {
	const contentType = ordinal.contentType || "";

	return (
		<div
			className={cn(
				"relative aspect-square cursor-pointer border transition-all",
				isSelected
					? "ring-2 ring-primary bg-primary/5"
					: "border-border/50 hover:border-primary/30 bg-muted/30",
			)}
			onClick={onToggle}
			onKeyDown={(e) => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					onToggle();
				}
			}}
			role="checkbox"
			aria-checked={isSelected}
			tabIndex={0}
		>
			{/* Selection checkbox */}
			<div className="absolute top-1.5 right-1.5 z-10">
				<div
					className={cn(
						"flex h-5 w-5 items-center justify-center rounded border text-[11px]",
						isSelected
							? "bg-primary border-primary text-white"
							: "border-muted-foreground/40",
					)}
				>
					{isSelected && <span>&#10003;</span>}
				</div>
			</div>

			{/* Thumbnail */}
			<div className="aspect-square overflow-hidden bg-black/20">
				{isIframeType(contentType) ? (
					<iframe
						src={ordinal.contentUrl}
						title={ordinal.name || ordinal.outpoint}
						className="h-full w-full pointer-events-none"
						sandbox="allow-scripts"
						loading="lazy"
					/>
				) : isImageType(contentType) ? (
					<img
						src={ordinal.contentUrl}
						alt={ordinal.name || ordinal.outpoint}
						className="h-full w-full object-cover"
						loading="lazy"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center text-2xl text-muted-foreground">
						&#9670;
					</div>
				)}
			</div>

			{/* Footer info */}
			<div className="absolute bottom-0 left-0 right-0 space-y-0.5 bg-background/80 p-1.5">
				<Badge variant="secondary" className="text-[10px]">
					{contentType?.split("/")[1] || "unknown"}
				</Badge>
				{ordinal.name ? (
					<p className="truncate text-[11px] font-medium">{ordinal.name}</p>
				) : (
					<p className="truncate text-[10px] font-mono text-muted-foreground">
						{ordinal.outpoint}
					</p>
				)}
			</div>
		</div>
	);
}
