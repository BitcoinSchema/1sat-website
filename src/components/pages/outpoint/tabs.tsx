"use client";

import { ordAddress } from "@/signals/wallet/address";
import { OutpointTab } from "@/types/common";
import { computed } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import Link from "next/link";

interface Props {
	outpoint: string;
	activeTab: OutpointTab;
	hasToken: boolean;
	isListing: boolean;
	isCollection: boolean;
	owner?: string;
}

const OutpointTabs = ({
	outpoint,
	activeTab,
	hasToken,
	isListing,
	isCollection,
	owner,
}: Props) => {
	useSignals();
	const isOwner = computed(
		() => ordAddress.value && owner === ordAddress.value,
	);

	return (
		<div role="tablist" className={"tabs tabs-bordered mb-4 font-mono"}>
			{isOwner.value && (
				<Link
					role="tab"
					href={`/outpoint/${outpoint}/owner`}
					className={`tab ${
						activeTab === OutpointTab.Owner ? "tab-active" : ""
					}`}
				>
					Owner
				</Link>
			)}
			<Link
				role="tab"
				href={`/outpoint/${outpoint}/timeline`}
				className={`tab ${
					activeTab === OutpointTab.Timeline ? "tab-active" : ""
				}`}
			>
				Timeline
			</Link>
			<Link
				role="tab"
				href={`/outpoint/${outpoint}/inscription`}
				className={`tab ${
					activeTab === OutpointTab.Inscription ? "tab-active" : ""
				}`}
			>
				Details
			</Link>
			{hasToken && (
				<Link
					role="tab"
					href={`/outpoint/${outpoint}/token`}
					className={`tab ${
						activeTab === OutpointTab.Token ? "tab-active" : ""
					}`}
				>
					Token
				</Link>
			)}
			{isListing && (
				<Link
					role="tab"
					href={`/outpoint/${outpoint}/listing`}
					className={`tab ${
						activeTab === OutpointTab.Listing ? "tab-active" : ""
					}`}
				>
					Listing
				</Link>
			)}
			{isCollection && (
				<Link
					role="tab"
					href={`/outpoint/${outpoint}/collection`}
					className={`tab ${
						activeTab === OutpointTab.Collection ? "tab-active" : ""
					}`}
				>
					Collection
				</Link>
			)}
		</div>
	);
};

export default OutpointTabs;
