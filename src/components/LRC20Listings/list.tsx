import { OrdUtxo } from "@/types/ordinals";
import { toBitcoin } from "satoshi-bitcoin-ts";

const List = ({
  listings,
  tokens,
}: {
  listings: OrdUtxo[];
  tokens: OrdUtxo[];
}) => {
  return (
    <tbody>
      {listings
        .sort((a, b) => {
          // sort by the price  sats/token
          return satsPerToken(a) < satsPerToken(b) ? -1 : 1;
        })
        .map((listing) => {
          const token = tokens.find((t) => {
            return t.origin?.outpoint === listing.origin?.data?.insc?.json?.id;
          })?.origin?.data?.insc?.json;
          if (!token || !token?.origin?.outpoint) {
            // console.log({id:listing.origin?.data?.insc?.json?.id, tokenOrigin: token?.origin?.outpoint, token})
          }
          return (
            <tr key={`${listing.txid}-${listing.vout}-${listing.height}`}>
              <th className="truncase text-ellipsis">{token?.tick}</th>
              <td>{listingAmount(listing)}</td>
              <td className="text-right">{satsPerToken(listing)}</td>
              <td className="text-right break-normal">
                {toBitcoin(listing.data?.list?.price || "0", true).toString()}{" "}
                BSV
              </td>
            </tr>
          );
        })}
    </tbody>
  );
};

export default List;

const listingAmount = (listing: OrdUtxo) => {
  if (listing.origin?.data?.insc?.json) {
    return listing.origin.data.insc.json.amt;
  }
};

const satsPerToken = (listing: OrdUtxo) => {
  if (listing.origin?.data?.insc) {
    const price = listing.data?.list?.price || 0;
    const amt = parseInt(listing.origin.data.insc.json.amt || "0");
    return Math.floor(price / amt);
  }
  return 0;
};
