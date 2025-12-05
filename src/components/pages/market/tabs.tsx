"use client";

import { AssetType } from "@/constants";
import Link from "next/link";
import { currencyDisplay, CurrencyDisplay } from "@/signals/wallet";
import { Button } from "@/components/ui/button";
import { Plus, Bitcoin, DollarSign } from "lucide-react";
import clsx from "clsx";

const CurrencySwitch = () => {
	return (
		<button
			type="button"
			onClick={() => {
				currencyDisplay.value = currencyDisplay.value === "USD" ? "BSV" : "USD";
			}}
			className="flex items-center justify-center w-8 h-8 mr-4 text-muted-foreground hover:text-primary transition-colors"
			title="Toggle Currency Display"
		>
			{currencyDisplay.value === CurrencyDisplay.BSV ? (
				<Bitcoin className="w-5 h-5 -rotate-12" />
			) : (
				<DollarSign className="w-5 h-5" />
			)}
		</button>
	);
};

const MarketTabs = ({ selectedTab }: { selectedTab: AssetType }) => {
	return (
		<div className="flex w-full items-center justify-between border-b border-border bg-background">
			<div role="tablist" className="flex">
				<Link
					href={`/market/${AssetType.Ordinals}`}
					role="tab"
					className={clsx(
						"px-6 py-3 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 -mb-[1px]",
						{
							"border-primary text-primary": selectedTab === AssetType.Ordinals,
							"border-transparent text-muted-foreground hover:text-foreground": selectedTab !== AssetType.Ordinals,
						}
					)}
					aria-label="Ordinals"
				>
					Ordinals
				</Link>

				<Link
					href={`/market/${AssetType.BSV20}`}
					role="tab"
					className={clsx(
						"px-6 py-3 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 -mb-[1px]",
						{
							"border-primary text-primary": selectedTab === AssetType.BSV20,
							"border-transparent text-muted-foreground hover:text-foreground": selectedTab !== AssetType.BSV20,
						}
					)}
					aria-label="BSV20"
				>
					BSV20
				</Link>

				<Link
					href={`/market/${AssetType.BSV21}`}
					role="tab"
					className={clsx(
						"px-6 py-3 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 -mb-[1px]",
						{
							"border-primary text-primary": selectedTab === AssetType.BSV21,
							"border-transparent text-muted-foreground hover:text-foreground": selectedTab !== AssetType.BSV21,
						}
					)}
					aria-label="BSV21"
				>
					BSV21
				</Link>
			</div>

			<div className="flex items-center pr-4">
				{(selectedTab === AssetType.BSV21 || selectedTab === AssetType.BSV20) && <CurrencySwitch />}
				{selectedTab === AssetType.Ordinals && (
					<Button asChild size="sm" className="rounded-md">
						<Link href={`/market/${selectedTab}/new`}>
							<Plus className="w-4 h-4 mr-2" />
							List
						</Link>
					</Button>
				)}
			</div>
		</div>
	);
};

export default MarketTabs;
