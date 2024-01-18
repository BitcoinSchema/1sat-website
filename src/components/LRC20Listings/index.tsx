"use client";

import { OrdUtxo } from "@/types/ordinals";
import { Suspense } from "react";
import TokenListingSkeleton from "../skeletons/listing/Token";
import List from "./list";

interface LRC20ListingsProps {
  listings: OrdUtxo[];
  tokens: OrdUtxo[];
}


const LRC20Listings: React.FC<LRC20ListingsProps> = ({ listings, tokens }) => {
  return (
    <div>
      <div className="w-full">
        <table className="table font-mono">
          <thead>
            <tr>
              <th className="min-w-16">Ticker</th>
              <th className="">Amount</th>
              <th className="text-right w-full">Sats / Token</th>
              <th className="text-right min-w-48">Total Price</th>
            </tr>
          </thead>
            <Suspense fallback={<TokenListingSkeleton />}>
              <List listings={listings} tokens={tokens} />
            </Suspense>
        
        </table>
      </div>
    </div>
  );
};

export default LRC20Listings;
