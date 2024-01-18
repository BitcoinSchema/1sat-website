"use client";

import { AssetType } from "@/constants";
import Link from "next/link";
const ListingsTabs = ({ selectedTab }: { selectedTab: AssetType }) => {
  return (
    <div role="tablist" className="tabs tabs-lifted ml-4 gap-2 w-64">
      <Link
        href={`/listings/${AssetType.Ordinals}`}
        role="tab"
        className={`tab ${
          selectedTab === AssetType.Ordinals ? "tab-active" : ""
        }`}
        aria-label="Ordinals"
      >
        Ordinals
      </Link>

      <Link
        href={`/listings/${AssetType.BSV20}`}
        role="tab"
        className={`tab ${
          selectedTab === AssetType.BSV20 ? "tab-active" : ""
        }`}
        aria-label="BSV20"
      >
        BSV20
      </Link>

      <Link
        href={`/listings/${AssetType.LRC20}`}
        role="tab"
        className={`tab ${
          selectedTab === AssetType.LRC20 ? "tab-active" : ""
        }`}
        aria-label="LRC20"
      >
        LRC20
      </Link>

      <Link
        href={`/listings/${AssetType.BSV20V2}`}
        role="tab"
        className={`tab ${
          selectedTab === AssetType.BSV20V2 ? "tab-active" : ""
        }`}
        aria-label="BSV20V2"
      >
        BSV20v2
      </Link>
    </div>
  );
};

export default ListingsTabs;
