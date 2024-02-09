"use client"

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
    <div className="flex flex-col items-center justify-center w-full h-full">
      <WalletTabs type={AssetType.Ordinals} address={addressProp} />
      <div className="min-h-[90vh] h-full tab-content block bg-base-100 border-base-300 rounded-box p-2 md:p-6 w-[95vw] md:w-[64rem] mb-12">
        <OrdinalListings address={ordAddress.value} mode={OrdViewMode.Grid} />
      </div>
    </div>
  );
};

export default WalletOrdinals;
