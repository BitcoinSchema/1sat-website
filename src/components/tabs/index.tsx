"use client";

import Link from "next/link";
import { FaHandshakeAngle } from "react-icons/fa6";
import { GiChisel } from "react-icons/gi";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Props {
	showIndicator?: boolean;
	className?: string;
}

export enum Tab {
	Overview = "overview",
	Activity = "activity",
	Listings = "listings",
}

const tabStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-lg font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted/50";
const activeTabStyles = "bg-background text-foreground shadow";
const inactiveTabStyles = "text-muted-foreground";

const Tabs = ({ showIndicator, className }: Props) => {
	const path = usePathname();
	let currentTab: Tab | undefined;

	if (path === "/") {
		currentTab = Tab.Overview;
	} else if (path === "/activity") {
		currentTab = Tab.Activity;
	} else if (path === "/listings") {
		currentTab = Tab.Listings;
	}

	return (
		<div
			role="tablist"
			className={cn(
				"inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-muted p-1 text-muted-foreground uppercase",
				className
			)}
		>
			<Link
				className={cn(tabStyles, currentTab === Tab.Activity ? activeTabStyles : inactiveTabStyles)}
				role="tab"
				href={`/activity`}
			>
				<GiChisel className="w-5 h-5 mr-2" /> Activity
			</Link>

			<Link
				className={cn(tabStyles, currentTab === Tab.Listings ? activeTabStyles : inactiveTabStyles)}
				role="tab"
				href={`/listings`}
			>
				<FaHandshakeAngle className="w-5 h-5 mr-2" /> Listings
			</Link>
		</div>
	);
};

export default Tabs;
