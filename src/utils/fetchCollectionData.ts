import { MARKET_API_HOST, NUMBER_OF_ITEMS_PER_PAGE } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

// Sort options for items
export type ItemSort = "recent" | "rarity" | "mint_number";

// Sort options for market listings
export type MarketSort = "price_asc" | "price_desc" | "rarity" | "mint_number";

// Filter options for collection items
export interface ItemFilters {
	traits?: string; // "Background:Blue,Eyes:Red"
	sort?: ItemSort;
}

// Filter options for market listings
export interface MarketFilters {
	traits?: string;
	minPrice?: number; // in satoshis
	maxPrice?: number;
	sort?: MarketSort;
}

const fetchCollectionData = async (url: string) => {
	try {
		const { promise } = http.customFetch<OrdUtxo[]>(url);

		return (await promise) || [];
	} catch (e) {
		console.error("Error fetching collection data", e, url);
	}
};

// Build query string from filters
const buildQueryString = (
	params: Record<string, string | number | undefined>,
): string => {
	const entries = Object.entries(params).filter(
		([, v]) => v !== undefined && v !== "",
	);
	if (entries.length === 0) return "";
	return entries
		.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
		.join("&");
};

export const fetchCollectionItems = async (
	collectionId: string,
	offset = 0,
	limit: number = NUMBER_OF_ITEMS_PER_PAGE,
	filters?: ItemFilters,
) => {
	const queryParams = buildQueryString({
		offset,
		limit,
		traits: filters?.traits,
		sort: filters?.sort,
	});
	const collectionItemsUrl = `${MARKET_API_HOST}/collection/${collectionId}/items?${queryParams}`;
	const items = await fetchCollectionData(collectionItemsUrl);

	return (items ?? []).filter((i) => !i?.data?.list?.price);
};

export const fetchCollectionMarket = async (
	collectionId: string,
	offset = 0,
	limit: number = NUMBER_OF_ITEMS_PER_PAGE,
	filters?: MarketFilters,
) => {
	const queryParams = buildQueryString({
		offset,
		limit,
		traits: filters?.traits,
		minPrice: filters?.minPrice,
		maxPrice: filters?.maxPrice,
		sort: filters?.sort,
	});
	const collectionMarketUrl = `${MARKET_API_HOST}/collection/${collectionId}/market?${queryParams}`;

	return await fetchCollectionData(collectionMarketUrl);
};
