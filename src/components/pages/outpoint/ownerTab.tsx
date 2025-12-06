"use client";
import { useSignals } from "@preact/signals-react/runtime";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ordAddress } from "@/signals/wallet/address";
import { OutpointTab } from "./tabs";

const buttonClasses = (isActive: boolean) =>
	`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition ${
		isActive
			? "border-border bg-card text-foreground shadow-sm"
			: "border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground"
	}`;

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
		isClient &&
		owner === ordAddress.value && (
			<button
				type="button"
				role="tab"
				aria-selected={activeTab === OutpointTab.Owner}
				className={buttonClasses(activeTab === OutpointTab.Owner)}
				onClick={handleClick}
			>
				Owner
			</button>
		)
	);
};

export default OwnerTab;
