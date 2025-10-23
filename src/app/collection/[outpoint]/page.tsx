import CollectionPage from "@/components/pages/collection";
import { API_HOST } from "@/constants";
import type { CollectionStats } from "@/types/collection";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

const Collection = async ({ params }: { params: Promise<{ outpoint: string }> }) => {
	const { outpoint } = await params;
	// Get the Ordinal TXO
	let collection: OrdUtxo | undefined;
	const collectionUrl = `${API_HOST}/api/txos/${outpoint}`;
	try {
		const { promise: promiseCollection } =
			http.customFetch<OrdUtxo>(collectionUrl);
		collection = await promiseCollection;
	} catch (e) {
		console.error("Error fetching collection", e, collectionUrl);
	}

	// Get the collection stats
	let stats: CollectionStats | undefined;
	const collectionStatsUrl = `${API_HOST}/api/collections/${outpoint}/stats`;
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
	params: Promise<{ outpoint: string }>;
}) {
	const { outpoint } = await params;
	const details = await fetch(
		`${API_HOST}/api/inscriptions/${outpoint}`
	).then((res) => res.json() as Promise<OrdUtxo>);

	const collectionName =
		details.origin?.data?.map?.name ||
		details.origin?.data?.bsv20?.tick ||
		details.origin?.data?.bsv20?.sym ||
		details.origin?.data?.insc?.json?.tick ||
		details.origin?.data?.insc?.json?.p ||
		details.origin?.data?.insc?.file.type ||
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
