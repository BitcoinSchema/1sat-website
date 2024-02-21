import { NextResponse, type NextRequest } from "next/server";

import { Holder } from "@/components/pages/TokenMarket/list";
import { API_HOST, AssetType } from "@/constants";

interface TickHolder {
	address: string;
	amt: number;
	pct: number;
}

export const dynamic = "force-dynamic"; // defaults to auto

export async function GET(
	request: NextRequest | undefined,
	{
		params,
	}: {
		params: { type: AssetType; id: string };
	},
) {
	const type = params.type;
	const id = params.id;
	
	const holdersUrl =
		type === AssetType.BSV20
			? `${API_HOST}/api/bsv20/tick/${id}/holders`
			: `${API_HOST}/api/bsv20/id/${id}/holders`;
	const detailsUrl =
		type === AssetType.BSV20
			? `${API_HOST}/api/bsv20/tick/${id}`
			: `${API_HOST}/api/bsv20/id/${id}`;

	// ticker details
	const resDetails = await fetch(detailsUrl, {
		next: { revalidate: 60 }, // Revalidate every 60 seconds
	});
	const details = await resDetails.json();

	// holders
	const resHolders = await fetch(holdersUrl, {
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
	return NextResponse.json({
		holders,
		details,
		type,
		id,
	});
}
