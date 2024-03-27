import CollectionPage from "@/components/pages/collection";
import PublisherCollectionPage from "@/components/pages/collection/PublisherCollectionPage";
import { API_HOST } from "@/constants";
import { CollectionStats } from "@/types/collection";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { COOM_BANNERS_BY_OUTPOINT, COOM_OUTPOINTS_BY_SLUGS, COOM_SLUGS_AND_OUTPOINTS } from "../constants";


const CoOMCollection = async ({ params }: { params: { outpoint: string } }) => {
  let outpoint = params.outpoint;
  const isCoom = COOM_SLUGS_AND_OUTPOINTS.includes(outpoint);
  const isCoomSlug = isCoom && !!COOM_OUTPOINTS_BY_SLUGS[outpoint]

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
        collectionId: outpoint,
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

  return isCoom 
      ? <PublisherCollectionPage
        stats={stats}
        items={both}
        collection={collection}
        bannerImage={COOM_BANNERS_BY_OUTPOINT[outpoint]}
      /> 
      : <CollectionPage stats={stats} items={both} collection={collection} />;
};

export default CoOMCollection;
