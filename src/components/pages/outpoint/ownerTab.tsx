"use client";
import { ordAddress } from "@/signals/wallet/address";
import { useSignals } from "@preact/signals-react/runtime";
import Link from "next/link";
import { OutpointTab } from "./tabs";

const OwnerTab: React.FC<{
	owner: string | undefined;
	activeTab: OutpointTab;
	outpoint: string;
}> = ({ owner, activeTab, outpoint }) => {
	useSignals();
	return (
		owner === ordAddress.value && (
			<Link
				role="tab"
				href={`/outpoint/${outpoint}/owner`}
				className={`tab ${
					activeTab === OutpointTab.Owner ? "tab-active" : ""
				}`}
			>
				Owner
			</Link>
		)
	);
};

export default OwnerTab;
