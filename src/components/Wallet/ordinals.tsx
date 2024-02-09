"use client";

import { AssetType } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import { useSignals } from "@preact/signals-react/runtime";
import OrdinalListings, { OrdViewMode } from "../OrdinalListings";
import WalletTabs from "./tabs";

const WalletOrdinals = ({ address: addressProp }: { address?: string }) => {
  useSignals();
  if (!ordAddress.value) {
    return null;
  }

  return (
    <div className="overflow-x-auto">
    <div className={`${"mb-12"} mx-auto w-full max-w-5xl`}>
    <div className="flex flex-col items-center justify-center w-full h-full max-w-5xl">
      <WalletTabs type={AssetType.Ordinals} address={addressProp} />
      <div className="min-h-[90vh] tab-content bg-base-100 border-base-200 rounded-box p-2 md:p-6 flex flex-col md:flex-row">
        <OrdinalListings address={ordAddress.value} mode={OrdViewMode.Grid} />
      </div>
    </div>
    </div>
    </div>
  );
};

export default WalletOrdinals;
