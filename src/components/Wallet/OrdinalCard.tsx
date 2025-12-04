"use client";

import Artifact from "@/components/artifact";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	isThemeToken,
	selectedOutpoints,
	toggleSelection,
} from "@/signals/wallet/selection";
import type { OrdUtxo } from "@/types/ordinals";
import { useSignals } from "@preact/signals-react/runtime";
import { Palette } from "lucide-react";

interface OrdinalCardProps {
	ord: OrdUtxo;
	onApplyTheme?: (ord: OrdUtxo) => void;
	onClick?: (outpoint: string) => void;
}

export const OrdinalCard = ({
	ord,
	onApplyTheme,
	onClick,
}: OrdinalCardProps) => {
	useSignals();

	const outpoint = ord.outpoint;
	const isSelected = selectedOutpoints.value.has(outpoint);
	const isTheme = isThemeToken(ord);
	const fileType =
		ord.origin?.data?.insc?.file?.type?.split("/")?.[1]?.toUpperCase() ||
		"FILE";
	const inscNum = ord.origin?.num || ord.origin?.inum || "PENDING";

	const handleCheckboxChange = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		toggleSelection(outpoint);
	};

	const handleApplyTheme = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();
		onApplyTheme?.(ord);
	};

	return (
		<div className="group relative">
			<Card
				className={`
          relative overflow-hidden rounded-none border-2 transition-all duration-200 bg-zinc-950
          ${
						isSelected
							? "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)]"
							: isTheme
								? "border-zinc-800 hover:border-purple-500/50"
								: "border-zinc-800 hover:border-zinc-600"
					}
        `}
			>
				{/* Selection Checkbox - Visible on hover or selected */}
				<div
					className={`absolute top-2 left-2 z-20 transition-opacity duration-200 ${
						isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
					}`}
					onClick={handleCheckboxChange}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							toggleSelection(outpoint);
						}
					}}
				>
					<div className="bg-zinc-950/80 p-0.5">
						<Checkbox
							checked={isSelected}
							className="rounded-none border-zinc-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 w-5 h-5"
						/>
					</div>
				</div>

				{/* Theme Indicator Badge */}
				{isTheme && (
					<div className="absolute top-2 right-2 z-10">
						<Badge className="rounded-none bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30 font-mono text-[10px] uppercase">
							THEME
						</Badge>
					</div>
				)}

				{/* Content Area */}
				<CardContent className="p-0 aspect-square bg-zinc-900 relative flex items-center justify-center overflow-hidden">
					<Artifact
						artifact={ord}
						to={onClick ? undefined : `/outpoint/${outpoint}`}
						onClick={onClick ? () => onClick(outpoint) : undefined}
						classNames={{
							wrapper: "w-full h-full",
							media: "object-cover",
						}}
						sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
						size={200}
						showFooter={false}
						priority={false}
					/>
				</CardContent>

				{/* Footer Info */}
				<CardFooter className="flex flex-col items-start gap-2 p-3 border-t border-zinc-800 bg-zinc-950">
					<div className="flex w-full justify-between items-center">
						<span className="font-mono text-xs text-zinc-500 truncate max-w-[100px]">
							#{inscNum}
						</span>
						<Badge
							variant="outline"
							className="rounded-none text-[10px] text-zinc-600 border-zinc-800 uppercase"
						>
							{fileType}
						</Badge>
					</div>

					{/* Theme Action Button */}
					{isTheme && onApplyTheme && (
						<Button
							size="sm"
							variant="outline"
							onClick={handleApplyTheme}
							className="w-full h-7 mt-1 rounded-none border-purple-900/50 text-purple-400 hover:bg-purple-900/20 hover:text-purple-300 font-mono text-[10px] uppercase tracking-wider"
						>
							<Palette className="w-3 h-3 mr-2" />
							Apply Theme
						</Button>
					)}
				</CardFooter>
			</Card>
		</div>
	);
};

export default OrdinalCard;
