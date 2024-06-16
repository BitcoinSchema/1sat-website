"use client";

import Filter from "@/components/Wallet/filter";
import { AssetType } from "@/constants";
import Link from "next/link";
import { FaPlus } from "react-icons/fa";
import { FaBitcoin, FaDollarSign } from "react-icons/fa6";
import { currencyDisplay, CurrencyDisplay } from "@/signals/wallet";

const CurrencySwitch = () => {
  return <div className="tooltip tooltip-left" data-tip="Currency Display">
    <label className="swap swap-flip text-xl mr-4 text-yellow-200/25">

    {/* this hidden checkbox controls the state */}
    <input type="checkbox" onChange={() => {
      currencyDisplay.value = currencyDisplay.value === "USD" ? "BSV" : "USD";
    }} />

    <div className={currencyDisplay.value === CurrencyDisplay.BSV ? "swap-on" : "swap-off"}><FaBitcoin className="-rotate-12" /></div>
    <div className={currencyDisplay.value === CurrencyDisplay.BSV ? "swap-off" : "swap-on"}><FaDollarSign /></div>
  </label>
  </div>
}

const MarketTabs = ({ selectedTab }: { selectedTab: AssetType }) => {
  return (
    <div className="flex w-full items-center justify-between">
      <div
        role="tablist"
        className="tabs md:tabs-lg tabs-lifted ml-4 gap-2 w-64"
      >
        <Link
          href={`/market/${AssetType.Ordinals}`}
          role="tab"
          className={`tab ${selectedTab === AssetType.Ordinals ? "tab-active" : ""
            }`}
          aria-label="Ordinals"
        >
          Ordinals
        </Link>

        <Link
          href={`/market/${AssetType.BSV20}`}
          role="tab"
          className={`tab ${selectedTab === AssetType.BSV20 ? "tab-active" : ""
            }`}
          aria-label="BSV20"
        >
          BSV20
        </Link>

        <Link
          href={`/market/${AssetType.BSV21}`}
          role="tab"
          className={`tab ${selectedTab === AssetType.BSV21 ? "tab-active" : ""
            }`}
          aria-label="BSV21"
        >
          BSV21
        </Link>
      </div>
      <div className="flex-none flex items-center">
        {selectedTab === AssetType.BSV21 || selectedTab === AssetType.BSV20 && <CurrencySwitch />}
        {selectedTab === AssetType.Ordinals && <Filter />}
        {selectedTab === AssetType.Ordinals && (
          <Link
            className="btn md:btn-xs md:relative absolute bottom-0 right-0 md:mr-0 mr-4 mb-4 md:mb-0 z-10 md:z-0 md:border-0 border border-yellow-200/25"
            href={`/market/${selectedTab}/new`}
          >
            <FaPlus /> List
          </Link>
        )}
      </div>
    </div>
  );
};

export default MarketTabs;
