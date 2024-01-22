import { API_HOST, AssetType, resultsPerPage } from "@/constants";
import { BSV20TXO } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { toBitcoin } from "satoshi-bitcoin-ts";

const Bsv20List = async ({
  type,
  address
}: {
  type: AssetType.BSV20 | AssetType.BSV20V2;
  address: string;
}) => {

    // // get unspent ordAddress
    // useSignals();
    // const bsv20s = useSignal<BSV20TXO[] | null>(null);
    // effect(() => {
    //   const fire = async () => {
    //     bsv20s.value = [];
    //     const { promise } = http.customFetch<BSV20TXO[]>(
    //       `${API_HOST}/api/txos/address/${ordAddress.value}/unspent?limit=${resultsPerPage}&offset=0&dir=DESC&status=all&bsv20=true`
    //     );
    //     const u = await promise;
    //     bsv20s.value = u;
    //   }
    //   if (!bsv20s.value && ordAddress.value) {
    //     fire();
    //   }
    // });

    

  let listings: BSV20TXO[] = [];
  if (type === AssetType.BSV20) {
    const urlTokens = `${API_HOST}/api/bsv20/${address}/unspent?limit=${resultsPerPage}&offset=0&dir=asc&type=v1`;
    const { promise: promiseBsv20 } = http.customFetch<BSV20TXO[]>(urlTokens);
    listings = await promiseBsv20;
  } else {
    const urlV2Tokens = `${API_HOST}/api/bsv20/${address}/unspent?limit=${resultsPerPage}&offset=0&dir=asc&type=v2`;
    const { promise: promiseBsv20v2 } =
      http.customFetch<BSV20TXO[]>(urlV2Tokens);
    listings = await promiseBsv20v2;
  }

  console.log({listings})
  return (
    <tbody className="overflow-auto">
      {listings
        .sort((a, b) => {
          return parseFloat(a.pricePer) < parseFloat(b.pricePer) ? -1 : 1;
        })
        .map((listing) => {
          return (
            <tr key={`${listing.txid}-${listing.vout}-${listing.height}`}>
              <th className="truncase text-ellipsis">{listingName(listing)}</th>
              <td>{listingAmount(listing)}</td>
              <td className="w-full text-right">{satsPerToken(listing)}</td>
              <td className="break-normal text-right w-96">
                {toBitcoin(listing.price || "0", true).toString()} BSV
              </td>
            </tr>
          );
        })}
    </tbody>
  );
};

export default Bsv20List;

const listingName = (listing: BSV20TXO) => {
  return listing.id ? listing.sym : listing.tick;
};

const listingAmount = (listing: BSV20TXO) => {
  return listing.amt;
};

const satsPerToken = (listing: BSV20TXO) => {
  return Math.floor(parseInt(listing.pricePer));
};
