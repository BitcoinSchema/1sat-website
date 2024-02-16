import CollectionPage from "@/components/pages/collection";
import { API_HOST } from "@/constants";
import { CollectionStats } from "@/types/collection";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

const Collection = async ({ params }: { params: { outpoint: string } }) => {
  
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
    const { promise } = http.customFetch<CollectionStats>(collectionStatsUrl);
    stats = (await promise) || [];
  } catch (e) {
    console.error(e);
  }

	// Get the collection items
  let items: OrdUtxo[] = [];
	const q = {
		map: {
			subTypeData: {
				collectionId: params.outpoint,
			},
		},
	};

	const collectionItemsUrl = `${API_HOST}/api/inscriptions/search?limit=100&q=${btoa(
		JSON.stringify(q),
	)}`;
  try {
	const { promise: promiseItems } =
		http.customFetch<OrdUtxo[]>(collectionItemsUrl);
	 items = (await promiseItems) || [];
  } catch (e) {
    console.error("Error fetching collection items", e, collectionItemsUrl);
  }

	// Get the market listings
  let market: OrdUtxo[] = [];
	const collectionMarketUrl = `${API_HOST}/api/market?limit=100&q=${btoa(
		JSON.stringify(q),
	)}`;
  try {
    const { promise: promiseMarket } =
		http.customFetch<OrdUtxo[]>(collectionMarketUrl);
    market = (await promiseMarket) || [];
  } catch (e) {
    console.error("Error fetching collection market", e, collectionMarketUrl);
  }

	// combine collection items and market listings, favoring listings
	const both = market.concat(
		items.filter(
			(i) => !market.find((m) => m.origin?.outpoint === i.origin?.outpoint),
		),
	);

	if (!collection || !stats) {
		return <div>Collection not found</div>;
	}
	return <CollectionPage stats={stats} items={both} collection={collection} />;
};

export default Collection;
