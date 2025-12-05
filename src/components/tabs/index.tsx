"use client";

import Link from "next/link";
import { FaHandshakeAngle } from "react-icons/fa6";
import { GiChisel } from "react-icons/gi";

interface Props {
	showIndicator?: boolean;
	className?: string;
}

import { usePathname } from "next/navigation";

export enum Tab {
	Overview = "overview",
	Activity = "activity",
	Listings = "listings",
}

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
			className={`p-4 md:p-1 w-auto font-medium gap-4 tabs uppercase rounded-none md:rounded tabs-boxed ${className}`}
		>
			<Link
				className={`hover:bg-black/25 tab text-lg ${
					currentTab === Tab.Activity ? "tab-active" : ""
				}`}
				role="tab"
				href={`/activity`}
			>
				<GiChisel className="w-5 h-5 mr-2" /> Activity
			</Link>

			<Link
				className={`hover:bg-black/25 tab text-lg ${
					currentTab === Tab.Listings ? "tab-active" : ""
				}`}
				role="tab"
				href={`/listings`}
			>
				<FaHandshakeAngle className="w-5 h-5 mr-2" /> Listings
			</Link>
		</div>
	);
};

export default Tabs;
