import type { MarketClient } from "@1sat/client";
import type { IndexedOutput } from "@1sat/types";
import {
	type ListingData,
	listingFromOutput,
	toStackOutpoint,
} from "@/lib/stack";

export const MARKET_PAGE_SIZE = 30;

export interface MarketFilters {
	q?: string;
	type?: string;
	from?: number;
}

export function parseMarketFilters(input: {
	q?: string | string[];
	type?: string | string[];
	from?: string | string[];
}): MarketFilters {
	const q = typeof input.q === "string" ? input.q.trim().slice(0, 80) : "";
	const type =
		typeof input.type === "string" ? input.type.trim().slice(0, 80) : "";
	const parsedFrom =
		typeof input.from === "string" ? Number(input.from) : Number.NaN;
	return {
		...(q && { q }),
		...(type && { type }),
		...(Number.isFinite(parsedFrom) && parsedFrom >= 0
			? { from: parsedFrom }
			: {}),
	};
}

export function isActiveListing(listing: ListingData): boolean {
	return (
		Number.isSafeInteger(listing.price) &&
		(listing.price ?? 0) > 0 &&
		!listing.spend_txid
	);
}

export async function searchActiveOrdinalListings(
	client: Pick<MarketClient, "searchListings">,
	filters: MarketFilters,
): Promise<{ listings: ListingData[]; nextCursor: number | null }> {
	const outputs =
		(await client.searchListings({
			status: "active",
			limit: MARKET_PAGE_SIZE,
			rev: true,
			...filters,
		})) ?? [];
	const listings = outputs.map(listingFromOutput).filter(isActiveListing);
	return {
		listings,
		nextCursor:
			outputs.length === MARKET_PAGE_SIZE
				? (outputs.at(-1)?.score ?? null)
				: null,
	};
}

export async function requireCurrentListing(
	client: Pick<MarketClient, "getListingByOrigin">,
	expected: Pick<ListingData, "origin" | "outpoint" | "price">,
): Promise<ListingData | null> {
	if (!expected.origin || !expected.price) return null;
	try {
		const output = await client.getListingByOrigin(
			toStackOutpoint(expected.origin),
		);
		const current = listingFromOutput(output);
		return isActiveListing(current) &&
			toStackOutpoint(current.outpoint) ===
				toStackOutpoint(expected.outpoint) &&
			current.price === expected.price
			? current
			: null;
	} catch {
		return null;
	}
}

export function matchWalletListings<T extends { outpoint: string }>(
	walletListings: Array<{ output: T; origin: string }>,
	indexedByOrigin: Record<string, IndexedOutput>,
): Array<{ output: T; listing: ListingData }> {
	return walletListings.flatMap((owned) => {
		const indexed = indexedByOrigin[toStackOutpoint(owned.origin)];
		if (!indexed) return [];
		const listing = listingFromOutput(indexed);
		return isActiveListing(listing) &&
			toStackOutpoint(listing.outpoint) ===
				toStackOutpoint(owned.output.outpoint)
			? [{ output: owned.output, listing }]
			: [];
	});
}

export function marketSearchHref(filters: MarketFilters): string {
	const params = new URLSearchParams();
	if (filters.q) params.set("q", filters.q);
	if (filters.type) params.set("type", filters.type);
	if (filters.from !== undefined) params.set("from", String(filters.from));
	const query = params.toString();
	return `/market/ordinals${query ? `?${query}` : ""}`;
}
