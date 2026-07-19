import CollectionPage from "@/components/pages/collection";
import { API_HOST } from "@/constants";
import type { CollectionStats } from "@/types/collection";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { isValidOutpoint } from "@/utils/validation";
import { notFound } from "next/navigation";

// Cache rendered pages at the CDN and revalidate in the background.
// The empty generateStaticParams opts the route into ISR.
export const revalidate = 60;

export async function generateStaticParams() {
	return [];
}

const Collection = async ({ params }: { params: { outpoint: string } }) => {
	// Reject junk like /collection/[object Object] before hitting upstream APIs
	if (!isValidOutpoint(params.outpoint)) {
		notFound();
	}

	// Get the Ordinal TXO
	let collection: OrdUtxo | undefined;
	const collectionUrl = `${API_HOST}/api/txos/${params.outpoint}`;
	try {
		const { promise: promiseCollection } =
			http.customFetch<OrdUtxo>(collectionUrl);
		collection = await promiseCollection;
	} catch (e) {
		console.error("Error fetching collection", e, collectionUrl);
	}

	// Get the collection stats
	let stats: CollectionStats | undefined;
	const collectionStatsUrl = `${API_HOST}/api/collections/${params.outpoint}/stats`;
	try {
		const { promise } =
			http.customFetch<CollectionStats>(collectionStatsUrl);
		stats = (await promise) || [];
	} catch (e) {
		console.error(e);
	}

	if (!collection || !stats) {
		return <div>Collection not found</div>;
	}
	return <CollectionPage stats={stats} collection={collection} />;
};

export default Collection;

export async function generateMetadata({
	params,
}: {
	params: { outpoint: string };
}) {
	const fallbackMetadata = {
		title: "Collection - 1SatOrdinals",
		description: "Explore collections on 1SatOrdinals.",
	};

	if (!isValidOutpoint(params.outpoint)) {
		return fallbackMetadata;
	}

	let details: OrdUtxo;
	try {
		const res = await fetch(`${API_HOST}/api/inscriptions/${params.outpoint}`, {
			next: { revalidate: 300 },
		});
		if (!res.ok) {
			return fallbackMetadata;
		}
		details = (await res.json()) as OrdUtxo;
	} catch (e) {
		return fallbackMetadata;
	}

	const collectionName =
		details.origin?.data?.map?.name ||
		details.origin?.data?.bsv20?.tick ||
		details.origin?.data?.bsv20?.sym ||
		details.origin?.data?.insc?.json?.tick ||
		details.origin?.data?.insc?.json?.p ||
		details.origin?.data?.insc?.file?.type ||
		"Mystery Outpoint";

	return {
		title: `${collectionName} Collection`,
		description: `Explore the ${collectionName} collection and its items on 1SatOrdinals.`,
		openGraph: {
			title: `${collectionName} Collection`,
			description: `Explore the ${collectionName} collection and its items on 1SatOrdinals.`,
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title: `${collectionName} Collection`,
			description: `Explore the ${collectionName} collection and its items on 1SatOrdinals.`,
		},
	};
}
