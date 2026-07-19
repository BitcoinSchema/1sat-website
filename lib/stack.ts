import { MarketClient, OrdfsClient, TxoClient } from "@1sat/client";

// Clients for the 1sat-stack (api.1sat.app) — the canonical backend in the
// BRC-100 paradigm. Server- and client-safe (plain fetch). The clients
// append their own /1sat/* route prefixes, so this is the stack root.
export const STACK_URL =
	process.env.NEXT_PUBLIC_ONESAT_STACK_URL || "https://api.1sat.app";

export const marketClient = new MarketClient(STACK_URL);
export const txoClient = new TxoClient(STACK_URL);
export const ordfsClient = new OrdfsClient(STACK_URL);

export const stackContentUrl = (outpoint: string) =>
	`${STACK_URL}/content/${toStackOutpoint(outpoint)}`;

// The stack canonicalizes outpoints as txid.vout; legacy web URLs (and
// inbound links from the old sites) use txid_vout. Accept both everywhere.
export const toStackOutpoint = (outpoint: string) =>
	outpoint.replace("_", ".");

export const toUrlOutpoint = (outpoint: string) => outpoint.replace(".", "_");

export interface ListingData {
	outpoint: string;
	origin?: string;
	name?: string;
	content_type?: string;
	price?: number;
	seller?: string;
	spend_txid?: string;
	spend_type?: "sale" | "cancel";
}

// The tm_ordlock lookup returns listing fields under IndexedOutput.data.ordlock
export const listingFromOutput = (o: {
	outpoint: string;
	data?: Record<string, unknown>;
}): ListingData => {
	const d = (o.data ?? {}) as Record<string, unknown>;
	const listing = (d.ordlock ?? d.listing ?? d) as Record<string, unknown>;
	return {
		outpoint: o.outpoint,
		origin: listing.origin as string | undefined,
		name: listing.name as string | undefined,
		content_type: listing.content_type as string | undefined,
		price:
			typeof listing.price === "number"
				? listing.price
				: listing.price
					? Number(listing.price)
					: undefined,
		seller: listing.seller as string | undefined,
		spend_txid: listing.spend_txid as string | undefined,
		spend_type: listing.spend_type as "sale" | "cancel" | undefined,
	};
};
