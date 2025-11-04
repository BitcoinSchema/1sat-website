"use client";
import { ordAddress } from "@/signals/wallet/address";
import { useSignals } from "@preact/signals-react/runtime";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OutpointTab } from "./tabs";

const OwnerTab: React.FC<{
	owner: string | undefined;
	activeTab: OutpointTab;
	outpoint: string;
	onTabChange?: (tab: OutpointTab) => void;
}> = ({ owner, activeTab, outpoint, onTabChange }) => {
	useSignals();
	const router = useRouter();

	// Track if we're on the client to avoid hydration mismatch
	const [isClient, setIsClient] = useState(false);
	useEffect(() => {
		setIsClient(true);
	}, []);

	const handleClick = () => {
		if (onTabChange) {
			onTabChange(OutpointTab.Owner);
		} else {
			router.push(`/outpoint/${outpoint}/owner`);
		}
	};

	return (
		isClient && owner === ordAddress.value && (
			<button
				type="button"
				role="tab"
				className={`tab ${
					activeTab === OutpointTab.Owner ? "tab-active" : ""
				}`}
				onClick={handleClick}
			>
				Owner
			</button>
		)
	);
};

export default OwnerTab;
