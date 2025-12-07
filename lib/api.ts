import type { OrdUtxo } from "./types/ordinals";

const API_HOST = "https://ordinals.gorillapool.io";

export async function fetchMarketActivity({ pageParam = 0 }): Promise<{
	items: OrdUtxo[];
	nextCursor: number | null;
}> {
	try {
		const response = await fetch(
			`${API_HOST}/api/market?limit=30&offset=${pageParam}&type=image`,
		);
		if (!response.ok) {
			throw new Error("Network response was not ok");
		}
		const data = await response.json();

		// The API returns an array of items.
		// We need to determine the next cursor.
		// Assuming simple offset-based pagination where pageParam is the offset.
		const items = Array.isArray(data) ? data : [];
		const nextCursor = items.length === 30 ? pageParam + 30 : null;

		return {
			items,
			nextCursor,
		};
	} catch (error) {
		console.error("Fetch error:", error);
		return { items: [], nextCursor: null };
	}
}
