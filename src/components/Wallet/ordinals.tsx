"use client";

import { AssetType } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import { useLocalStorage } from "@/utils/storage";
import { computed } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { Noto_Serif } from "next/font/google";
import { FaSpinner } from "react-icons/fa";
import OrdinalListings, { OrdViewMode } from "../OrdinalListings";
import SAFU from "./safu";
import WalletTabs from "./tabs";

const notoSerif = Noto_Serif({
  style: "italic",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const WalletOrdinals = ({
  address: addressProp,
  onClick,
}: {
  address?: string;
  onClick?: (outpoint: string) => Promise<void>;
}) => {
  useSignals();
  const [encryptedBackup] = useLocalStorage<string | undefined>(
    "encryptedBackup"
  );
  console.log({ ordAddress: ordAddress.value, addressProp, encryptedBackup });

  const locked = computed(() => !ordAddress.value && !!encryptedBackup);

  if (locked.value) {
    return <SAFU />;
  }

  if (!ordAddress.value) {
    return (
      <div className="mx-auto animate-spin w-fit flex flex-col items-center justify-center min-h-[80vh]">
        <FaSpinner />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className={`${"mb-12"} mx-auto w-full max-w-7xl`}>
        <div className="flex flex-col items-center justify-center w-full h-full">
          <WalletTabs
            type={AssetType.Ordinals}
            address={addressProp}
          />
          <div className="w-full min-h-[80vh] tab-content bg-base-100 border-base-200 rounded-box p-2 md:p-6 flex flex-col md:flex-row md:max-w-7xl">
            <OrdinalListings
              address={addressProp || ordAddress.value}
              mode={OrdViewMode.Grid}
              onClick={onClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletOrdinals;
