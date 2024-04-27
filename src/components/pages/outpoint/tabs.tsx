import Link from "next/link";
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
	activeTab: OutpointTab;
	hasToken: boolean;
	isListing: boolean;
	isCollection: boolean;
	owner: string | undefined;
}

const OutpointTabs = ({
	outpoint,
	activeTab,
	hasToken,
	isListing,
	owner,
	isCollection,
}: Props) => {
	return (
		<div role="tablist" className={"tabs tabs-bordered mb-4 font-mono"}>
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
			<OwnerTab owner={owner} outpoint={outpoint} activeTab={activeTab} />
			{
				<Link
					role="tab"
					href={`/outpoint/${outpoint}/listing`}
					className={`tab ${
						activeTab === OutpointTab.Listing ? "tab-active" : ""
					}`}
				>
					Listing
				</Link>
			}
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
