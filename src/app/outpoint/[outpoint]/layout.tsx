import { Noto_Serif } from "next/font/google";
import { notFound } from "next/navigation";
import ArtifactViewer from "@/components/pages/outpoint/ArtifactViewer";
import OutpointTabs from "@/components/pages/outpoint/tabs";
import TxDetails from "@/components/transaction";
import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import { displayName } from "@/utils/artifact";
import * as http from "@/utils/httpClient";

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
		<div className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6 lg:p-8">
			<div className="rounded-lg border border-border bg-card shadow-sm">
				<TxDetails txid={txid} vout={vout} showing={false} />
			</div>

			<div className="space-y-4">
				<h2
					className={`text-3xl font-semibold leading-tight text-foreground ${notoSerif.className}`}
				>
					{displayName(finalArtifact, false)}
				</h2>

				<div className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_1fr]">
					<div className="rounded-lg border border-border bg-card shadow-sm">
						{finalArtifact?.origin?.data?.insc ? (
							<div className="relative overflow-hidden rounded-lg">
								<ArtifactViewer
									artifact={finalArtifact}
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
						</div>
						<div className="px-4 py-5">{children}</div>
					</div>
				</div>
			</div>
		</div>
	);
}
