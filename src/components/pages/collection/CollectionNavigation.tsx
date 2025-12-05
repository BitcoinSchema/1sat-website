"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { ShoppingBag, Grid3X3 } from "lucide-react";

export enum Tab {
	Market = "market",
	Items = "items",
}

export const CollectionNavigation = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const tab = searchParams.get("tab") ?? Tab.Market;
	const pathname = usePathname();

	const navigateToTab = (newTab: Tab) => {
		const newSearchParams = new URLSearchParams(searchParams.toString());
		newSearchParams.set("tab", newTab);
		router.push(`${pathname}?${newSearchParams.toString()}`);
	};

	return (
		<div className="flex w-full items-center bg-background px-4 md:px-6">
			<div role="tablist" className="flex">
				<button
					type="button"
					role="tab"
					onClick={() => navigateToTab(Tab.Market)}
					className={cn(
						"flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 -mb-[1px]",
						tab === Tab.Market
							? "border-primary text-primary"
							: "border-transparent text-muted-foreground hover:text-foreground"
					)}
				>
					<ShoppingBag className="w-4 h-4" />
					Market
				</button>
				<button
					type="button"
					role="tab"
					onClick={() => navigateToTab(Tab.Items)}
					className={cn(
						"flex items-center gap-2 px-6 py-3 font-mono text-xs uppercase tracking-wider transition-colors border-b-2 -mb-[1px]",
						tab === Tab.Items
							? "border-primary text-primary"
							: "border-transparent text-muted-foreground hover:text-foreground"
					)}
				>
					<Grid3X3 className="w-4 h-4" />
					Items
				</button>
			</div>
		</div>
	);
};
