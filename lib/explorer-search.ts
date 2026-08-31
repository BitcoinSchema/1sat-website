import {
	HttpError,
	type MarketClient,
	type OpnsClient,
	type TxoClient,
} from "@1sat/client";
import type { Capability, IndexedOutput } from "@1sat/types";
import {
	type ListingData,
	listingFromOutput,
	marketClient,
	stackServices,
	toStackOutpoint,
	toUrlOutpoint,
	txoClient,
} from "@/lib/stack";

const TXID = /^[0-9a-f]{64}$/i;
const OUTPOINT = /^[0-9a-f]{64}[_.]\d{1,6}$/i;
export const SEARCH_PAGE_SIZE = 24;

export type ExplorerSearchKind = "outpoint" | "transaction" | "name";
export type SearchState<T> =
	| { status: "ready"; data: T }
	| { status: "not-found" | "unavailable" | "error" | "not-applicable" };

export interface ExplorerSearchResult {
	query: string;
	kind: ExplorerSearchKind;
	exact: SearchState<{ href: string; outputs: IndexedOutput[] }>;
	opns: SearchState<{ name: string; outpoint: string }>;
	listings: SearchState<{
		items: ListingData[];
		nextCursor: number | null;
	}>;
}

type ExplorerClients = {
	txo: Pick<TxoClient, "get" | "getByTxid">;
	market: Pick<MarketClient, "searchListings">;
	opns: Pick<OpnsClient, "getOrigin">;
};

const defaultClients: ExplorerClients = {
	txo: txoClient,
	market: marketClient,
	opns: stackServices.opns,
};

const notApplicable = { status: "not-applicable" } as const;

export function classifyExplorerSearch(value: string): ExplorerSearchKind {
	const query = value.trim();
	if (OUTPOINT.test(query)) return "outpoint";
	if (TXID.test(query)) return "transaction";
	return "name";
}

export function parseSearchCursor(
	value: string | undefined,
): number | undefined {
	if (!value) return undefined;
	const cursor = Number(value);
	return Number.isFinite(cursor) && cursor > 0 ? cursor : undefined;
}

function failedState(error: unknown): SearchState<never> {
	return error instanceof HttpError && error.status === 404
		? { status: "not-found" }
		: { status: "error" };
}

export async function searchExplorer(
	queryInput: string,
	capabilities: readonly Capability[],
	from?: number,
	clients: ExplorerClients = defaultClients,
): Promise<ExplorerSearchResult> {
	const query = queryInput.trim();
	const kind = classifyExplorerSearch(query);
	const available = new Set(capabilities);
	const result: ExplorerSearchResult = {
		query,
		kind,
		exact: notApplicable,
		opns: notApplicable,
		listings: notApplicable,
	};

	if (kind === "outpoint") {
		if (!available.has("txo")) {
			result.exact = { status: "unavailable" };
			return result;
		}
		try {
			const output = await clients.txo.get(toStackOutpoint(query), {
				block: true,
				events: true,
				sats: true,
				spend: true,
			});
			result.exact = {
				status: "ready",
				data: {
					href: `/outpoint/${toUrlOutpoint(output.outpoint)}`,
					outputs: [output],
				},
			};
		} catch (error) {
			result.exact = failedState(error);
		}
		return result;
	}

	if (kind === "transaction") {
		if (!available.has("txo")) {
			result.exact = { status: "unavailable" };
			return result;
		}
		try {
			const outputs = await clients.txo.getByTxid(query.toLowerCase(), {
				block: true,
				events: true,
				sats: true,
				spend: true,
			});
			result.exact = outputs.length
				? {
						status: "ready",
						data: { href: `/tx/${query.toLowerCase()}`, outputs },
					}
				: { status: "not-found" };
		} catch (error) {
			result.exact = failedState(error);
		}
		return result;
	}

	const opnsSearch = available.has("opns")
		? clients.opns
				.getOrigin(query)
				.then((data) => ({ status: "ready", data }) as const)
				.catch(failedState)
		: Promise.resolve({ status: "unavailable" } as const);
	const listingSearch = available.has("market")
		? clients.market
				.searchListings({
					status: "active",
					q: query,
					limit: SEARCH_PAGE_SIZE,
					from,
					rev: true,
				})
				.then((outputs) => ({
					status: "ready" as const,
					data: {
						items: outputs
							.map(listingFromOutput)
							.filter((listing) => !listing.spend_txid),
						nextCursor:
							outputs.length === SEARCH_PAGE_SIZE
								? (outputs.at(-1)?.score ?? null)
								: null,
					},
				}))
				.catch(failedState)
		: Promise.resolve({ status: "unavailable" } as const);

	[result.opns, result.listings] = await Promise.all([
		opnsSearch,
		listingSearch,
	]);
	return result;
}
