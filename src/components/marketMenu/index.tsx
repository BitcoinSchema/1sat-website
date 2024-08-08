"use client";

import { exchangeRate } from "@/signals/wallet";
import { ordAddress } from "@/signals/wallet/address";

import { useSignals } from "@preact/signals-react/runtime";
import Link from "next/link";
import { CgSpinner } from "react-icons/cg";
import { FaStore } from "react-icons/fa";

const MarketMenu: React.FC = () => {
  useSignals();
  const address = ordAddress.value;
  
  return (
    <>
      <div className="hidden md:block dropdown dropdown-end">
        {exchangeRate.value > 0 && (
          <div className="relative rounded bg-[#111] px-1 mr-2 text-sm text-[#555] pointer-events-none">
            1 BSV ={" "}
            <span className="text-emerald-300/50">
              ${exchangeRate.value.toFixed(2)}
            </span>
          </div>
        )}
        {address && !exchangeRate.value && (
          <div className="relative rounded bg-[#111] px-1 mr-2 text-sm text-[#555] pointer-events-none">
            <CgSpinner className="animate-spin" />
          </div>
        )}
      </div>
      <div className="dropdown dropdown-end">
        <div
          className="btn btn-ghost m-1 rounded relative"
          tabIndex={0}
          role="button"
        >
          <div className="tooltip tooltip-bottom" data-tip="Market">
            <FaStore />
          </div>
        </div>

        <ul
          // biome-ignore lint/a11y/noNoninteractiveTabindex: <explanation>
          tabIndex={0}
          className="dropdown-content z-[20] menu shadow bg-base-100 rounded-box w-64 border border-yellow-200/25 "
        >
          <div className="divider">Collectables</div>

          <li>
            <Link
              href="/market/ordinals"
              className="flex items-center justify-between"
            >
              <div>Market Listings</div>
              <div className="text-[#555]">NFT</div>
            </Link>
          </li>
          <li>
            <Link
              href="/collection"
              className="flex items-center justify-between"
            >
              <div>Collections</div>
              <div className="text-[#555]">NFT</div>
            </Link>
          </li>
          <div className="divider">Token Market</div>
          <li>
            <Link
              className="flex items-center justify-between"
              href="/market/bsv20"
            >
              BSV20 <div className="text-[#555]">FT</div>
            </Link>
          </li>
          <li>
            <Link
              className="flex items-center justify-between"
              href="/market/bsv21"
            >
              BSV21 <div className="text-[#555]">FT</div>
            </Link>
          </li>
        </ul>
      </div>
    </>
  );
};

export default MarketMenu;
