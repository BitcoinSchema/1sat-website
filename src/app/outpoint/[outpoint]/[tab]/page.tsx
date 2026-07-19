import { notFound } from "next/navigation";
import CollectionServer from "@/components/pages/outpoint/collectionServer";
import InscriptionContent from "@/components/pages/outpoint/inscriptionContent";
import ListingServer from "@/components/pages/outpoint/listingServer";
import OwnerServer from "@/components/pages/outpoint/ownerServer";
import TimelineContent from "@/components/pages/outpoint/timelineContent";
import TokenContent from "@/components/pages/outpoint/tokenContent";
import { API_HOST } from "@/constants";
import { OutpointTab } from "@/types/common";
import type { OrdUtxo } from "@/types/ordinals";
import { isValidOutpoint } from "@/utils/validation";

// Cache rendered pages at the CDN and revalidate in the background so
// repeat/crawler traffic doesn't invoke a serverless render every time.
// The empty generateStaticParams opts the route into ISR — pages render on
// demand and are cached for the revalidate window.
export const revalidate = 60;

export async function generateStaticParams() {
	return [];
}

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
	if (
		!isValidOutpoint(outpoint) ||
		!Object.values(OutpointTab).includes(tab as OutpointTab)
	) {
		notFound();
	}
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
	const fallbackMetadata = {
		title: "Outpoint - 1SatOrdinals",
		description: "Explore item details on 1SatOrdinals.",
	};

	if (!isValidOutpoint(outpoint)) {
		return fallbackMetadata;
	}

	let details: OrdUtxo;
	try {
		const res = await fetch(`${API_HOST}/api/inscriptions/${outpoint}`, {
			next: { revalidate: 300 },
		});
		if (!res.ok) {
			return fallbackMetadata;
		}
		details = (await res.json()) as OrdUtxo;
	} catch (_e) {
		return fallbackMetadata;
	}

	const isImageInscription =
		details.origin?.data?.insc?.file?.type?.startsWith("image");

	const name =
		details.origin?.data?.map?.name ||
		details.origin?.data?.bsv20?.tick ||
		details.origin?.data?.bsv20?.sym ||
		details.origin?.data?.insc?.json?.tick ||
		details.origin?.data?.insc?.json?.p ||
		details.origin?.data?.insc?.file?.type ||
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
