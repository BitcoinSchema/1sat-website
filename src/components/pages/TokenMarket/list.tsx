import { AssetType } from "@/constants";
import { NextRequest } from "next/server";
import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import TickerContent from "./content";
import Fund from "./fund";
import TickerHeading from "./heading";

export interface Holder {
  address: string;
  amt: string;
}

export type MarketData = {
  accounts: number;
  tick?: string;
  id: string;
  sym?: string;
  price: number;
  marketCap: number;
  holders: Holder[];
  dec: number;
  pctChange: number;
  fundAddress: string;
  fundTotal: string;
  fundUsed: string;
  fundBalance: string;
  included: boolean;
  pendingOps: number;
  icon?: string;
  supply?: string;
  max?: string;
  txid: string;
  vout: number;
  amt?: string;
  num: number;
};

// https://ordinals.gorillapool.io/api/bsv20/id/8677c7600eab310f7e5fbbdfc139cc4b168f4d079185facb868ebb2a80728ff1_0?refresh=false
// example response:

// {
//   "txid": "8677c7600eab310f7e5fbbdfc139cc4b168f4d079185facb868ebb2a80728ff1",
//   "vout": 0,
//   "height": 821854,
//   "idx": "8418",
//   "id": "8677c7600eab310f7e5fbbdfc139cc4b168f4d079185facb868ebb2a80728ff1_0",
//   "sym": "VIBES",
//   "icon": "87f1d0785cf9b4951e75e8cf9353d63a49f98e9b6b255bcd6a986db929a00472_0",
//   "amt": "2100000000000000",
//   "dec": 8,
//   "accounts": "105",
//   "pending": "6",
//   "fundAddress": "1FtQS5rc4d9Sr8euV9XQ744WGKBbngx3on",
//   "fundTotal": "1296634",
//   "fundUsed": "751000",
//   "fundBalance": "545634"
// }

// {
//   "chain": "main",
//   "blocks": 635302,
//   "headers": 635299,
//   "bestblockhash": "000000000000000002a40d7410a6c08109521c14f4cf354e7b352b4eab8aa4ea",
//   "difficulty": 287310033717.7086,
//   "mediantime": 1589703256,
//   "verificationprogress": 0.9999754124031851,
//   "pruned": false,
//   "chainwork": "0000000000000000000000000000000000000000010969f724913e0fe59377f4"
// }

const List = async ({
  type,
  id,
}: {
  type: AssetType.BSV20 | AssetType.BSV21;
  id?: string;
}) => {

  let marketData: MarketData[] = [];
  const url = `https://1sat-api-production.up.railway.app/market/${type}`;
  marketData = await getMarketData(new NextRequest(url), type, id);

  // get the current block height

  //  let listings: BSV20TXO[] = [];
  // if (type === AssetType.BSV20) {
  //   // const urlTokens = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=20&offset=0&type=v1`;
  //   // const { promise: promiseBsv20 } = http.customFetch<BSV20TXO[]>(urlTokens);
  //   // listings = await promiseBsv20;
  //   let urlV1Market = "https://1sat-api-production.up.railway.app/market/bsv20";
  //   if (id) {
  //     urlV1Market = `https://1sat-api-production.up.railway.app/market/bsv20/${id}`;
  //   }
  //   const { promise: promiseBsv20v1Market } =
  //     http.customFetch<MarketData[]>(urlV1Market);
  //   marketData = (await promiseBsv20v1Market)
  //   .sort((a, b) => {
      
  //     if (a.pendingOps * 1000 > parseInt(a.fundBalance)) {
  //       return 1;
  //     }
  //     if (b.pendingOps * 1000 > parseInt(b.fundBalance)) {
  //       return -1;
  //     }
  //     return a.num < b.num ? -1 : 1;
  //     // return a.marketCap > b.marketCap ? -1 : 1;
  //   });
  // } else {
  //   // aggregated market data from the API
  //   let urlV2Market = "https://1sat-api-production.up.railway.app/market/bsv21";
  //   if (id) {
  //     urlV2Market = `https://1sat-api-production.up.railway.app/market/bsv21/${id}`;
  //   }
  //   const { promise: promiseBsv21Market } =
  //     http.customFetch<MarketData[]>(urlV2Market);
  //   marketData = (await promiseBsv21Market)
  //   .sort((a, b) => {
  //     if (a.pendingOps * 1000 > parseInt(a.fundBalance)) {
  //       return 1;
  //     }
  //     if (b.pendingOps * 1000 > parseInt(b.fundBalance)) {
  //       return -1;
  //     }
  //     return a.marketCap > b.marketCap ? -1 : 1;
  //   });
  // }


  // do the above, but with infinite query

  return (
    <tbody className="overflow-auto">
      {marketData.map((ticker, idx) => {
        const showBsv20Content =
        type === AssetType.BSV20 &&
        ticker.tick?.toLowerCase() === id?.toLowerCase();
        const showBsv21Content =
        type === AssetType.BSV21 &&
        ticker.id.toLowerCase() === id?.toLowerCase();
        return (
          <React.Fragment key={`${ticker.tick}-${idx}`}>
            <TickerHeading ticker={ticker} id={id} type={type} />
            {ticker.included && (showBsv20Content || showBsv21Content) && (
              <TickerContent ticker={ticker} show={true} type={type} />
            )}
            {!ticker.included && (
              <tr>
                <td colSpan={5} className="">
                  <div className="max-w-lg mx-auto">
                    <div className="bg-warning/50 text-warning-content p-2 rounded my-4 w-full flex items-center">
                      <FaExclamationTriangle className="mr-2 text-warning" />
                      {"This ticker is not currently listed."}
                    </div>
                    <Fund ticker={ticker} />
                  </div>
                </td>
              </tr>
            )}
          </React.Fragment>
        );
      })}
    </tbody>
  );
};

export default List;

const getMarketData = async (req: NextRequest, type: AssetType, id?: string) => {
	const res = await import("../../../app/market/[tab]/list/route");
	const json = await (
		await res.POST(req, {
			params: {
        type,
        id
			},
		})
	).json();

	return json || ([] as MarketData[]);
};
