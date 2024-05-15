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
    <div className="flex flex-col md:flex-row w-full items-start">
      {mdUp ? (
        <>
          <div className="relative w-1/2 ">
            <div role="tablist" className="tabs tabs-bordered mr-4 w-full px-4">
              <a
                role="tab"
                className={clsx("mb-4 tab font-bold", {
                  "tab-active [--tab-bg:bg-base-100]":
                    selectedListingsTab.value === "listings",
                })}
                // biome-ignore lint/a11y/useValidAnchor: <explanation>
                onClick={(e) => {
                  e.preventDefault();
                  selectedListingsTab.value = "listings";
                }}
              >
                <div className={"font-semibold text-base-content/75 font-mono"}>
                  Listings
                </div>
              </a>

              <div
                role="tabpanel"
                className={clsx("tab-content align-top", {
                  hidden: selectedListingsTab.value !== "listings",
                })}
              >
                <TokenMarketListings ticker={ticker} show={show} type={type} />
              </div>

              <a
                role="tab"
                className={clsx("mb-4 tab font-bold", {
                  "tab-active [--tab-bg:bg-base-200]":
                    selectedListingsTab.value === "my_listings",
                })}
                // biome-ignore lint/a11y/useValidAnchor: <explanation>
                onClick={(e) => {
                  e.preventDefault();
                  selectedListingsTab.value = "my_listings";
                }}
              >
                <div className="font-semibold text-base-content/75 font-mono">
                  My Listings
                </div>
              </a>
              <div
                role="tabpanel"
                className={clsx("tab-content align-top", {
                  hidden: selectedListingsTab.value !== "my_listings",
                })}
              >
                <TokenMarketMyListings ticker={ticker} type={type} />
              </div>
            </div>

            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
            {hasBalance.value && <div onClick={() => addListing(ticker)} className="absolute right-0 top-0 btn btn-sm border-yellow-200/25 hover:bg-base-300 mr-4">
              <div className="flex items-center" ><FaPlus className="mr-1" />List {ticker.sym || ticker.tick}</div>
            </div>}
          </div>
          <div role="tablist" className="tabs tabs-bordered w-1/2 px-4">
            <a
              role="tab"
              className={clsx("mb-4 tab font-bold", {
                "tab-active [--tab-bg:bg-base-200]":
                  selectedSalesTab.value === "sales",
              })}
              // biome-ignore lint/a11y/useValidAnchor: <explanation>
              onClick={(e) => {
                e.preventDefault();
                selectedSalesTab.value = "sales";
              }}
            >
              <div className="font-semibold text-base-content/75 font-mono">
                Recent Sales
              </div>
            </a>
            <div
              role="tabpanel"
              className={clsx("tab-content align-top", {
                hidden: selectedSalesTab.value !== "sales",
              })}
            >
              <TokenMarketSales ticker={ticker} type={type} />
            </div>

            <a
              role="tab"
              className={clsx("mb-4 tab font-bold", {
                "tab-active [--tab-bg:bg-base-200]":
                  selectedSalesTab.value === "my_sales",
              })}
              // biome-ignore lint/a11y/useValidAnchor: <explanation>
              onClick={(e) => {
                e.preventDefault();
                selectedSalesTab.value = "my_sales";
              }}
            >
              <div className="font-semibold text-base-content/75 font-mono">
                My Sales
              </div>
            </a>
            <div
              role="tabpanel"
              className={clsx("tab-content align-top", {
                hidden: selectedSalesTab.value !== "my_sales",
              })}
            >
              <TokenMarketMySales ticker={ticker} type={type} />
            </div>
          </div>
        </>
      ) : (
        <div role="tablist" className="tabs tabs-xs tabs-bordered w-full p-2">
          <a
            role="tab"
            className={clsx("mb-4 tab font-bold", {
              "tab-active [--tab-bg:bg-base-200]":
                selectedTab.value === "listings",
            })}
            // biome-ignore lint/a11y/useValidAnchor: <explanation>
            onClick={(e) => {
              e.preventDefault();
              selectedTab.value = "listings";
            }}
          >
            <div className="font-semibold text-base-content/75 font-mono">
              Listings
            </div>
          </a>
          <div
            role="tabpanel"
            className={clsx("tab-content ", {
              hidden: selectedTab.value !== "listings",
            })}
          >
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
            {hasBalance.value && <div
              onClick={() => addListing(ticker)}
              className="md:absolute md:right-0 md:top-0 w-full md:w-fit btn btn-sm mb-4 md:mb-0 border-yellow-200/25 hover:bg-base-300 mr-4">
              <div className="flex items-center" >
                <FaPlus className="mr-1" />List {ticker.sym || ticker.tick}
              </div>
            </div>}
            <TokenMarketListings ticker={ticker} show={show} type={type} />
          </div>

          <a
            role="tab"
            className={clsx("mb-4 tab font-bold", {
              "tab-active [--tab-bg:bg-base-200]":
                selectedTab.value === "my_listings",
            })}
            // biome-ignore lint/a11y/useValidAnchor: <explanation>
            onClick={(e) => {
              e.preventDefault();
              selectedTab.value = "my_listings";
            }}
          >
            <div className="font-semibold text-base-content/75 font-mono">
              My Listings
            </div>
          </a>
          <div
            role="tabpanel"
            className={clsx("tab-content ", {
              hidden: selectedTab.value !== "my_listings",
            })}
          >
            <TokenMarketMyListings ticker={ticker} type={type} />
          </div>
          <a
            role="tab"
            className={clsx("mb-4 tab font-bold", {
              "tab-active [--tab-bg:bg-base-200]":
                selectedTab.value === "sales",
            })}
            // biome-ignore lint/a11y/useValidAnchor: <explanation>
            onClick={(e) => {
              e.preventDefault();
              selectedTab.value = "sales";
            }}
          >
            <div className="font-semibold text-base-content/75 font-mono">
              Sales
            </div>
          </a>
          <div
            role="tabpanel"
            className={clsx("tab-content ", {
              hidden: selectedTab.value !== "sales",
            })}
          >
            <TokenMarketSales ticker={ticker} type={type} />
          </div>

          <a
            role="tab"
            className={clsx("mb-4 tab font-bold", {
              "tab-active [--tab-bg:bg-base-200]":
                selectedTab.value === "my_sales",
            })}
            // biome-ignore lint/a11y/useValidAnchor: <explanation>
            onClick={(e) => {
              e.preventDefault();
              selectedTab.value = "my_sales";
            }}
          >
            <div className="font-semibold text-base-content/75 font-mono">
              My Sales
            </div>
          </a>
          <div
            role="tabpanel"
            className={clsx("tab-content", {
              hidden: selectedTab.value !== "my_sales",
            })}
          >
            <TokenMarketMySales ticker={ticker} type={type} />
          </div>
        </div>
      )
      }

      <CreateTokenListingModal
        onClose={() => {
          showAddListingModal.value = null;
        }}
        ticker={ticker}
        initialPrice={topListing.value?.pricePer}
        open={showAddListingModal.value === ticker.id ||
          showAddListingModal.value === ticker.tick} />
    </div >
  );
}

