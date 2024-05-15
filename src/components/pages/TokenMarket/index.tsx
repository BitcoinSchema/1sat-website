import TokenListingSkeleton from "@/components/skeletons/listing/Token";
import { AssetType, MARKET_API_HOST } from "@/constants";
import { NextRequest } from "next/server";
import { Suspense } from "react";
import TickerContent from "./content";
import Details from "./details";
import List, { type MarketData } from "./list";

interface TokenMarketProps {
  type: AssetType.BSV20 | AssetType.BSV21;
  id?: string;
  term?: string;
}

const TableHeading = ({ type }: { type: AssetType.BSV20 | AssetType.BSV21 }) => {
  return <thead>
    <tr>
      <th className="min-w-16">Ticker</th>
      <th className="w-1/2">Recent Price</th>
      <th className="">Pct Change</th>
      <th className="text-right flex-1">Market Cap</th>
      {type === AssetType.BSV21 && (
        <th className="text-center w-12">Contract</th>
      )}
      <th
        className={`${type === AssetType.BSV21 ? "w-48" : "w-96"
          } text-right`}
      >
        Holders
      </th>
    </tr>
  </thead>
}

const TokenMarket: React.FC<TokenMarketProps> = async ({ type, id }) => {

  let marketData: MarketData[] = [];
  const url = `${MARKET_API_HOST}/market/${type}`;
  marketData = await getMarketData(new NextRequest(url), type, id);

  const ticker = marketData.find((t) => t.tick === id || t.id === id);
  return (
    <>
      {!id && <div className="w-full rounded-b-box overflow-x-auto"><table className="table font-mono">
        <TableHeading type={type} />
        <Suspense fallback={<TokenListingSkeleton />}>
          <List type={type} />
        </Suspense>
      </table></div>}
      {id && <>
        <Suspense fallback={<TokenListingSkeleton />}>
          <div className="overflow-x-auto w-full">
            <table className="table font-mono">
              <TableHeading type={type} />
              <List type={type} id={id} />
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
          <Details type={type} id={id} marketData={marketData} />
        </Suspense>
      </>
      }</>
  );
};

export default TokenMarket;


const getMarketData = async (
  req: NextRequest,
  type: AssetType,
  id?: string
) => {
  const res = await import("../../../app/market/[tab]/list/route");
  const json = await (
    await res.POST(req, {
      params: {
        type,
        id,
      },
    })
  ).json();

  return (json || []) as MarketData[];
};
