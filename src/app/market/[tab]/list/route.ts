import type { MarketData } from "@/components/pages/TokenMarket/list";
import { AssetType, MARKET_API_HOST, type SortBy } from "@/constants";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic"; // defaults to auto

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{ tab: string; type?: string; id?: string; term?: string }>;
  }
) {
  const params = await context.params;
  const tab = params.tab || params.type;
  const type = tab as AssetType;
  const id = params.id;
  const term = params.term;
  const searchParams = request.nextUrl.searchParams;
  // console.log("here", {searchParams, params})
  const sort = searchParams.get("sort") as SortBy;
  const dir = searchParams.get("dir") as "asc" | "desc";

  let marketData: MarketData[] = [];

  if (type === AssetType.BSV20) {
    // const urlTokens = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=20&offset=0&type=v1`;
    // const { promise: promiseBsv20 } = http.customFetch<BSV20TXO[]>(urlTokens);
    // listings = await promiseBsv20;
    const urlV1Market = `${MARKET_API_HOST}/market/bsv20${id ? `/${id}` : term ? `/search/${term}` : ""
      }?limit=500&sort=${sort ? sort : "most_recent_sale"}&dir=${dir ? dir : "asc"}&offset=0`;

      // console.log({ urlV1Market, params })
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
    const urlV2Market = `${MARKET_API_HOST}/market/bsv21${id ? `/${id}` : term ? `/search/${term}` : ""
      }?limit=500&sort=${sort ? sort : "most_recent_sale"}&dir=${dir ? dir : "asc"}&offset=0`;

    // console.log({ urlV2Market })
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
