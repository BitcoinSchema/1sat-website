import { API_HOST, NUMBER_OF_ITEMS_PER_PAGE } from "@/constants";
import type { FetchItemsQuery } from "@/types/collection";
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
	q: FetchItemsQuery,
	offset = 0,
	limit: number = NUMBER_OF_ITEMS_PER_PAGE
) => {
	const collectionItemsUrl = `${API_HOST}/api/inscriptions/search?offset=${offset}&limit=${limit}&q=${btoa(
		JSON.stringify(q)
	)}`;
	const items = await fetchCollectionData(collectionItemsUrl);

	return (items ?? []).filter((i) => !i?.data?.list?.price);
};

export const fetchCollectionMarket = async (
	q: FetchItemsQuery,
	offset = 0,
	limit: number = NUMBER_OF_ITEMS_PER_PAGE
) => {
	const collectionMarketUrl = `${API_HOST}/api/market?offset=${offset}&limit=${limit}&q=${btoa(
		JSON.stringify(q)
	)}`;

	return await fetchCollectionData(collectionMarketUrl);
};
