import TokenListingSkeleton from "@/components/skeletons/listing/Token";
import { type AssetType, MARKET_API_HOST, SortBy } from "@/constants";
import { NextRequest } from "next/server";
import { Suspense } from "react";
import TickerContent from "./content";
import Details from "./details";
import List, { type MarketData } from "./list";
import TableHeading from "./tableHeading";

interface TokenMarketProps {
  type: AssetType.BSV20 | AssetType.BSV21;
  id?: string;
  term?: string;
  sort?: SortBy;
  dir?: "asc" | "desc";
}

const TokenMarket: React.FC<TokenMarketProps> = async ({ type, id, sort, dir }) => {

  let marketData: MarketData[] = [];
  const url = `${MARKET_API_HOST}/market/${type}?sort=${sort || SortBy.MostRecentSale}&dir=${dir || "asc"}`;
  marketData = await getMarketData(new NextRequest(url), type, id, sort, dir);

  const ticker = marketData.find((t) => t.tick === id || t.id === id);
  return (
    <>
      {!id && <div className="w-full rounded-b-box overflow-x-auto"><table className="table font-mono">
        <TableHeading type={type} />
        <Suspense fallback={<TokenListingSkeleton />}>
          <List type={type} sort={sort} dir={dir} />
        </Suspense>
      </table></div>}
      {id && <>
        <Suspense fallback={<TokenListingSkeleton />}>
          <div className="overflow-x-auto w-full">
            <table className="table font-mono">
              <TableHeading type={type} />
              <List type={type} id={id} sort={sort} dir={dir} />
              <tr>
                <td colSpan={6} className="p-0">
                  {ticker && <TickerContent
                    ticker={ticker}
                    show={true}
                    type={type}
                  />}
                </td>
              </tr>
            </table>
          </div>
          <Details type={type} id={id} 
          marketData={marketData}
           />
        </Suspense>
      </>}
      </>
  );
};

export default TokenMarket;

const getMarketData = async (
  req: NextRequest,
  type: AssetType,
  id?: string,
  sort?: SortBy,
  dir?: "asc" | "desc"
) => {
  // Clone the original request URL and add the search parameters
  const url = new URL(req.url);
  if (sort) url.searchParams.set("sort", sort);
  if (dir) url.searchParams.set("dir", dir);

  // Create a new request object with the modified URL
  const modifiedRequest = new NextRequest(url.toString(), req);

  const res = await import("../../../app/market/[tab]/list/route");
  const json = await (
    await res.POST(modifiedRequest, {
      params: {
        type,
        id,
      },
    })
  ).json();

  return (json || []) as MarketData[];
};
