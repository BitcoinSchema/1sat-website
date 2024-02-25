import { MarketData } from "@/components/pages/TokenMarket/list";
import { AssetType } from "@/constants";
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
		params: { type: AssetType; };
	},
) {
  const { type } = params;
  let marketData: MarketData[] = [];
  if (type === AssetType.BSV20) {
    // const urlTokens = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=20&offset=0&type=v1`;
    // const { promise: promiseBsv20 } = http.customFetch<BSV20TXO[]>(urlTokens);
    // listings = await promiseBsv20;
    const urlV1Market = "https://1sat-api-production.up.railway.app/market/bsv20?limit=100&sort=&dir=desc&offset=0";

    const promiseBsv20v1Market =     await fetch(urlV1Market);
    marketData = ((await promiseBsv20v1Market.json() || []) as MarketData[])
    .sort((a, b) => {
      
      if (a.pendingOps * 1000 > parseInt(a.fundBalance)) {
        return 1;
      }
      if (b.pendingOps * 1000 > parseInt(b.fundBalance)) {
        return -1;
      }
      return a.num < b.num ? -1 : 1;
      // return a.marketCap > b.marketCap ? -1 : 1;
    });
  } else {
    // aggregated market data from the API
    const urlV2Market = "https://1sat-api-production.up.railway.app/market/bsv21?limit=100&sort=&dir=desc&offset=0";

    const promiseBsv21Market  =await fetch (urlV2Market);
    marketData = ((await promiseBsv21Market.json() || []) as MarketData[])
    .sort((a, b) => {
      if (a.pendingOps * 1000 > parseInt(a.fundBalance)) {
        return 1;
      }
      if (b.pendingOps * 1000 > parseInt(b.fundBalance)) {
        return -1;
      }
      return a.marketCap > b.marketCap ? -1 : 1;
    });
  }

	return NextResponse.json(marketData || []);
}
