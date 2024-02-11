"use client";

import {
  bsvWasmReady, usdRate
} from "@/signals/wallet";
import { effect } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import init from "bsv-wasm-web";
import Link from "next/link";
import { FaStore } from "react-icons/fa";
import { toSatoshi } from "satoshi-bitcoin-ts";
let initAttempted = false;

const MarketMenu: React.FC = () => {
  useSignals();
  effect(() => {
    const fire = async () => {
      await init();
      bsvWasmReady.value = true;
    };
    if (!initAttempted && bsvWasmReady.value === false) {
      initAttempted = true;
      fire();
    }
  });

  return (
    <div className="dropdown dropdown-end">
      <div
        className="btn btn-ghost m-1 rounded relative"
        tabIndex={0}
        role="button"
      >
        <FaStore />
      </div>

      <div className="dropdown-content z-[20] menu shadow bg-base-100 rounded-box w-64">
        <>
          <ul className="p-0">
            <li>1 BSV = ${usdRate.value * toSatoshi(1)}</li>
            <li>
              <Link href="/market/ordinals">Ordinals</Link>
            </li>
            <li>
              <Link href="/market/bsv20">BSV20</Link>
            </li>
            <li>
              <Link href="/market/bsv21">BSV21</Link>
            </li>
          </ul>
        </>
      </div>
    </div>
  );
};

export default MarketMenu;
