"use client";

import { OrdUtxo } from "@/types/ordinals";
import { toBitcoin } from "satoshi-bitcoin-ts";

interface ModelListingsProps {
  listings: OrdUtxo[];
}

const listingName = (listing: OrdUtxo) => {
  if (listing.origin?.data?.bsv20) {
    return listing.origin.data.bsv20.tick
  }
}

const listingAmount = (listing: OrdUtxo) => {
  if (listing.origin?.data?.bsv20) {
    return listing.origin.data.bsv20.amt
  }
}

const satsPerModel = (listing: OrdUtxo) => {
  if (listing.origin?.data?.bsv20) {
    const price = listing.data?.list?.price || 0
    const amt = parseInt(listing.origin.data.bsv20.amt || '0')
    return Math.floor(price / amt)
  }
  return 0
}

const ModelListings: React.FC<ModelListingsProps> = ({ listings }) => {
  return (
    <div>
      <div className="w-full">
        <table className="table">
          {/* head */}
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Amount</th>
              <th>Sats / Model</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody className="overflow-auto">
            {listings.map((listing) => {
              return (
                <tr key={`${listing.txid}-${listing.vout}-${listing.height}`}>
                  <th className="truncase text-ellipsis">
                  {listingName(listing)}
                  </th>
                  <td>{listingAmount(listing)}</td>
                  <td>{satsPerModel(listing)}</td>
                  <td className="break-normal">
                    {toBitcoin(listing.data?.list?.price || "0", true).toString()}{" "}
                    BSV
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ModelListings;
