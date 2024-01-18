import CollectionPage from "@/components/pages/collection";
import { API_HOST } from "@/constants";
import { CollectionStats } from "@/types/collection";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

const Collection = async ({ params }: { params: { outpoint: string } }) => {
  const collectionUrl = `${API_HOST}/api/txos/${params.outpoint}`;
  const { promise: promiseCollection } =
    http.customFetch<OrdUtxo>(collectionUrl);
  const collection = await promiseCollection;
  const collectionStatsUrl = `${API_HOST}/api/collections/${params.outpoint}/stats`;
  const { promise } = http.customFetch<CollectionStats>(collectionStatsUrl);
  const stats = (await promise) || [];

  const q = {
    map: {
      subTypeData: {
        collectionId: params.outpoint,
      },
    },
  };
  const collectionItemsUrl = `${API_HOST}/api/inscriptions/search?q=${btoa(
    JSON.stringify(q)
  )}`;
  const { promise: promiseItems } =
    http.customFetch<OrdUtxo[]>(collectionItemsUrl);
  const items = (await promiseItems) || [];
  return <CollectionPage stats={stats} items={items} collection={collection} />;
};

export default Collection;
