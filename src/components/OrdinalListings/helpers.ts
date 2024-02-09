import { API_HOST, resultsPerPage } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import { uniq } from "lodash";

export const checkOutpointFormat = (outpoint: string) => {
  // ensure txid_vout format
  const split = outpoint.split("_");
  if (split.length !== 2) {
    return false;
  }
  if (split[0].length !== 64) {
    return false;
  }
  if (Number.isNaN(parseInt(split[1]))) {
    return false;
  }
  return true;
};

export const getOrdUtxos = async ({
  address,
  pageParam,
}: {
  address: string;
  pageParam: number;
}) => {
  if (!address) return;
  console.log("getOrdUtxos called", address, pageParam);
  const offset = resultsPerPage * pageParam;
  const url = `${API_HOST}/api/txos/address/${address}/unspent?limit=${resultsPerPage}&offset=${offset}&dir=DESC&status=all&bsv20=false`;
  const res = await fetch(url);
  return res.json();
};

export const getCollectionIds = async (ids: string[]) => {
  const url = `${API_HOST}/api/txos/outpoints?script=false`;
  const uniqueIds = uniq(ids);
  console.log("hitting", url, "with", uniqueIds);
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(uniqueIds),
  });
  const json = (await res.json()) as OrdUtxo[];
  return json;
};

export const mintNumber = (listing: OrdUtxo, collection: any) => {
  const listingData = listing?.origin?.data?.map;
  const mintNumber: string = listingData?.subTypeData?.mintNumber;
  const qty = collection?.subTypeData?.quantity;
  if (!qty || !mintNumber) {
    return null;
  }
  return `${mintNumber}/${qty}`;
};

export const listingName = (listing: OrdUtxo) => {
  if (listing?.origin?.data?.bsv20) {
    return listing?.origin.data.bsv20.tick;
  }
  switch (listing?.origin?.data?.insc?.file.type.split(";")[0]) {
    case "image/gif":
    case "image/jpg":
    case "image/jpeg":
    case "image/webp":
    case "image/png":
      return (
        listing?.origin?.data?.map?.name ||
        listing?.origin?.data?.map?.subTypeData?.name ||
        listing?.origin?.data?.map?.app ||
        "Unknown Name"
      );
    case "text/html": {
      // extract the title from the html
      const html = listing?.origin?.data?.insc?.text;
      const title = html?.match(/<title>(.*)<\/title>/)?.[1];
      return title || listing?.origin.num;
    }
    case "text/json":
      return listing?.origin?.data?.insc.text || listing?.origin.num;
    case "text/plain":
      return listing?.origin?.data?.insc.text || listing?.origin.num;
    default:
      return listing?.origin?.num || "Unknown";
  }
};

export const listingCollection = (listing: OrdUtxo, collections: any) => {
    if (listing?.origin?.data?.map) {
      const collectionId = listing?.origin.data.map.subTypeData?.collectionId;
      if (!collectionId) {
        return null;
      }
      const collection = collections.value.find(
        (c: OrdUtxo) => c.outpoint === collectionId
      )?.origin?.data?.map;
      if (collection) {
        return collection;
      }
    }
  };