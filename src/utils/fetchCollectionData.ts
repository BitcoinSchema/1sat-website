import { MARKET_API_HOST, NUMBER_OF_ITEMS_PER_PAGE } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

const fetchCollectionData = async (url: string) => {
  try {
    const { promise } = http.customFetch<OrdUtxo[]>(url);

    return (await promise) || [];
  } catch (e) {
    console.error("Error fetching collection data", e, url);
  }
};

export const fetchCollectionItems = async (
  collectionId: string,
  offset = 0,
  limit: number = NUMBER_OF_ITEMS_PER_PAGE
) => {
  const collectionItemsUrl = `${MARKET_API_HOST}/collection/${collectionId}/items?offset=${offset}&limit=${limit}`;
  const items = await fetchCollectionData(collectionItemsUrl);

  return (items ?? []).filter((i) => !i?.data?.list?.price);
};

export const fetchCollectionMarket = async (
  collectionId: string,
  offset = 0,
  limit: number = NUMBER_OF_ITEMS_PER_PAGE
) => {
  const collectionMarketUrl = `${MARKET_API_HOST}/collection/${collectionId}/market?offset=${offset}&limit=${limit}`;

  return await fetchCollectionData(collectionMarketUrl);
};
