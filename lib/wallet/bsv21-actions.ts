import type {
	OneSatContext,
	PurchaseBsv21Request,
	TokenOperationResponse,
} from "@1sat/actions";
import { buyBsv21, sendBsv21 } from "@1sat/actions";
import type { IndexedOutput, TokenDetailResponse } from "@1sat/types";
import { PublicKey } from "@bsv/sdk";
import { isP2pkhAddressForChain } from "@/components/wallet/wallet-home-utils";
import { listingFromOutput, toStackOutpoint, toUrlOutpoint } from "@/lib/stack";

const DECIMAL_AMOUNT = /^(?:0|[1-9]\d*)(?:\.(\d+))?$/;
const ATOMIC_AMOUNT = /^(?:0|[1-9]\d*)$/;
const TOKEN_ID = /^[0-9a-fA-F]{64}_[0-9]+$/;
const COUNTERPARTY = /^(02|03)[0-9a-fA-F]{64}$/;

export interface Bsv21Destination {
	address?: string;
	counterparty?: string;
}

export interface Bsv21Listing {
	outpoint: string;
	amount: string;
	price: number;
}

export interface Bsv21ActionSet {
	send: typeof sendBsv21.execute;
	buy: typeof buyBsv21.execute;
}

export const canonicalBsv21Actions: Bsv21ActionSet = {
	send: sendBsv21.execute,
	buy: buyBsv21.execute,
};

export function isBsv21TokenId(value: string): boolean {
	return TOKEN_ID.test(toUrlOutpoint(value.trim()));
}

export function normalizeBsv21TokenId(value: string): string {
	return toUrlOutpoint(value.trim()).toLowerCase();
}

export function parseBsv21Amount(
	value: string,
	decimals: number,
): bigint | null {
	if (!Number.isInteger(decimals) || decimals < 0 || decimals > 18) return null;
	const normalized = value.trim();
	const match = DECIMAL_AMOUNT.exec(normalized);
	if (!match) return null;
	const fraction = match[1] ?? "";
	if (fraction.length > decimals) return null;
	try {
		const atomic = BigInt(
			`${normalized.split(".")[0]}${fraction.padEnd(decimals, "0")}`,
		);
		return atomic > 0n ? atomic : null;
	} catch {
		return null;
	}
}

export function formatBsv21Amount(
	value: string | bigint,
	decimals: number,
): string {
	const atomic = typeof value === "bigint" ? value : BigInt(value);
	if (decimals === 0) return atomic.toString();
	const negative = atomic < 0n;
	const digits = (negative ? -atomic : atomic)
		.toString()
		.padStart(decimals + 1, "0");
	const whole = digits.slice(0, -decimals);
	const fraction = digits.slice(-decimals).replace(/0+$/, "");
	return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

export function parseBsv21Destination(
	value: string,
	chain: "main" | "test",
): Bsv21Destination | null {
	const normalized = value.trim();
	if (isP2pkhAddressForChain(normalized, chain)) {
		return { address: normalized };
	}
	if (!COUNTERPARTY.test(normalized)) return null;
	try {
		return PublicKey.fromString(normalized).toString() ===
			normalized.toLowerCase()
			? { counterparty: normalized.toLowerCase() }
			: null;
	} catch {
		return null;
	}
}

export function bsv21ActionFailureMessage(error: unknown): string {
	const message = error instanceof Error ? error.message : String(error);
	const normalized = message.toLowerCase();
	if (
		normalized.includes("denied") ||
		normalized.includes("reject") ||
		normalized.includes("cancel") ||
		normalized.includes("declined")
	) {
		return "The wallet declined this action. Your review details were kept.";
	}
	if (
		normalized.includes("insufficient") ||
		normalized.includes("not enough")
	) {
		return "The wallet no longer has enough spendable value. Refresh and review again.";
	}
	if (
		normalized.includes("overlay") ||
		normalized.includes("not-found") ||
		normalized.includes("not found") ||
		normalized.includes("spent") ||
		normalized.includes("stale")
	) {
		return "The indexed token or listing changed. Refresh and review again.";
	}
	return "The token action failed. Check the wallet connection and try again; your review details were kept.";
}

function indexedTokenData(output: IndexedOutput): {
	id: string;
	amount: string;
} | null {
	const data = output.data?.bsv21;
	if (!data || typeof data !== "object" || Array.isArray(data)) return null;
	const token = data as Record<string, unknown>;
	if (typeof token.id !== "string" || typeof token.amt !== "string") {
		return null;
	}
	if (!ATOMIC_AMOUNT.test(token.amt) || BigInt(token.amt) <= 0n) return null;
	return { id: normalizeBsv21TokenId(token.id), amount: token.amt };
}

function currentListing(
	marketOutput: IndexedOutput,
	tokenOutput: IndexedOutput,
	tokenId: string,
): Bsv21Listing | null {
	const market = listingFromOutput(marketOutput);
	const token = indexedTokenData(tokenOutput);
	if (
		!market.price ||
		market.spend_txid ||
		market.spend_type ||
		tokenOutput.spend ||
		!token ||
		normalizeBsv21TokenId(token.id) !== normalizeBsv21TokenId(tokenId) ||
		toStackOutpoint(market.outpoint) !== toStackOutpoint(tokenOutput.outpoint)
	) {
		return null;
	}
	return {
		outpoint: toStackOutpoint(market.outpoint),
		amount: token.amount,
		price: market.price,
	};
}

export async function getBsv21Listings(
	ctx: Pick<OneSatContext, "services">,
	tokenId: string,
): Promise<Bsv21Listing[]> {
	if (!ctx.services) throw new Error("services-required");
	const marketOutputs = await ctx.services.market.searchListings({
		status: "active",
		limit: 100,
	});
	if (marketOutputs.length === 0) return [];
	const tokenOutputs = await ctx.services.bsv21.validateOutputs(
		tokenId,
		marketOutputs.map((output) => output.outpoint),
		{ unspent: true, tags: "bsv21" },
	);
	const marketByOutpoint = new Map(
		marketOutputs.map((output) => [toStackOutpoint(output.outpoint), output]),
	);
	return tokenOutputs.flatMap((tokenOutput) => {
		const marketOutput = marketByOutpoint.get(
			toStackOutpoint(tokenOutput.outpoint),
		);
		if (!marketOutput) return [];
		const listing = currentListing(marketOutput, tokenOutput, tokenId);
		return listing ? [listing] : [];
	});
}

export async function requireCurrentBsv21Listing(
	ctx: Pick<OneSatContext, "services">,
	tokenId: string,
	reviewed: Bsv21Listing,
): Promise<Bsv21Listing | null> {
	if (!ctx.services) return null;
	try {
		const [marketOutput, tokenOutput] = await Promise.all([
			ctx.services.market.getListing(reviewed.outpoint),
			ctx.services.bsv21.validateOutput(tokenId, reviewed.outpoint, {
				unspent: true,
				tags: "bsv21",
			}),
		]);
		const listing = currentListing(marketOutput, tokenOutput, tokenId);
		if (
			!listing ||
			listing.amount !== reviewed.amount ||
			listing.price !== reviewed.price ||
			toStackOutpoint(listing.outpoint) !== toStackOutpoint(reviewed.outpoint)
		) {
			return null;
		}
		return listing;
	} catch {
		return null;
	}
}

export async function executeBsv21Send(
	ctx: OneSatContext,
	input: {
		tokenId: string;
		amount: bigint;
		destination: Bsv21Destination;
	},
	actions: Bsv21ActionSet = canonicalBsv21Actions,
): Promise<TokenOperationResponse> {
	return actions.send(ctx, {
		tokenId: input.tokenId,
		recipients: [{ amount: input.amount, destination: input.destination }],
		validateOverlay: true,
	});
}

export async function executeBsv21Buy(
	ctx: OneSatContext,
	listing: Bsv21Listing,
	tokenId: string,
	actions: Bsv21ActionSet = canonicalBsv21Actions,
): Promise<TokenOperationResponse> {
	const input: PurchaseBsv21Request = {
		tokenId,
		outpoint: listing.outpoint,
		amount: listing.amount,
	};
	return actions.buy(ctx, input);
}

export function safeOverlayFee(details: TokenDetailResponse): number | null {
	const fee = details.status?.fee_per_output;
	return typeof fee === "number" && Number.isSafeInteger(fee) && fee >= 0
		? fee
		: null;
}
