import CollectionServer from "@/components/pages/outpoint/collectionServer";
import InscriptionContent from "@/components/pages/outpoint/inscriptionContent";
import ListingServer from "@/components/pages/outpoint/listingServer";
import OwnerServer from "@/components/pages/outpoint/ownerServer";
import TimelineContent from "@/components/pages/outpoint/timelineContent";
import TokenContent from "@/components/pages/outpoint/tokenContent";
import { API_HOST } from "@/constants";
import { OutpointTab } from "@/types/common";
import type { OrdUtxo } from "@/types/ordinals";

// Transaction I/O display types used by transaction components
export type IODisplay = {
	address?: string;
	script?: string;
	index: number;
	txid: string;
	amount: number;
};

export type InputOutpoint = {
	script: string;
	satoshis: bigint;
	txid: string;
	vout: number;
};

type OutpointParams = {
	outpoint: string;
	tab: string;
};

const Outpoint = async ({ params }: { params: Promise<OutpointParams> }) => {
	const { outpoint, tab } = await params;
	const currentTab = tab as OutpointTab;

	// Render just the tab content - layout handles the rest
	switch (currentTab) {
		case OutpointTab.Timeline:
			return <TimelineContent outpoint={outpoint} />;
		case OutpointTab.Inscription:
			return <InscriptionContent outpoint={outpoint} />;
		case OutpointTab.Token:
			return <TokenContent outpoint={outpoint} />;
		case OutpointTab.Listing:
			return <ListingServer outpoint={outpoint} />;
		case OutpointTab.Collection:
			return <CollectionServer outpoint={outpoint} />;
		case OutpointTab.Owner:
			return <OwnerServer outpoint={outpoint} />;
		default:
			return <div>Unknown tab</div>;
	}
};

export default Outpoint;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ outpoint: string; tab: string }>;
}) {
	const { outpoint } = await params;
	const details = await fetch(`${API_HOST}/api/inscriptions/${outpoint}`).then(
		(res) => res.json() as Promise<OrdUtxo>,
	);

	const isImageInscription =
		details.origin?.data?.insc?.file.type?.startsWith("image");

	const name =
		details.origin?.data?.map?.name ||
		details.origin?.data?.bsv20?.tick ||
		details.origin?.data?.bsv20?.sym ||
		details.origin?.data?.insc?.json?.tick ||
		details.origin?.data?.insc?.json?.p ||
		details.origin?.data?.insc?.file.type ||
		"Mystery Outpoint";

	const title = `${details.data?.list && (!details.spend || details.spend?.length === 0) ? "Buy " : ""}${name} - 1SatOrdinals`;

	// TODO: Make listing metadata better - show price, collection, etc
	return {
		title,
		description: `Explore item details for ${
			isImageInscription ? "image" : name
		} on 1SatOrdinals.`,
		openGraph: {
			title,
			description: `Explore item details for ${
				isImageInscription ? `image ${outpoint}` : name
			} on 1SatOrdinals.`,
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title,
			description: `Explore item details for ${
				isImageInscription ? "image" : name
			} on 1SatOrdinals.`,
		},
	};
}
