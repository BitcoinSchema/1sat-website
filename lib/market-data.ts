import { STACK_URL } from "@/lib/stack";

// Token market data sources. Price/market-cap aggregation is not yet served
// by the 1sat-stack (see repo issue #89) — this uses the stack token
// registry. BSV20 (v1) is deprecated and not supported on this site.

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
