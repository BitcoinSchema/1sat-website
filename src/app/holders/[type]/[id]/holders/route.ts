import { Holder } from "@/components/pages/TokenMarket/list";
import { BSV20 } from "@/types/bsv20";
import { NextRequest, NextResponse } from "next/server";

interface TickHolder {
	address: string;
	amt: number;
	pct: number;
}

export const dynamic = "force-dynamic"; // defaults to auto

export async function GET(request: NextRequest, {
		params,
	}: {
		params: { details: BSV20 };
	},
) {
  const details = params.details;
	
	// holders
	const resHolders = await fetch(request.url, {
		next: { revalidate: 60 }, // Revalidate every 60 seconds
	});
	const holdersResp = (await resHolders.json()) as Holder[];
	const holders = holdersResp
		.sort((a, b) => parseInt(b.amt) - parseInt(a.amt))
		.map((h) => ({
			...h,
			amt: parseInt(h.amt) / 10 ** (details.dec || 0),
			pct: details.supply
				? (parseInt(h.amt) / parseInt(details.supply)) * 100
				: 0,
		})) as TickHolder[];
	return NextResponse.json(holders);
}
