"use client";

import BuyArtifactModal from "@/components/modal/buyArtifact";
import CancelListingModal from "@/components/modal/cancelListing";
import { API_HOST, AssetType, resultsPerPage } from "@/constants";
import { bsv20Balances, chainInfo } from "@/signals/wallet";
import { ordAddress } from "@/signals/wallet/address";
import { Listing } from "@/types/bsv20";
import { BSV20TXO } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { computed } from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { useInView } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { toBitcoin } from "satoshi-bitcoin-ts";
import TremorChartComponent, { ChartStyle, DataCategory } from "./chart";
import { MarketData } from "./list";
import { listings, sales } from "./signals";

const TickerContent = ({
  ticker,
  show,
  type,
}: {
  ticker: MarketData;
  show: boolean;
  type: AssetType.BSV20 | AssetType.BSV21;
}) => {
  useSignals();
  const ref = useRef(null);
  const salesRef = useRef(null);
  const isInView = useInView(ref);
  const salesInView = useInView(ref);
  const newOffset = useSignal(0);
  const newSalesOffset = useSignal(0);
  const reachedEndOfListings = useSignal(false);
  const reachedEndOfSales = useSignal(false);

  const currentHeight = computed(() => {
    return chainInfo.value?.blocks || 0;
  });

  useEffect(() => {
    let nextPageOfListings: Listing[] = [];

    const fire = async (id: string) => {
      if (newOffset.value === 0) {
        listings.value = [];
      }
      let urlMarket = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=${resultsPerPage}&offset=${newOffset.value}&tick=${id}`;
      if (type === AssetType.BSV21) {
        urlMarket = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=${resultsPerPage}&offset=${newOffset.value}&id=${id}`;
      }
      newOffset.value += 20;
      const { promise: promiseBsv20v1Market } =
        http.customFetch<Listing[]>(urlMarket);
      nextPageOfListings = await promiseBsv20v1Market;

      if (nextPageOfListings.length > 0) {
        // For some reason this would return some items the same id from the first call so we filter them out
        listings.value = [
          ...(nextPageOfListings || []),
          ...(listings.value || []).filter(
            (l) => !nextPageOfListings?.some((l2) => l2.txid === l.txid)
          ),
        ].sort((a, b) => {
          return parseFloat(a.pricePer) < parseFloat(b.pricePer) ? -1 : 1;
        })
      } else {
        reachedEndOfListings.value = true;
      }
    };

    if (
      type === AssetType.BSV20 &&
      (isInView || newOffset.value === 0) &&
      ticker.tick &&
      !reachedEndOfListings.value
    ) {
      // const urlTokens = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=20&offset=0&type=v1`;
      // const { promise: promiseBsv20 } = http.customFetch<BSV20TXO[]>(urlTokens);
      // listings = await promiseBsv20;
      fire(ticker.tick);
    } else if (
      type === AssetType.BSV21 &&
      (isInView || newOffset.value === 0) && // fire the first time
      ticker.id &&
      !reachedEndOfListings.value
    ) {
      console.log({ isInView, ticker });
      fire(ticker.id);
    }
  }, [isInView, newOffset, reachedEndOfListings, ticker, type]);

  useEffect(() => {
    let nextPageOfSales: BSV20TXO[] = [];

    const fire = async (id: string) => {
      if (newSalesOffset.value === 0) {
        sales.value = [];
      }
      let urlMarket = `${API_HOST}/api/bsv20/market/sales?dir=desc&limit=20&offset=${newSalesOffset.value}&tick=${id}&pending=true`;
      if (type === AssetType.BSV21) {
        urlMarket = `${API_HOST}/api/bsv20/market/sales?dir=desc&limit=20&offset=${newSalesOffset.value}&id=${id}&pending=true`;
      }
      newSalesOffset.value += 20;
      const { promise: promiseBsv20v1Market } =
        http.customFetch<BSV20TXO[]>(urlMarket);
      nextPageOfSales = await promiseBsv20v1Market;

      if (nextPageOfSales.length > 0) {
        // For some reason this would return some items the same id from the first call so we filter them out
        sales.value = [
          ...(sales.value || []),
          ...nextPageOfSales.filter(
            (l) => !sales.value?.some((l2) => l2.txid === l.txid)
          ),
        ];
      } else {
        reachedEndOfSales.value = true;
      }
    };

    if (
      type === AssetType.BSV20 &&
      (salesInView || newSalesOffset.value === 0) &&
      ticker.tick &&
      !reachedEndOfSales.value
    ) {
      fire(ticker.tick);
    } else if (
      type === AssetType.BSV21 &&
      (salesInView || newSalesOffset.value === 0) && // fire the first time
      ticker.id &&
      !reachedEndOfSales.value
    ) {
      fire(ticker.id);
    }
  }, [salesInView, newSalesOffset, reachedEndOfSales, ticker, type]);

  const showBuy = useSignal<string | null>(null);
  const showCancel = useSignal<string | null>(null);

  const ownsTicker = computed(() => {
    return bsv20Balances.value?.some((b) => {
      // TODO: Fix for v2
      return b.tick === ticker.tick || b.sym === ticker.tick;
    });
  });

  // state for closing the listing form to return to chart
  const showListingForm = useSignal(ownsTicker.value || false);
  return (
    show && (
      <tr className={"transition bg-base-200"}>
        <td colSpan={3} className="align-top">
          <TremorChartComponent
            ticker={ticker}
            dataCategory={DataCategory.Listings}
            chartStyle={ChartStyle.Bubble}
            currentHeight={currentHeight.value}
            showListingForm={showListingForm}
          />
          <div className="font-semibold mt-4 text-base-content/75 flex justify-between text-lg font-mono">
            <div>Listings</div>
            {ownsTicker.value && (
              <div
                className="btn btn-sm"
                onClick={() => {
                  showListingForm.value = !showListingForm.value;
                }}
              >
                {showListingForm.value === false
                  ? "Add Listing"
                  : "Scatter Chart"}
              </div>
            )}
          </div>
          <div className="divider my-1" />
          {listings.value?.map((listing) => {
            const qty = parseInt(listing.amt) / 10 ** ticker.dec;
            const qtyStr = `${qty.toLocaleString()} ${ticker.tick || ticker.sym}`;
            const pricePer = (parseFloat(listing.price) / qty).toFixed(2);
            const myListing = listing.owner === ordAddress.value;
            return (
              <div
                className="flex w-full justify-between"
                key={`${listing.txid}-${listing.vout}-${listing.height}`}
              >
                <Link
                  href={`/outpoint/${listing.txid}_${listing.vout}`}
                  className="flex flex-col py-1"
                >
                  <span className="text-secondary-content/75">{qtyStr}</span>
                  <span className="text-accent text-xs">
                    {pricePer} sat/token
                  </span>
                </Link>
                <div className="py-1">
                  <button
                    type="button"
                    className={`ml-2 btn btn-outline hover:btn-primary transition btn-xs ${myListing ? "btn-primary" : ""}`}
                    onClick={() => {
                      console.log({ listing });
                      if (!myListing) {
                        showBuy.value = listing.txid || null;
                      } else {
                        showCancel.value = listing.txid || null;
                      }
                    }}
                  >
                    {parseInt(listing.price) < 1000 ? `${listing.price} sat` : `${toBitcoin(listing.price)} BSV`}
                  </button>
                  {showCancel.value === listing.txid && (
                    <CancelListingModal
                      className="w-full"
                      listing={listing}
                      onClose={() => {
                        showCancel.value = null;
                      }}
                      indexerAddress={ticker.fundAddress}
                    />
                  )}
                  {show && showBuy.value === listing.txid && (
                    <BuyArtifactModal
                      indexerAddress={ticker.fundAddress}
                      listing={listing}
                      onClose={() => {
                        showBuy.value = null;
                      }}
                      price={BigInt(Math.ceil(parseInt(listing.price)))}
                      showLicense={false}
                      content={
                        <div className="w-full h-full rounded border border-secondary flex flex-col items-center justify-center">
                          <span className="text-xl text-secondary-content/75">{`${(
                            parseInt(listing.amt) /
                            10 ** ticker.dec
                          ).toLocaleString()} ${ticker.tick || ticker.sym}`}</span>
                          <span className="texl-base text-accent text-xs my-1">
                            {listing.pricePer} sat/token
                          </span>
                          <span className="text-base-content/75">
                            Status: {listing.status}
                          </span>
                          <Link
                            href={`/outpoint/${listing.txid}_${listing.vout}`}
                            className="text-sm flex items-center my-2"
                          >
                            Listing Details
                          </Link>
                        </div>
                      }
                    />
                  )}
                </div>
              </div>
            );
          })}
          {listings.value?.length === 0 && (
            <div className="text-center text-base-content/75">
              No listings found
            </div>
          )}
          <div ref={ref} />
        </td>
        <td colSpan={2} className="align-top">
          <TremorChartComponent
            ticker={ticker}
            dataCategory={DataCategory.Sales}
            chartStyle={ChartStyle.Line}
            currentHeight={currentHeight.value}
          />
          <div className="font-semibold mt-4 text-base-content/75 flex justify-between text-lg font-mono">
            <div>Recent Sales</div>
            <div>View All</div>
          </div>
          <div className="divider my-1" />
          {sales.value?.map((sale) => {
            return (
              <div
                className="flex w-full justify-between"
                key={`${sale.txid}-${sale.vout}-${sale.height}`}
              >
                <Link
                  href={`/outpoint/${sale.txid}`}
                  className="flex flex-col py-1"
                >
                  <span className="text-secondary-content/75">
                    {(parseInt(sale.amt) / 10 ** ticker.dec).toLocaleString()}{" "}
                    {ticker.tick}
                  </span>
                  <span className="text-accent text-xs">
                    {sale.pricePer} / token
                  </span>
                </Link>
                <div className="py-1">
                  <button
                    type="button"
                    disabled
                    className="btn btn-xs btn-outline btn-secondary pointer-events-none"
                  >
                    {parseInt(sale.price) > 1000 ? `${toBitcoin(sale.price)} BSV` :`${sale.price} sat`}
                  </button>
                </div>
              </div>
            );
          })}
          {sales.value?.length === 0 && (
            <div className="text-center text-base-content/75">
              No sales found
            </div>
          )}
          <div ref={salesRef} />
        </td>
      </tr>
    )
  );
};

export default TickerContent;
