import type { AssetType } from "@/constants";
import Link from "next/link";
import { FaPlus } from "react-icons/fa6";
import Filter from "./filter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export enum WalletTab {
	Ordinals = "ordinals",
	BSV20 = "bsv20",
	BSV21 = "bsv21",
	History = "history",
}

const WalletTabs = ({
	type,
	address,
}: {
	type: WalletTab | AssetType;
	address?: string;
}) => {
	const tabs = [
		{ id: WalletTab.Ordinals, label: "Ordinals" },
		{ id: WalletTab.BSV20, label: "BSV20" },
		{ id: WalletTab.BSV21, label: "BSV21" },
	];

	return (
		<div className="flex items-center justify-between py-4 px-4 border-b border-border mb-6">
			<div className="flex space-x-1">
				{tabs.map((tab) => {
					const isActive = type === tab.id;
					return (
						<Link
							key={tab.id}
							href={
								address
									? `/activity/${address}/${tab.id}`
									: `/wallet/${tab.id}`
							}
							className={cn(
								"px-4 py-2 text-sm font-mono uppercase tracking-wider transition-colors rounded-md",
								isActive
									? "bg-primary/10 text-primary font-bold"
									: "text-muted-foreground hover:text-foreground hover:bg-muted"
							)}
						>
							{tab.label}
						</Link>
					);
				})}
			</div>
			
			<div className="flex items-center gap-2">
				{type === WalletTab.Ordinals && <Filter />}
				<Button
					asChild
					variant="outline"
					size="sm"
					className="gap-2"
				>
					<Link
						href={`/inscribe?tab=${
							type === WalletTab.Ordinals ? "image" : type
						}`}
					>
						<FaPlus className="w-3 h-3" />
						<span>Mint</span>
					</Link>
				</Button>
			</div>
		</div>
	);
};

export default WalletTabs;
