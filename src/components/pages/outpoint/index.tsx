"use client";

import { Noto_Serif } from "next/font/google";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Listing } from "@/types/bsv20";
import type { OrdUtxo } from "@/types/ordinals";
import { displayName } from "@/utils/artifact";
import ArtifactViewer from "./ArtifactViewer";
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
	const [_activeTab, setActiveTab] = useState(initialTab);
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
		<div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6 lg:p-8">
			{artifact && (
				<>
					<h2
						className={`text-3xl font-semibold leading-tight text-foreground ${notoSerif.className}`}
					>
						{displayName(artifact, false)}
					</h2>
					<div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
						<div className="rounded-lg border border-border bg-card shadow-sm">
							{artifact?.origin?.data?.insc ? (
								<div className="relative overflow-hidden rounded-lg">
									<ArtifactViewer
										artifact={artifact}
										size={560}
										className="h-full w-full"
									/>
								</div>
							) : (
								<div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed border-border bg-muted/50 text-sm text-muted-foreground">
									No inscription
								</div>
							)}
						</div>

						<div className="rounded-lg border border-border bg-card shadow-sm">
							<div className="border-b border-border px-4 py-3">
								<OutpointTabs
									outpoint={outpoint}
									owner={
										artifact.spend || !!artifact.origin?.data?.bsv20
											? undefined
											: artifact?.owner
									}
									actualOwner={artifact?.owner}
									hasToken={!!artifact.origin?.data?.bsv20}
									isListing={!!artifact.data?.list}
									isCollection={
										artifact.origin?.data?.map?.subType === "collection" ||
										artifact.origin?.data?.map?.subType === "collectionItem"
									}
									onTabChange={handleTabChange}
								/>
							</div>
							<div className="px-4 py-5">{content}</div>
						</div>
					</div>
				</>
			)}
			{!artifact && (
				<div className="rounded-lg border border-border bg-card p-6 text-muted-foreground">
					No Artifact
				</div>
			)}
		</div>
	);
};

export default OutpointPage;
