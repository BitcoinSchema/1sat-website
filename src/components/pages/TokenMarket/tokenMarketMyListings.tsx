"use client"

import CancelListingModal from "@/components/modal/cancelListing";
import { API_HOST, AssetType, resultsPerPage } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import type { Listing } from "@/types/bsv20";
import * as http from "@/utils/httpClient";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { useInView } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { toBitcoin } from "satoshi-token";
import type { MarketData } from "./list";
import { myListings } from "./signals";

interface Props {
  ticker: MarketData;
  type: AssetType.BSV20 | AssetType.BSV21;
}

export function TokenMarketMyListings({ ticker, type }: Props) {
  useSignals();
  const showBuy = useSignal<string | null>(null);
  const showCancel = useSignal<string | null>(null);
  const newOffset = useSignal(0);
  const reachedEndOfListings = useSignal(false);

  const ref = useRef(null);
  const isInView = useInView(ref);

  useEffect(() => {
    if (!ordAddress.value) {
      return;
    }

    let nextPageOfListings: Listing[] = [];

    const fire = async (id: string) => {
      if (newOffset.value === 0) {
        myListings.value = [];
      }
      let urlMarket = `${API_HOST}/api/bsv20/${ordAddress.value}/tick/${id}?dir=desc&limit=${resultsPerPage}&offset=${newOffset.value}&listing=true`;
      if (type === AssetType.BSV21) {
        urlMarket = `${API_HOST}/api/bsv20/${ordAddress.value}/id/${id}?dir=desc&limit=${resultsPerPage}&offset=${newOffset.value}&listing=true`;
      }
      newOffset.value += 20;
      const { promise: promiseBsv20v1Market } =
        http.customFetch<Listing[]>(urlMarket);
      nextPageOfListings = await promiseBsv20v1Market;

      if (nextPageOfListings.length > 0) {
        // For some reason this would return some items the same id from the first call so we filter them out
        myListings.value = [
          ...(nextPageOfListings || []),
          ...(myListings.value || []).filter(
            (l) =>
              !nextPageOfListings?.some(
                (l2) => l2.txid === l.txid
              )
          ),
        ].sort((a, b) => {
          return Number.parseFloat(a.pricePer) <
            Number.parseFloat(b.pricePer)
            ? -1
            : 1;
        });
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
      fire(ticker.tick);
    } else if (
      type === AssetType.BSV21 &&
      (isInView || newOffset.value === 0) && // fire the first time
      ticker.id &&
      !reachedEndOfListings.value
    ) {
      // console.log({ isInView, ticker });
      fire(ticker.id);
    }
  }, [isInView]);

  return (
    <>
      {myListings.value?.map((listing) => {
        const qty = Number.parseInt(listing.amt) / 10 ** ticker.dec;
        const qtyStr = `${qty.toLocaleString()} ${ticker.tick || ticker.sym
          }`;
        const pricePer = (
          Number.parseFloat(listing.price) / qty
        ).toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 6,
          useGrouping: false
        });

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
              <span className="text-secondary-content/75">
                {qtyStr}
              </span>
              <span className="text-base-content/50 text-xs">
                {pricePer} sat/token
              </span>
            </Link>
            <div className="py-1">
              <button
                type="button"
                className={`ml-2 btn btn-outline hover:btn-primary transition btn-xs ${myListing ? "btn-primary" : ""
                  }`}
                onClick={() => {
                  console.log({ listing });
                  if (!myListing) {
                    showBuy.value = listing.txid || null;
                  } else {
                    showCancel.value = listing.txid || null;
                  }
                }}
              >
                {Number.parseInt(listing.price) < 1000
                  ? `${listing.price} sat`
                  : `${toBitcoin(listing.price)} BSV`}
              </button>
              {showCancel.value === listing.txid && (
                <CancelListingModal
                  className="w-full"
                  listing={listing}
                  onClose={() => {
                    showCancel.value = null;
                  }}
                  onCancelled={async (newOutpoint) => {
                    showCancel.value = null;
                    console.log(
                      "listing cancelled. New outpoint",
                      newOutpoint
                    );
                    if (!myListings.value) return;
                    myListings.value =
                      myListings.value?.filter(
                        (l) => l.txid !== listing.txid
                      );
                  }}
                  indexerAddress={ticker.fundAddress}
                />
              )}
            </div>
          </div>
        );
      })}
      {myListings.value?.length === 0 && (
        <div className="text-center text-base-content/75 min-h-64 flex items-center justify-center">
          No listings found
        </div>
      )}
      <div ref={ref} />
    </>
  );
}
