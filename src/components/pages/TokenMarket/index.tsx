import TokenListingSkeleton from "@/components/skeletons/listing/Token";
import { type AssetType, MARKET_API_HOST, type SortBy } from "@/constants";
import { NextRequest } from "next/server";
import { Suspense } from "react";
import Details from "./details";
import List, { type MarketData } from "./list";
import TableHeading from "./tableHeading";
import { Table } from "@/components/ui/table";

interface TokenMarketProps {
  type: AssetType.BSV20 | AssetType.BSV21;
  id?: string;
  term?: string;
  sort?: SortBy;
  dir?: "asc" | "desc";
}

const TokenMarket: React.FC<TokenMarketProps> = async ({ type, id, sort, dir }) => {

  let marketData: MarketData[] = [];
  const url = `${MARKET_API_HOST}/market/${type}` // ?sort=${sort || SortBy.MostRecentSale}&dir=${dir || "asc"}&limit=100`;
  marketData = await getMarketData(new NextRequest(url), type, id, sort, dir);

  if (!marketData.length) {
    return <div className="text-center font-mono text-muted-foreground py-8 uppercase tracking-wider">No data found</div>;
  }

  const ticker = (marketData || []).find((t) => t.tick === id || t.id === id);
  return (
    <>
      {!id && (
        <div className="w-full overflow-x-auto bg-background">
          <Table className="w-full font-mono text-sm">
            <TableHeading type={type} sortable={true} />
            <Suspense fallback={<TokenListingSkeleton type={type}/>}>
              <List type={type} sort={sort} dir={dir} />
            </Suspense>
          </Table>
        </div>
      )}
      {id && (
        <>
          <Suspense fallback={<TokenListingSkeleton type={type} />}>
            <div className="overflow-x-auto w-full bg-background">
              <Table className="w-full font-mono text-sm">
                <TableHeading type={type} sortable={false} />
                <List type={type} id={id} sort={sort} dir={dir} ticker={ticker} />
              </Table>
            </div>
            <Details type={type} id={id} marketData={marketData} />
          </Suspense>
        </>
      )}
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
      params: Promise.resolve({
        tab: type,
        type,
        id,
      }),
    })
  ).json();

  return (json || []) as MarketData[];
};
