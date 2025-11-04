"use client";

import { useRouter, usePathname } from "next/navigation";
import { useMemo } from "react";
import { useSignals } from "@preact/signals-react/runtime";
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
	const isOwner = actualOwner && ordAddress.value && actualOwner === ordAddress.value;

	// Show listing tab if it's a listing OR if the user owns it (so they can create a listing)
	const showListingTab = isListing || isOwner;

	// Derive active tab from URL pathname
	const activeTab = useMemo(() => {
		const segments = pathname.split('/');
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

	return (
		<div role="tablist" className={"tabs tabs-bordered mb-4 font-mono"}>
			<button
				type="button"
				role="tab"
				className={`tab ${
					activeTab === OutpointTab.Timeline ? "tab-active" : ""
				}`}
				onClick={() => handleTabClick(OutpointTab.Timeline)}
			>
				Timeline
			</button>
			<button
				type="button"
				role="tab"
				className={`tab ${
					activeTab === OutpointTab.Inscription ? "tab-active" : ""
				}`}
				onClick={() => handleTabClick(OutpointTab.Inscription)}
			>
				Details
			</button>
			{hasToken && (
				<button
					type="button"
					role="tab"
					className={`tab ${
						activeTab === OutpointTab.Token ? "tab-active" : ""
					}`}
					onClick={() => handleTabClick(OutpointTab.Token)}
				>
					Token
				</button>
			)}
			<OwnerTab owner={owner} outpoint={outpoint} activeTab={activeTab} onTabChange={onTabChange} />
			{showListingTab && (
				<button
					type="button"
					role="tab"
					className={`tab ${
						activeTab === OutpointTab.Listing ? "tab-active" : ""
					}`}
					onClick={() => handleTabClick(OutpointTab.Listing)}
				>
					Listing
				</button>
			)}
			{isCollection && (
				<button
					type="button"
					role="tab"
					className={`tab ${
						activeTab === OutpointTab.Collection ? "tab-active" : ""
					}`}
					onClick={() => handleTabClick(OutpointTab.Collection)}
				>
					Collection
				</button>
			)}
		</div>
	);
};

export default OutpointTabs;
