import { OneSatServices } from "@1sat/client";
import {
	type Capability,
	ONESAT_MAINNET_URL,
	ONESAT_TESTNET_URL,
} from "@1sat/types";

type Chain = "main" | "test";

const trimTrailingSlash = (url: string) => url.replace(/\/$/, "");

export const STACK_URL = trimTrailingSlash(
	process.env.NEXT_PUBLIC_ONESAT_STACK_URL || ONESAT_MAINNET_URL,
);

export const TEST_STACK_URL = trimTrailingSlash(
	process.env.NEXT_PUBLIC_ONESAT_TEST_STACK_URL || ONESAT_TESTNET_URL,
);

export const stackUrlForChain = (chain: Chain) =>
	chain === "test" ? TEST_STACK_URL : STACK_URL;

export const stackApiUrl = (path: string, chain: Chain = "main") =>
	`${stackUrlForChain(chain)}/${path.replace(/^\//, "")}`;

const KNOWN_CAPABILITIES = new Set<Capability>([
	"admin",
	"bap",
	"beef",
	"pubsub",
	"txo",
	"owner",
	"bsv21",
	"bsocial",
	"opns",
	"market",
	"paymail",
	"sweep",
	"ordfs",
	"chaintracks",
	"arcade",
	"overlay",
]);

export function parseStackCapabilities(value: unknown): Capability[] {
	if (!Array.isArray(value)) {
		throw new TypeError("1Sat capability manifest must be an array");
	}

	return [
		...new Set(
			value.filter(
				(capability): capability is Capability =>
					typeof capability === "string" &&
					KNOWN_CAPABILITIES.has(capability as Capability),
			),
		),
	];
}

export async function fetchStackCapabilities(
	baseUrl = STACK_URL,
	fetchFn: typeof fetch = fetch,
): Promise<Capability[]> {
	const response = await fetchFn(
		`${trimTrailingSlash(baseUrl)}/1sat/capabilities`,
	);
	if (!response.ok) {
		throw new Error(`Failed to fetch capabilities (${response.status})`);
	}
	return parseStackCapabilities(await response.json());
}

/** Corrects @1sat/client 0.0.50's legacy `/capabilities` path. */
export class OneSatStackServices extends OneSatServices {
	override getCapabilities(): Promise<Capability[]> {
		return fetchStackCapabilities(this.baseUrl);
	}
}

export const createStackServices = (chain: Chain = "main") =>
	new OneSatStackServices(chain, stackUrlForChain(chain));

export const stackServices = createStackServices();
export const marketClient = stackServices.market;
export const ownerClient = stackServices.owner;
export const txoClient = stackServices.txo;
export const ordfsClient = stackServices.ordfs;

// Stack APIs use txid.vout internally; public OrdFS URLs use txid_vout.
// Accept both at the website boundary and emit the format expected by each.
export const toStackOutpoint = (outpoint: string) => outpoint.replace("_", ".");

export const toUrlOutpoint = (outpoint: string) => outpoint.replace(".", "_");

export const stackContentUrl = (outpoint: string) =>
	ordfsClient.getContentUrl(toUrlOutpoint(outpoint));

export interface ListingData {
	outpoint: string;
	score: number;
	origin?: string;
	name?: string;
	content_type?: string;
	price?: number;
	seller?: string;
	spend_txid?: string;
	spend_type?: "sale" | "cancel";
}

const safeListingPrice = (value: unknown): number | undefined => {
	if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
		return value;
	}
	if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return undefined;
	try {
		const parsed = BigInt(value);
		return parsed <= BigInt(Number.MAX_SAFE_INTEGER)
			? Number(parsed)
			: undefined;
	} catch {
		return undefined;
	}
};

// The tm_ordlock lookup returns listing fields under IndexedOutput.data.ordlock.
export const listingFromOutput = (o: {
	outpoint: string;
	score: number;
	spend?: string;
	data?: Record<string, unknown>;
}): ListingData => {
	const d = (o.data ?? {}) as Record<string, unknown>;
	const listing = (d.ordlock ?? d.listing ?? d) as Record<string, unknown>;
	return {
		outpoint: o.outpoint,
		score: o.score,
		origin: listing.origin as string | undefined,
		name: listing.name as string | undefined,
		content_type: listing.content_type as string | undefined,
		price: safeListingPrice(listing.price),
		seller: listing.seller as string | undefined,
		spend_txid: (listing.spend_txid as string | undefined) ?? o.spend,
		spend_type: listing.spend_type as "sale" | "cancel" | undefined,
	};
};
