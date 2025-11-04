import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import CollectionContent from "./collectionContent";

interface Props {
  outpoint: string;
}

const CollectionServer = async ({ outpoint }: Props) => {
  let artifact: OrdUtxo | undefined;

  try {
    const url = `${API_HOST}/api/inscriptions/${outpoint}`;
    const { promise } = http.customFetch<OrdUtxo>(url);
    artifact = await promise;
  } catch (e) {
    console.log(e);
  }

  if (!artifact) {
    return <div>Artifact not found</div>;
  }

  const isCollection =
    artifact?.origin?.data?.map?.subType === "collection" ||
    artifact?.origin?.data?.map?.subType === "collectionItem";

  if (!isCollection) {
    return <div>Not a collection</div>;
  }

  // Get the Ordinal TXO
  let collection: OrdUtxo | undefined;
  const collectionUrl = `${API_HOST}/api/txos/${artifact.origin?.data?.map?.subTypeData.collectionId}`;
  try {
    const { promise: promiseCollection } =
      http.customFetch<OrdUtxo>(collectionUrl);
    collection = await promiseCollection;
  } catch (e) {
    console.error("Error fetching collection", e, collectionUrl);
  }

  if (!collection) {
    return <div>Collection not found</div>;
  }

  return <CollectionContent artifact={artifact} collection={collection} />;
};

export default CollectionServer;
