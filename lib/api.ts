import type { MarketClient } from "@1sat/client";
import { type ListingData, listingFromOutput, marketClient } from "@/lib/stack";

export async function fetchMarketActivity(
	{
		pageParam,
	}: {
		pageParam?: number;
	},
	client: Pick<MarketClient, "searchListings"> = marketClient,
): Promise<{
	items: ListingData[];
	nextCursor: number | null;
}> {
	const outputs =
		(await client.searchListings({
			status: "active",
			limit: 30,
			from: pageParam,
			rev: true,
		})) ?? [];
	const items = outputs.map(listingFromOutput);
	return {
		items,
		nextCursor: items.length === 30 ? (items.at(-1)?.score ?? null) : null,
	};
}
