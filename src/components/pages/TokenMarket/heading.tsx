"use client";

import { AssetType } from "@/constants";
import { Signal, computed } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useRouter } from "next/navigation";
import { toBitcoin } from "satoshi-bitcoin-ts";
import { MarketData } from "./list";

export const showContent = new Signal<string | null>(null);

const TickerHeading = ({ ticker, id, type }: { ticker: MarketData; id?: string, type: AssetType }) => {
  useSignals();
  const router = useRouter();
  const change = computed(() => {
    // Check if there are any sales to calculate the change

    // Format the change for display, adding a plus sign for positive changes
    if (!ticker.pctChange || ticker.pctChange === 0) {
      return "0.00%";
    }
    return ticker.pctChange > 0
      ? `+${ticker.pctChange.toFixed(2)}%`
      : `${ticker.pctChange.toFixed(2)}%`;
    // Assuming 'change' should be used hereafter
  });

  const show = computed(() => {
    return !!id; // showContent.value === ticker.tick;
  });

  console.log({
    showContent: showContent.value,
    ticker: ticker.tick,
    show: show.value,
  });
  return (
    <tr
      onClick={() => router.push(`/market/${type}/${ticker.tick}`)}
      className={`transition cursor-pointer ${
        show.value
          ? "active text-xl text-base-content hover:text-secondary-content"
          : ""
      }`}
    >
      <th className="truncase text-ellipsis">{ticker.tick}</th>
      <td>
        {parseInt(ticker.price).toLocaleString()}{" "}
        <span className="text-accent">sat/token</span>
      </td>
      <td>
        <span
          className={`ml-2 ${
            ticker.pctChange > 0 ? "text-emerald-400" : "text-orange-700"
          }`}
        >
          {change}
        </span>
      </td>
      <td className="w-full text-right">
        {toBitcoin(parseInt(ticker.marketCap || "0"))} BSV
        <br />
      </td>
      <td className="break-normal text-right w-96">{ticker.holders}</td>
    </tr>
  );
};

export default TickerHeading;
