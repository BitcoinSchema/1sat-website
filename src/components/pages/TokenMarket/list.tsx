import { AssetType } from "@/constants";
import { Listing } from "@/types/bsv20";
import { BSV20TXO } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import React from "react";
import TickerContent from "./content";
import TickerHeading from "./heading";

export type MarketData = {
  tick: string;
  price: string;
  marketCap: string;
  holders: number;
  dec: number;
  listings?: Listing[];
  sales?: BSV20TXO[];
  pctChange: number;
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
type ChainInfo = {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  mediantime: number;
  verificationprogress: number;
  pruned: boolean;
  chainwork: string;
};

const List = async ({
  type,
  id,
}: {
  type: AssetType.BSV20 | AssetType.BSV20V2;
  id?: string;
}) => {
  // get the current block height
  const statusUrl = `https://1sat-api-production.up.railway.app/status`;
  const { promise: promiseStatus } = http.customFetch<{
    exchangeRate: number;
    chainInfo: ChainInfo;
  }>(statusUrl);
  const { chainInfo, exchangeRate } = await promiseStatus;
  console.log({ chainInfo, exchangeRate });

  //  let listings: BSV20TXO[] = [];
  let marketData: MarketData[] = [];
  if (type === AssetType.BSV20) {
    // const urlTokens = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=20&offset=0&type=v1`;
    // const { promise: promiseBsv20 } = http.customFetch<BSV20TXO[]>(urlTokens);
    // listings = await promiseBsv20;
if (id) {
    const urlV1Market = `https://1sat-api-production.up.railway.app/market/bsv20/${id}`;
    const { promise: promiseBsv20v1Market } =
      http.customFetch<MarketData>(urlV1Market);
    marketData = [(await promiseBsv20v1Market)]
} else {
      const urlV1Market = `https://1sat-api-production.up.railway.app/market/bsv20`;
    const { promise: promiseBsv20v1Market } =
      http.customFetch<MarketData[]>(urlV1Market);
    marketData = await promiseBsv20v1Market;
    }
  } else {
    // const urlV2Tokens = `${API_HOST}/api/bsv20/v2?sort=fund_total&dir=desc&limit=20&offset=0&included=true`;
    // const { promise: promiseBsv20v2 } =
    //   http.customFetch<BSV20TXO[]>(urlV2Tokens);
    // listings = await promiseBsv20v2;

    // aggregated market data from the API
    const urlV2Market = `https://1sat-api-production.up.railway.app/market/bsv20v2`;
    const { promise: promiseBsv20v2Market } =
      http.customFetch<MarketData[]>(urlV2Market);
    marketData = await promiseBsv20v2Market;
  }
  console.log({ marketData });

  return (
    <tbody className="overflow-auto">
      {marketData
        .sort((a, b) => {
          return a.marketCap > b.marketCap ? -1 : 1;
        })
        .map((ticker, idx) => {
          // calculate pct change based on sales

          //           <div tabindex="0" class="collapse bg-base-200">
          //   <div class="collapse-title text-xl font-medium">
          //     Focus me to see content
          //   </div>
          //   <div class="collapse-content">
          //     <p>tabindex="0" attribute is necessary to make the div focusable</p>
          //   </div>
          // </div>
          return (
            <React.Fragment key={`${ticker.tick}-${idx}`}>
              <TickerHeading ticker={ticker} id={id} type={type} />
              <TickerContent ticker={ticker} currentHeight={chainInfo.blocks} show={ticker.tick === id} />
            </React.Fragment>
          );
        })}
    </tbody>
  );
};

export default List;
