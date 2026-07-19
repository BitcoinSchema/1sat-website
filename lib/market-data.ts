import { STACK_URL } from "@/lib/stack";

// Token market data sources. Price/market-cap aggregation is not yet served
// by the 1sat-stack (see repo issues #88/#89) — these use what is available
// today: the stack token registry for BSV21 and the legacy indexer for
// BSV20 tickers.

export interface Bsv21TokenStatus {
	token_id: string;
	symbol?: string;
	icon?: string;
	balance?: number;
	is_active?: boolean;
	is_whitelisted?: boolean;
	output_count?: number;
	fee_per_output?: number;
}

export interface Bsv20Ticker {
	txid: string;
	height?: number;
	tick?: string;
	max?: string;
	lim?: string;
	dec?: number;
	supply?: string;
	pctMinted?: string;
	included?: boolean;
}

const LEGACY_API_HOST =
	process.env.NEXT_PUBLIC_API_HOST || "https://ordinals.gorillapool.io";

export const getBsv21Tokens = async (): Promise<Bsv21TokenStatus[]> => {
	try {
		const res = await fetch(`${STACK_URL}/1sat/bsv21/tokens`, {
			next: { revalidate: 60 },
		});
		if (!res.ok) return [];
		return ((await res.json()) as Bsv21TokenStatus[] | null) ?? [];
	} catch {
		return [];
	}
};

export const getBsv20Tickers = async (limit = 100): Promise<Bsv20Ticker[]> => {
	try {
		const res = await fetch(
			`${LEGACY_API_HOST}/api/bsv20?limit=${limit}&sort=height&dir=desc&included=true`,
			{ next: { revalidate: 60 } },
		);
		if (!res.ok) return [];
		return ((await res.json()) as Bsv20Ticker[] | null) ?? [];
	} catch {
		return [];
	}
};
