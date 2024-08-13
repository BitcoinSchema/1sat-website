import { AssetType } from "@/constants";
import React from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import Fund from "./fund";
import { TokenMarketTabs } from "./tokenMarketTabs";
import { TxoData } from "@/types/ordinals";

export interface Holder {
  address: string;
  amt: string;
}

export interface TickHolder {
  address: string;
  amt: number;
  pct: number;
}

export type MarketData = {
  accounts: number;
  tick?: string;
  id: string;
  sym?: string;
  price: number;
  marketCap: number;
  holders: Holder[];
  data: TxoData;
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
  contract?: "pow-20" | "LockToMintBsv20" | undefined;
  difficulty?: string | undefined;
  startingreward?: string | undefined;
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

const Details = async ({
  type,
  id,
  marketData,
}: {
  type: AssetType.BSV20 | AssetType.BSV21;
  id?: string;
  marketData: MarketData[];
}) => {
  return (
    <div className="overflow-auto w-full">
      {marketData.map((ticker, idx) => {
        const showBsv20Content =
          type === AssetType.BSV20 &&
          ticker.tick?.toLowerCase() === id?.toLowerCase();
        const showBsv21Content =
          type === AssetType.BSV21 &&
          ticker.id.toLowerCase() === id?.toLowerCase();
        return (<React.Fragment key={`${ticker.tick}-content`}>
          {ticker.included &&
            (showBsv20Content || showBsv21Content) && (
              <div className="transition bg-base-200 font-mono text-xs">
                <div className="align-top">
                  <TokenMarketTabs
                    ticker={ticker}
                    show={true}
                    type={type}
                  />
                </div>
              </div>

            )}
          {!ticker.included && (
            <div className="w-full">
              <div className="max-w-lg mx-auto">
                <div className="bg-warning/50 text-warning-content p-2 rounded my-4 w-full flex items-center">
                  <FaExclamationTriangle className="mr-2 text-warning" />
                  {
                    "This ticker is not currently listed."
                  }
                </div>
                <Fund ticker={ticker} />
              </div>
            </div>
          )}
        </React.Fragment>);
      })}
    </div>
  );
};

export default Details;

