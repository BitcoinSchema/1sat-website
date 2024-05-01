"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export enum Tab {
	Market = "market",
	Items = "items",
}

export const CollectionNavigation = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const tab = searchParams.get("tab") ?? Tab.Market;
	const pathname = usePathname();

	const navigateToTab = (tab: Tab) => {
		const newSearchParams = new URLSearchParams(searchParams.toString());
		newSearchParams.set("tab", tab);

		router.push(`${pathname}?${newSearchParams.toString()}`);
	};

	return (
		<div
			role="tablist"
			className="tabs tabs-bordered max-w-[980px] mx-auto mb-12 sm:mb-16 font-mono"
		>
			<button
				type="button"
				role="tab"
				onClick={() => navigateToTab(Tab.Market)}
				className={`tab ${tab === Tab.Market ? "tab-active" : ""}`}
			>
				Market
			</button>
			<button
				type="button"
				role="tab"
				onClick={() => navigateToTab(Tab.Items)}
				className={`tab ${tab === Tab.Items ? "tab-active" : ""}`}
			>
				Items
			</button>
		</div>
	);
};
