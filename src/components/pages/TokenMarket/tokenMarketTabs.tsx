"use client";

import CreateTokenListingModal from "@/components/modal/createTokenListing";
import { toastErrorProps, type AssetType } from "@/constants";
import { bsv20Balances } from "@/signals/wallet";
import { Signal, computed, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import clsx from "clsx";
import { head } from "lodash";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { FaPlus } from "react-icons/fa6";
import { useMediaQuery } from "usehooks-ts";
import type { MarketData } from "./list";
import { listings, myListings, mySales, sales } from "./signals";
import { TokenMarketListings } from "./tokenMarketListings";
import { TokenMarketMyListings } from "./tokenMarketMyListings";
import { TokenMarketMySales } from "./tokenMarketMySales";
import { TokenMarketSales } from "./tokenMarketSales";

interface Props {
  ticker: MarketData;
  show: boolean;
  type: AssetType.BSV20 | AssetType.BSV21;
}

export const showAddListingModal = new Signal<string | null>(null);

export function TokenMarketTabs({
  ticker,
  show,
  type,
}: Props) {
  useSignals();
  const selectedListingsTab = useSignal<"listings" | "my_listings">("listings");
  const selectedSalesTab = useSignal<"sales" | "my_sales">("sales");
  const selectedTab = useSignal<
    "listings" | "sales" | "my_listings" | "my_sales"
  >("listings");

  const mdUp = useMediaQuery('(min-width: 768px)');

  const addListing = (ticker: MarketData) => {
    console.log("show add listing modal", ticker, showAddListingModal.value);
    if (!ticker) {
      toast.error("No ticker found", toastErrorProps);
    }
    showAddListingModal.value = ticker.id || ticker.tick || null;
  };

  useEffect(() => {
    listings.value = [];
    sales.value = [];
    myListings.value = [];
    mySales.value = [];
  }, [ticker, type]);

  const hasBalance = computed(() => {
    return ticker && bsv20Balances.value?.some((b) => {
      return (b.tick === ticker.sym && b.all.confirmed - b.listed.confirmed > 0) || (b.tick === ticker.tick && b.all.confirmed - b.listed.confirmed > 0);
    });
  });

  const topListing = computed(() => head(listings.value))

  return ticker && (
    <div className="flex flex-col md:flex-row w-full items-start bg-background">
      {mdUp ? (
        <>
          <div className="relative w-1/2">
            <div className="flex border-b border-border mr-4 px-4">
              <button
                type="button"
                className={clsx("px-4 py-3 font-mono text-xs uppercase tracking-wider transition border-b-2 -mb-[1px]", {
                  "border-primary text-primary": selectedListingsTab.value === "listings",
                  "border-transparent text-muted-foreground hover:text-foreground": selectedListingsTab.value !== "listings",
                })}
                onClick={() => { selectedListingsTab.value = "listings"; }}
              >
                Listings
              </button>
              <button
                type="button"
                className={clsx("px-4 py-3 font-mono text-xs uppercase tracking-wider transition border-b-2 -mb-[1px]", {
                  "border-primary text-primary": selectedListingsTab.value === "my_listings",
                  "border-transparent text-muted-foreground hover:text-foreground": selectedListingsTab.value !== "my_listings",
                })}
                onClick={() => { selectedListingsTab.value = "my_listings"; }}
              >
                My Listings
              </button>
            </div>

            <div className="px-4 py-4">
              {selectedListingsTab.value === "listings" && (
                <TokenMarketListings ticker={ticker} show={show} type={type} />
              )}
              {selectedListingsTab.value === "my_listings" && (
                <TokenMarketMyListings ticker={ticker} type={type} />
              )}
            </div>

            {hasBalance.value && (
              <button
                type="button"
                onClick={() => addListing(ticker)}
                className="absolute right-4 top-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-yellow-900/30 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-900/50 transition flex items-center"
              >
                <FaPlus className="mr-1 w-3 h-3" />List {ticker.sym || ticker.tick}
              </button>
            )}
          </div>

          <div className="w-1/2">
            <div className="flex border-b border-border px-4">
              <button
                type="button"
                className={clsx("px-4 py-3 font-mono text-xs uppercase tracking-wider transition border-b-2 -mb-[1px]", {
                  "border-primary text-primary": selectedSalesTab.value === "sales",
                  "border-transparent text-muted-foreground hover:text-foreground": selectedSalesTab.value !== "sales",
                })}
                onClick={() => { selectedSalesTab.value = "sales"; }}
              >
                Recent Sales
              </button>
              <button
                type="button"
                className={clsx("px-4 py-3 font-mono text-xs uppercase tracking-wider transition border-b-2 -mb-[1px]", {
                  "border-primary text-primary": selectedSalesTab.value === "my_sales",
                  "border-transparent text-muted-foreground hover:text-foreground": selectedSalesTab.value !== "my_sales",
                })}
                onClick={() => { selectedSalesTab.value = "my_sales"; }}
              >
                My Sales
              </button>
            </div>

            <div className="px-4 py-4">
              {selectedSalesTab.value === "sales" && (
                <TokenMarketSales ticker={ticker} type={type} />
              )}
              {selectedSalesTab.value === "my_sales" && (
                <TokenMarketMySales ticker={ticker} type={type} />
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="w-full">
          <div className="flex flex-wrap border-b border-border p-2 gap-1">
            <button
              type="button"
              className={clsx("px-3 py-2 font-mono text-xs uppercase tracking-wider transition", {
                "bg-primary/20 text-primary border border-primary/50": selectedTab.value === "listings",
                "text-muted-foreground hover:text-foreground border border-border": selectedTab.value !== "listings",
              })}
              onClick={() => { selectedTab.value = "listings"; }}
            >
              Listings
            </button>
            <button
              type="button"
              className={clsx("px-3 py-2 font-mono text-xs uppercase tracking-wider transition", {
                "bg-primary/20 text-primary border border-primary/50": selectedTab.value === "my_listings",
                "text-muted-foreground hover:text-foreground border border-border": selectedTab.value !== "my_listings",
              })}
              onClick={() => { selectedTab.value = "my_listings"; }}
            >
              My Listings
            </button>
            <button
              type="button"
              className={clsx("px-3 py-2 font-mono text-xs uppercase tracking-wider transition", {
                "bg-primary/20 text-primary border border-primary/50": selectedTab.value === "sales",
                "text-muted-foreground hover:text-foreground border border-border": selectedTab.value !== "sales",
              })}
              onClick={() => { selectedTab.value = "sales"; }}
            >
              Sales
            </button>
            <button
              type="button"
              className={clsx("px-3 py-2 font-mono text-xs uppercase tracking-wider transition", {
                "bg-primary/20 text-primary border border-primary/50": selectedTab.value === "my_sales",
                "text-muted-foreground hover:text-foreground border border-border": selectedTab.value !== "my_sales",
              })}
              onClick={() => { selectedTab.value = "my_sales"; }}
            >
              My Sales
            </button>
          </div>

          <div className="p-4">
            {selectedTab.value === "listings" && (
              <>
                {hasBalance.value && (
                  <button
                    type="button"
                    onClick={() => addListing(ticker)}
                    className="w-full mb-4 px-3 py-2 text-xs font-mono uppercase tracking-wider bg-yellow-900/30 text-yellow-400 border border-yellow-500/50 hover:bg-yellow-900/50 transition flex items-center justify-center"
                  >
                    <FaPlus className="mr-1 w-3 h-3" />List {ticker.sym || ticker.tick}
                  </button>
                )}
                <TokenMarketListings ticker={ticker} show={show} type={type} />
              </>
            )}
            {selectedTab.value === "my_listings" && (
              <TokenMarketMyListings ticker={ticker} type={type} />
            )}
            {selectedTab.value === "sales" && (
              <TokenMarketSales ticker={ticker} type={type} />
            )}
            {selectedTab.value === "my_sales" && (
              <TokenMarketMySales ticker={ticker} type={type} />
            )}
          </div>
        </div>
      )}

      <CreateTokenListingModal
        onClose={() => {
          showAddListingModal.value = null;
        }}
        ticker={ticker}
        initialPrice={topListing.value?.pricePer}
        open={showAddListingModal.value === ticker.id ||
          showAddListingModal.value === ticker.tick} />
    </div>
  );
}

