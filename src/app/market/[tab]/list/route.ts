import type { MarketData } from "@/components/pages/TokenMarket/list";
import { AssetType } from "@/constants";
import { NextResponse, type NextRequest } from "next/server";

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
		params: { type: AssetType; id?: string };
	}
) {
	const { type } = params;
	let marketData: MarketData[] = [];
	if (type === AssetType.BSV20) {
		// const urlTokens = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=20&offset=0&type=v1`;
		// const { promise: promiseBsv20 } = http.customFetch<BSV20TXO[]>(urlTokens);
		// listings = await promiseBsv20;
		const urlV1Market = `https://1sat-api-production.up.railway.app/market/bsv20${
			params.id ? `/${params.id}` : ""
		}?limit=100&sort=recentSales&dir=desc&offset=0`;

		const promiseBsv20v1Market = await fetch(urlV1Market);
		marketData = ((await promiseBsv20v1Market.json()) ||
			[]) as MarketData[];
		// .sort((a, b) => {
		// 	if (a.pendingOps * 1000 > Number.parseInt(a.fundBalance)) {
		// 		return 1;
		// 	}
		// 	if (b.pendingOps * 1000 > Number.parseInt(b.fundBalance)) {
		// 		return -1;
		// 	}
		// 	// TODO: Implement sort by each field
		// 	// return a.num < b.num ? -1 : 1;
		// 	// return a.marketCap > b.marketCap ? -1 : 1;
		// 	return a.price > b.price ? -1 : 1;
		// });
	} else {
		// aggregated market data from the API
		const urlV2Market = `https://1sat-api-production.up.railway.app/market/bsv21${
			params.id ? `/${params.id}` : ""
		}?limit=100&sort=asc&dir=asc&offset=0`;

		const promiseBsv21Market = await fetch(urlV2Market);
		marketData = (await promiseBsv21Market.json()) as MarketData[];
	}

	// marketData?.sort((a, b) => {
	// 	if (a.pendingOps * 1000 > Number.parseInt(a.fundBalance)) {
	// 		return 1;
	// 	}
	// 	if (b.pendingOps * 1000 > Number.parseInt(b.fundBalance)) {
	// 		return -1;
	// 	}
	// 	return 0;
	// });

	return NextResponse.json(marketData);
}
