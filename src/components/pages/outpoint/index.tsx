"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Artifact from "@/components/artifact";
import ArtifactViewer from "./ArtifactViewer";
import { API_HOST } from "@/constants";
import type { Listing } from "@/types/bsv20";
import type { OrdUtxo } from "@/types/ordinals";
import { displayName } from "@/utils/artifact";
import * as http from "@/utils/httpClient";
import { Noto_Serif } from "next/font/google";
import OutpointTabs, { type OutpointTab } from "./tabs";

const notoSerif = Noto_Serif({
	style: "italic",
	weight: ["400", "700"],
	subsets: ["latin"],
});

interface Props {
	artifact: OrdUtxo;
	listing?: Listing;
	history?: OrdUtxo[];
	spends?: OrdUtxo[];
	outpoint: string;
	content: JSX.Element;
	activeTab: OutpointTab;
}

const OutpointPage = ({
	artifact,
	listing,
	history,
	spends,
	outpoint,
	content: initialContent,
	activeTab: initialTab,
}: Props) => {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState(initialTab);
	const [content, setContent] = useState(initialContent);

	const handleTabChange = (tab: OutpointTab) => {
		setActiveTab(tab);
		// Update URL without full page reload
		router.push(`/outpoint/${outpoint}/${tab}`, { scroll: false });
	};

	// Update content when initialContent changes (for initial render)
	useEffect(() => {
		setContent(initialContent);
	}, [initialContent]);

	// Update activeTab when URL changes (browser back/forward)
	useEffect(() => {
		setActiveTab(initialTab);
	}, [initialTab]);

	return (
		<div className="mx-auto flex flex-col p-2 md:p-0 min-h-64">
			{artifact && (
				<>
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
						<div
							className={`w-full ${
								// activeTab === OutpointTab.Inscription ? "md:w-1/3" : "md:w-1/3"
								"w-full"
							} mx-auto`}
						>
							<OutpointTabs
								outpoint={outpoint}
								owner={
									artifact.spend ||
									!!artifact.origin?.data?.bsv20
										? undefined
										: artifact?.owner
								}
								actualOwner={artifact?.owner}
								hasToken={!!artifact.origin?.data?.bsv20}
								isListing={!!artifact.data?.list}
								isCollection={
									artifact.origin?.data?.map?.subType ===
										"collection" ||
									artifact.origin?.data?.map?.subType ===
										"collectionItem"
								}
								onTabChange={handleTabChange}
							/>
							{content}
						</div>
					</div>
				</>
			)}
			{!artifact && <div>No Artifact</div>}
		</div>
	);
};

export default OutpointPage;
