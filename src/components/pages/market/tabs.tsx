"use client";

import { AssetType } from "@/constants";
import Link from "next/link";

const MarketTabs = ({ selectedTab }: { selectedTab: AssetType }) => {
  return (
    <div role="tablist" className="tabs tabs-lg tabs-lifted ml-4 gap-2 w-64">
      <Link
        href={`/market/${AssetType.Ordinals}`}
        role="tab"
        className={`tab ${
          selectedTab === AssetType.Ordinals ? "tab-active" : ""
        }`}
        aria-label="Ordinals"
      >
        Ordinals
      </Link>

      <Link
        href={`/market/${AssetType.BSV20}`}
        role="tab"
        className={`tab ${
          selectedTab === AssetType.BSV20 ? "tab-active" : ""
        }`}
        aria-label="BSV20"
      >
        BSV20
      </Link>

      <Link
        href={`/market/${AssetType.BSV21}`}
        role="tab"
        className={`tab ${
          selectedTab === AssetType.BSV21 ? "tab-active" : ""
        }`}
        aria-label="BSV21"
      >
        BSV21
      </Link>
      {/* <div className="flex-none">
        <Link className="btn btn-sm btn-square btn-ghost" href={`/inscribe?tab=${selectedTab === AssetType.Ordinals ? 'image' : selectedTab}`}>
          <FaPlus />
        </Link>
      </div> */}
    </div>
  );
};

export default MarketTabs;
