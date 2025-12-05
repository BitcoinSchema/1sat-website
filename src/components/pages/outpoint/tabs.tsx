"use client";

import { useSignals } from "@preact/signals-react/runtime";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from "react";
import { ordAddress } from "@/signals/wallet/address";
import OwnerTab from "./ownerTab";

export enum OutpointTab {
	Timeline = "timeline",
	Inscription = "inscription",
	Token = "token",
	Listing = "listing",
	Collection = "collection",
	Owner = "owner",
}

interface Props {
	outpoint: string;
	hasToken: boolean;
	isListing: boolean;
	isCollection: boolean;
	owner: string | undefined;
	actualOwner: string | undefined;
	onTabChange?: (tab: OutpointTab) => void;
}

const OutpointTabs = ({
	outpoint,
	hasToken,
	isListing,
	owner,
	actualOwner,
	isCollection,
	onTabChange,
}: Props) => {
	useSignals();
	const router = useRouter();
	const pathname = usePathname();

	// Check if the current user is the owner
	const isOwner =
		actualOwner && ordAddress.value && actualOwner === ordAddress.value;

	// Show listing tab if it's a listing OR if the user owns it (so they can create a listing)
	const showListingTab = isListing || isOwner;

	// Derive active tab from URL pathname
	const activeTab = useMemo(() => {
		const segments = pathname.split("/");
		const tabSegment = segments[segments.length - 1];
		return (tabSegment as OutpointTab) || OutpointTab.Timeline;
	}, [pathname]);

	const handleTabClick = (tab: OutpointTab) => {
		if (onTabChange) {
			onTabChange(tab);
		} else {
			// Fallback to router if no handler provided
			router.push(`/outpoint/${outpoint}/${tab}`);
		}
	};

	const buttonClasses = (isActive: boolean) =>
		`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
			isActive
				? "border-border bg-card text-foreground shadow-sm"
				: "border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
		}`;

	return (
		<div
			role="tablist"
			className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-1 font-mono"
		>
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === OutpointTab.Timeline}
				className={buttonClasses(activeTab === OutpointTab.Timeline)}
				onClick={() => handleTabClick(OutpointTab.Timeline)}
			>
				Timeline
			</button>
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === OutpointTab.Inscription}
				className={buttonClasses(activeTab === OutpointTab.Inscription)}
				onClick={() => handleTabClick(OutpointTab.Inscription)}
			>
				Details
			</button>
			{hasToken && (
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === OutpointTab.Token}
					className={buttonClasses(activeTab === OutpointTab.Token)}
					onClick={() => handleTabClick(OutpointTab.Token)}
				>
					Token
				</button>
			)}
			<OwnerTab
				owner={owner}
				outpoint={outpoint}
				activeTab={activeTab}
				onTabChange={onTabChange}
			/>
			{showListingTab && (
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === OutpointTab.Listing}
					className={buttonClasses(activeTab === OutpointTab.Listing)}
					onClick={() => handleTabClick(OutpointTab.Listing)}
				>
					Listing
				</button>
			)}
			{isCollection && (
				<button
					type="button"
					role="tab"
					aria-selected={activeTab === OutpointTab.Collection}
					className={buttonClasses(activeTab === OutpointTab.Collection)}
					onClick={() => handleTabClick(OutpointTab.Collection)}
				>
					Collection
				</button>
			)}
		</div>
	);
};

export default OutpointTabs;
