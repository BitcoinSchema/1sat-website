import Artifact from "@/components/artifact";
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

const OutpointPage = async ({
	artifact,
	listing,
	history,
	spends,
	outpoint,
	content,
	activeTab,
}: Props) => {
	// I1 - Ordinal
	// I2 - Funding
	// O1 - Ordinal destination
	// O2 - Payment to lister
	// O3 - Market Fee
	// O4 - Change
	if (artifact?.data?.list && !artifact.script) {
		const { promise } = http.customFetch<OrdUtxo>(
			`${API_HOST}/api/txos/${artifact.outpoint}?script=true`
		);

		const { script } = await promise;
		artifact.script = script;
	}

	// if (
	//   (price === 0 ? minimumMarketFee + price : price * 1.04) >=
	//   sumBy(fundingUtxos, "satoshis") + P2PKHInputSize * fundingUtxos.length
	// ) {
	//   toast.error("Not enough Bitcoin!", toastErrorProps);
	// }

	return (
		<div className="mx-auto flex flex-col p-2 md:p-0 min-h-64">
			{artifact && (
				<>
					<h2 className={`text-2xl mb-4  ${notoSerif.className}`}>
						{displayName(artifact, false)}
					</h2>
					<div className="flex flex-col md:flex-row gap-4">
						{artifact?.origin?.data?.insc && (
							<Artifact
								artifact={artifact}
								size={550}
								sizes={"100vw"}
								glow={true}
								classNames={{
									media: "overflow-hidden",
									wrapper: `overflow-hidden h-[550px] relative ${
										// activeTab === OutpointTab.Inscription ? "md:w-1/3" : "md:w-2/3"
										"w-fit"
									}`,
								}}
								showListingTag={true}
							/>
						)}
						<div className="divider" />
						<div
							className={`w-full ${
								// activeTab === OutpointTab.Inscription ? "md:w-1/3" : "md:w-1/3"
								"w-full"
							} mx-auto`}
						>
							<OutpointTabs
								activeTab={activeTab}
								outpoint={outpoint}
								owner={
									artifact.spend ||
									!!artifact.origin?.data?.bsv20
										? undefined
										: artifact?.owner
								}
								hasToken={!!artifact.origin?.data?.bsv20}
								isListing={!!artifact.data?.list}
								isCollection={
									artifact.origin?.data?.map?.subType ===
										"collection" ||
									artifact.origin?.data?.map?.subType ===
										"collectionItem"
								}
							/>
							{content}
						</div>
					</div>
				</>
			)}
		</div>
	);
};

export default OutpointPage;
