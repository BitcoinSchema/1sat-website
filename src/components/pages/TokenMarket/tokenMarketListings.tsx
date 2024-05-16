"use client"

import BuyArtifactModal from "@/components/modal/buyArtifact";
import CancelListingModal from "@/components/modal/cancelListing";
import { API_HOST, AssetType, resultsPerPage } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import type { Listing } from "@/types/bsv20";
import * as http from "@/utils/httpClient";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { useInView } from "framer-motion";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import { toBitcoin } from "satoshi-bitcoin-ts";
import type { MarketData } from "./list";
import { listings } from "./signals";

interface Props {
  ticker: MarketData;
  show: boolean;
  type: AssetType.BSV20 | AssetType.BSV21;
}

export function TokenMarketListings({ ticker, show, type }: Props) {
  useSignals();
  const showBuy = useSignal<string | null>(null);
  const showCancel = useSignal<string | null>(null);
  const newOffset = useSignal(0);
  const reachedEndOfListings = useSignal(false);
  const ref = useRef(null);
  const isInView = useInView(ref);

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
      // console.log({ isInView, ticker });
      fire(ticker.id);
    }
  }, [isInView, newOffset, reachedEndOfListings, ticker, type]);




  return (
    <>

      {listings.value?.map((listing) => {
        const qty = Number.parseInt(listing.amt) / 10 ** ticker.dec;
        const qtyStr = `${qty.toLocaleString()} ${ticker.tick || ticker.sym
          }`;
        const pricePer = (
          Number.parseFloat(listing.price) / qty
        ).toFixed(3);
        const myListing = listing.owner === ordAddress.value;
        return (<React.Fragment key={`${listing.txid}-${listing.vout}-${listing.height}`}>
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
              <span className="text-accent text-xs">
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
                    if (!listings.value) return;
                    listings.value = listings.value?.filter(
                      (l) => l.txid !== listing.txid
                    );
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
                  price={BigInt(
                    Math.ceil(
                      Number.parseInt(listing.price)
                    )
                  )}
                  showLicense={false}
                  content={
                    <div className="w-full h-full rounded border border-secondary flex flex-col items-center justify-center">
                      <span className="text-xl text-secondary-content/75">{`${(
                        Number.parseInt(listing.amt) /
                        10 ** ticker.dec
                      ).toLocaleString()} ${ticker.tick || ticker.sym
                        }`}</span>
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
        </React.Fragment>
        );
      })}

      {listings.value?.length === 0 && (
        <div className="text-center text-base-content/75 min-h-64 flex items-center justify-center">
          No listings found
        </div>
      )}
      <div ref={ref} />
    </>
  );
}
