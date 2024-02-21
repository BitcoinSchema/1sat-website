import { Holder } from "@/components/pages/TokenMarket/list";
import { API_HOST, AssetType } from "@/constants";
import { BSV20 } from "@/types/bsv20";
import { NextRequest, NextResponse } from "next/server";

interface TickHolder {
	address: string;
	amt: number;
	pct: number;
}

export const dynamic = "force-dynamic"; // defaults to auto

export async function POST(
	request: NextRequest,
	{
		params,
	}: {
		params: { type: AssetType; id: string; details?: BSV20 };
	},
) {
	const url =
		params.type === AssetType.BSV20
			? `${API_HOST}/api/bsv20/tick/${params.id}/holders`
			: `${API_HOST}/api/bsv20/id/${params.id}/holders`;

	const holdersResp = await fetch(url);
	const holdersJson = ((await holdersResp.json()) || []) as Holder[];

	const holders = holdersJson
		?.sort((a, b) => parseInt(b.amt) - parseInt(a.amt))
		.map((h) => ({
			...h,
			amt: parseInt(h.amt) / 10 ** (params.details?.dec || 0),
			pct: params.details?.supply
				? (parseInt(h.amt) / parseInt(params.details?.supply)) * 100
				: 0,
		})) as TickHolder[];
	return NextResponse.json(holders || []);
}
