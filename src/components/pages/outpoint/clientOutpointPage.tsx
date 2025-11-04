"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Artifact from "@/components/artifact";
import ArtifactViewer from "./ArtifactViewer";
import type { OrdUtxo } from "@/types/ordinals";
import { displayName } from "@/utils/artifact";
import { Noto_Serif } from "next/font/google";
import { OutpointTab } from "./tabs";
import { FaSpinner } from "react-icons/fa";

const notoSerif = Noto_Serif({
	style: "italic",
	weight: ["400", "700"],
	subsets: ["latin"],
});

interface Tab {
	id: OutpointTab;
	label: string;
	component: React.ComponentType<{ outpoint: string }>;
}

interface Props {
	artifact: OrdUtxo;
	outpoint: string;
	initialTab: OutpointTab;
	tabs: Tab[];
}

const ClientOutpointPage = ({ artifact, outpoint, initialTab, tabs }: Props) => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [activeTab, setActiveTab] = useState<OutpointTab>(initialTab);
	const [isLoadingTab, setIsLoadingTab] = useState(false);

	const handleTabChange = (tab: OutpointTab) => {
		setIsLoadingTab(true);
		setActiveTab(tab);

		// Update URL without full page reload
		const url = `/outpoint/${outpoint}/${tab}`;
		router.push(url, { scroll: false });

		// Reset loading after component mounts
		setTimeout(() => setIsLoadingTab(false), 100);
	};

	const ActiveTabComponent = tabs.find(t => t.id === activeTab)?.component;

	return (
		<div className="mx-auto flex flex-col p-2 md:p-0 min-h-64">
			<h2 className={`text-2xl mb-4  ${notoSerif.className}`}>
				{displayName(artifact, false)}
			</h2>
			<div className="flex flex-col md:flex-row gap-4">
				{artifact?.origin?.data?.insc && (
					<div className="overflow-hidden h-[550px] relative w-fit">
						<ArtifactViewer
							artifact={artifact}
							size={550}
							className="h-full"
						/>
					</div>
				)}
				{!artifact?.origin?.data?.insc && (
					<div className="h-full w-full text-[#aaa] flex items-center justify-center min-h-64 bg-[#111] rounded">
						No inscription
					</div>
				)}
				<div className="divider" />
				<div className="w-full mx-auto">
					{/* Tab Navigation */}
					<div role="tablist" className="tabs tabs-bordered mb-4 font-mono">
						{tabs.map((tab) => (
							<button
								key={tab.id}
								type="button"
								role="tab"
								onClick={() => handleTabChange(tab.id)}
								className={`tab ${activeTab === tab.id ? "tab-active" : ""}`}
							>
								{tab.label}
							</button>
						))}
					</div>

					{/* Tab Content */}
					<div className="min-h-64">
						{isLoadingTab ? (
							<div className="flex items-center justify-center p-8">
								<FaSpinner className="animate-spin text-2xl" />
							</div>
						) : (
							ActiveTabComponent && <ActiveTabComponent outpoint={outpoint} />
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ClientOutpointPage;
