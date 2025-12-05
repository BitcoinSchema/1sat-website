"use client";

import { useState, } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ArtifactViewer from "./ArtifactViewer";
import type { OrdUtxo } from "@/types/ordinals";
import { displayName } from "@/utils/artifact";
import { Noto_Serif } from "next/font/google";
import type { OutpointTab } from "./tabs";
import { FaSpinner } from "react-icons/fa";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

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
	const _searchParams = useSearchParams();
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
				<Separator className="my-2" />
				<div className="w-full mx-auto">
					<Tabs
						value={activeTab}
						onValueChange={(tab) => handleTabChange(tab as OutpointTab)}
						className="w-full"
					>
						<TabsList className="mb-4 font-mono">
							{tabs.map((tab) => (
								<TabsTrigger key={tab.id} value={tab.id}>
									{tab.label}
								</TabsTrigger>
							))}
						</TabsList>
						{tabs.map((tab) => (
							<TabsContent
								key={tab.id}
								value={tab.id}
								className="min-h-64"
							>
								{isLoadingTab ? (
									<div className="flex items-center justify-center p-8">
										<FaSpinner className="animate-spin text-2xl" />
									</div>
								) : (
									tab.component && <tab.component outpoint={outpoint} />
								)}
							</TabsContent>
						))}
					</Tabs>
				</div>
			</div>
		</div>
	);
};

export default ClientOutpointPage;
