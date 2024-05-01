import CollectionPage from "@/components/pages/collection";
import { API_HOST } from "@/constants";
import { CollectionStats } from "@/types/collection";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import {
	COOM_BANNERS_BY_OUTPOINT,
	COOM_OUTPOINTS_BY_SLUGS,
	COOM_SLUGS_AND_OUTPOINTS,
} from "../constants";

const CoOMCollection = async ({ params }: { params: { outpoint: string } }) => {
	let outpoint = params.outpoint;
	const isCoom = COOM_SLUGS_AND_OUTPOINTS.includes(outpoint);
	const isCoomSlug = isCoom && !!COOM_OUTPOINTS_BY_SLUGS[outpoint];

	if (isCoomSlug) {
		outpoint = COOM_OUTPOINTS_BY_SLUGS[outpoint];
	}

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

	return (
		<CollectionPage
			stats={stats}
			collection={collection}
			bannerImage={COOM_BANNERS_BY_OUTPOINT[outpoint]}
		/>
	);
};

export default CoOMCollection;

export async function generateMetadata({
	params,
}: {
	params: { outpoint: string };
}) {
	let outpoint = params.outpoint;
	const isCoom = COOM_SLUGS_AND_OUTPOINTS.includes(outpoint);
	const isCoomSlug = isCoom && !!COOM_OUTPOINTS_BY_SLUGS[outpoint];

	if (isCoomSlug) {
		outpoint = COOM_OUTPOINTS_BY_SLUGS[outpoint];
	}

	let collection: OrdUtxo | undefined;
	const collectionUrl = `${API_HOST}/api/txos/${outpoint}`;

	try {
		const { promise: promiseCollection } =
			http.customFetch<OrdUtxo>(collectionUrl);
		collection = await promiseCollection;
	} catch (e) {
		console.error("Error fetching collection", e, collectionUrl);
	}

	const collectionName = collection?.origin?.data?.map?.name ?? "COOM";

	return {
		title: `${collectionName} Collection - 1SatOrdinals`,
		description: `Explore items in the ${collectionName} collection on 1SatOrdinals.`,
		openGraph: {
			title: `${collectionName} Collection - 1SatOrdinals`,
			description: `Explore items in the ${collectionName} collection on 1SatOrdinals.`,
			type: "website",
		},
		twitter: {
			card: "summary",
			title: `${collectionName} Collection - 1SatOrdinals`,
			description: `Explore items in the ${collectionName} collection on 1SatOrdinals.`,
		},
	};
}
