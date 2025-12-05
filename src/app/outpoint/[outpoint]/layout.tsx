import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import { displayName } from "@/utils/artifact";
import * as http from "@/utils/httpClient";
import { Noto_Serif } from "next/font/google";
import { notFound } from "next/navigation";
import ArtifactViewer from "@/components/pages/outpoint/ArtifactViewer";
import OutpointTabs from "@/components/pages/outpoint/tabs";
import TxDetails from "@/components/transaction";
import { Separator } from "@/components/ui/separator";

const notoSerif = Noto_Serif({
	style: "italic",
	weight: ["400", "700"],
	subsets: ["latin"],
});

export default async function OutpointLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ outpoint: string }>;
}) {
	const { outpoint } = await params;

	// Fetch artifact data once for the layout
	// Try both BSV20 and inscriptions APIs like the old code did
	let artifact: OrdUtxo | undefined;
	let bsv20: OrdUtxo | undefined;

	try {
		const url = `${API_HOST}/api/bsv20/outpoint/${outpoint}`;
		const { promise } = http.customFetch<OrdUtxo>(url);
		bsv20 = await promise;
	} catch (_e) {
		console.log("No BSV20 data (expected for non-token items)");
	}

	try {
		const url = `${API_HOST}/api/inscriptions/${outpoint}`;
		const { promise } = http.customFetch<OrdUtxo>(url);
		artifact = await promise;
	} catch (e) {
		console.error("Failed to get inscription", e);
	}

	// Use whichever one we got, preferring artifact over bsv20
	const finalArtifact = artifact || bsv20;

	if (!finalArtifact) {
		notFound();
	}

	const [txid, voutStr] = outpoint.split("_");
	const vout = Number.parseInt(voutStr, 10);

	return (
		<div className="max-w-6xl mx-auto w-full">
			<div className="mx-auto flex flex-col p-2 md:p-0 min-h-64">
				<TxDetails txid={txid} vout={vout} showing={false} />
				<h2 className={`text-2xl mb-4 ${notoSerif.className}`}>
					{displayName(finalArtifact, false)}
				</h2>
				<div className="flex flex-col md:flex-row gap-4">
					{finalArtifact?.origin?.data?.insc && (
						<div className="overflow-hidden h-[550px] relative w-fit">
							<ArtifactViewer
								artifact={finalArtifact}
								size={550}
								className="h-full"
							/>
						</div>
					)}
					{!finalArtifact?.origin?.data?.insc && (
						<div className="h-full w-full text-[#aaa] flex items-center justify-center min-h-64 bg-[#111] rounded">
							No inscription
						</div>
					)}
					<Separator className="my-2" />
					<div className="w-full mx-auto">
						<OutpointTabs
							outpoint={outpoint}
							owner={
								finalArtifact.spend || !!finalArtifact.origin?.data?.bsv20
									? undefined
									: finalArtifact?.owner
							}
							actualOwner={finalArtifact?.owner}
							hasToken={!!finalArtifact.origin?.data?.bsv20}
							isListing={!!finalArtifact.data?.list}
							isCollection={
								finalArtifact.origin?.data?.map?.subType === "collection" ||
								finalArtifact.origin?.data?.map?.subType === "collectionItem"
							}
						/>
						{children}
					</div>
				</div>
			</div>
		</div>
	);
}
