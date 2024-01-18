import { AssetType } from "@/constants";
import * as http from "@/utils/httpClient";
    type MarketData = {
      tick: string;
      price: string;
      marketCap: string;
      holders: number;
    }
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

const List = async ({
  type,
}: {
  type: AssetType.BSV20 | AssetType.BSV20V2;
}) => {
//  let listings: BSV20TXO[] = [];
  let marketData: MarketData[] = [];
  if (type === AssetType.BSV20) {
    // const urlTokens = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=20&offset=0&type=v1`;
    // const { promise: promiseBsv20 } = http.customFetch<BSV20TXO[]>(urlTokens);
    // listings = await promiseBsv20;

    const urlV1Market = `https://1sat-api-production.up.railway.app/market/bsv20`;
    const { promise: promiseBsv20v1Market } =
      http.customFetch<MarketData[]>(urlV1Market);
    marketData = await promiseBsv20v1Market;
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
        .map((ticker) => {
          return (
            <tr key={`${ticker.tick}`}>
              <th className="truncase text-ellipsis">{ticker.tick}</th>
              <td>{ticker.price}</td>
              <td className="w-full text-right">{ticker.marketCap}</td>
              <td className="break-normal text-right w-96">
                {ticker.holders}
              </td>
            </tr>
          );
        })}
    </tbody>
  );
};

export default List;
