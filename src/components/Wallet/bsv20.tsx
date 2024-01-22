"use client"

import { AssetType } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import { useSignals } from "@preact/signals-react/runtime";
import { Suspense } from "react";
import TokenListingSkeleton from "../skeletons/listing/Token";
import Bsv20List from "./bsv20List";

const WalletBsv20 = () => {
  useSignals()
const address = ordAddress.value
  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      
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
              <Bsv20List type={AssetType.BSV20}  address={address!} />
            </Suspense>
          </table>
        </div>
   
    </div>
  );
};

export default WalletBsv20;



