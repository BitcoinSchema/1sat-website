"use client";

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
import { toBitcoin } from "satoshi-token";
import type { MarketData } from "./list";
import { listings } from "./signals";
import {
	CurrencyDisplay,
	currencyDisplay,
	exchangeRate,
} from "@/signals/wallet";
import { useInfiniteQuery } from "@tanstack/react-query";

interface Props {
	ticker: MarketData;
	show: boolean;
	type: AssetType.BSV20 | AssetType.BSV21;
}

export function TokenMarketListings({ ticker, show, type }: Props) {
  useSignals();
  const showBuy = useSignal<string | null>(null);
  const showCancel = useSignal<string | null>(null);
  const ref = React.useRef(null);
  const isInView = useInView(ref);

  const fetchListings = async ({ pageParam }: { pageParam: number }) => {
    const id = type === AssetType.BSV20 ? ticker.tick : ticker.id;
    const urlMarket = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=${resultsPerPage}&offset=${pageParam}&${
      type === AssetType.BSV20 ? "tick" : "id"
    }=${id}`;
    const { promise: promiseBsv20v1Market } = http.customFetch<Listing[]>(urlMarket);
    return promiseBsv20v1Market;
  };

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["tokenMarketListings", ticker, type],
    queryFn: fetchListings,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === resultsPerPage ? allPages.length * resultsPerPage : undefined;
    },
    initialPageParam: 0,
    enabled: !!ticker.tick || !!ticker.id,
  });

  useEffect(() => {
    if (isInView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isInView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    listings.value = data?.pages.flat() || [];
  }, [
    data?.pages,
  ])

	return (
		<>
			{listings.value?.map((listing) => {
				const qty = Number.parseInt(listing.amt) / 10 ** ticker.dec;
				const qtyStr = `${qty.toLocaleString()} ${ticker.tick || ticker.sym}`;

				const pricePerSat = Number.parseFloat(listing.price) / qty;
				const pricePerUSD = (pricePerSat / 1e8) * exchangeRate.value; // Convert sat to BSV, then to USD

				const pricePer = currencyDisplay.value === CurrencyDisplay.BSV
						? `${pricePerSat.toLocaleString("en-US", {
								minimumFractionDigits: 0,
								maximumFractionDigits: 8,
								useGrouping: false,
							})} sat`
						: pricePerUSD > 0
							? `${pricePerUSD.toLocaleString("en-US", {
									style: "currency",
									currency: "USD",
									minimumFractionDigits: 2,
									maximumFractionDigits: 10,
									useGrouping: true,
								})}`
							: "$0.00";

				// For the button text
				const buttonText =
					currencyDisplay.value === CurrencyDisplay.BSV
						? Number.parseInt(listing.price) < 1000
							? `${listing.price} sat`
							: `${toBitcoin(listing.price)} BSV`
						: `${(
								(Number.parseInt(listing.price) / 1e8) *
								exchangeRate.value
							).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
								minimumFractionDigits: 2,
								maximumFractionDigits: 2,
								useGrouping: true,
							})}`;

				const myListing = listing.owner === ordAddress.value;
				return (
					<React.Fragment
						key={`${listing.txid}-${listing.vout}-${listing.height}`}
					>
						<div
							className="flex w-full justify-between"
							key={`${listing.txid}-${listing.vout}-${listing.height}`}
						>
							<Link
								href={`/outpoint/${listing.txid}_${listing.vout}`}
								className="flex flex-col py-1"
							>
								<span className="text-secondary-content/75">{qtyStr}</span>
								<span className="text-base-content/50 text-xs">
									{pricePer}{" "}
									{currencyDisplay.value === CurrencyDisplay.BSV
										? "/ "
										: " / "}
									token
								</span>
							</Link>
							<div className="py-1">
								<button
									type="button"
									className={`ml-2 btn btn-outline hover:btn-primary transition btn-xs ${
										myListing ? "btn-primary" : ""
									}`}
									onClick={() => {
										if (!myListing) {
											showBuy.value = listing.txid || null;
										} else {
											showCancel.value = listing.txid || null;
										}
									}}
								>
									{buttonText}
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
												newOutpoint,
											);
											if (!listings.value) return;
											listings.value = listings.value?.filter(
												(l) => l.txid !== listing.txid,
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
										price={BigInt(Math.ceil(Number.parseInt(listing.price)))}
										showLicense={false}
										content={
											<div className="w-full h-full rounded border border-secondary flex flex-col items-center justify-center">
												<span className="text-xl text-secondary-content/75">{`${(
													Number.parseInt(listing.amt) /
													10 ** ticker.dec
												).toLocaleString()} ${
													ticker.tick || ticker.sym
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

      {status === "pending" && (
        <div className="text-center text-base-content/75 min-h-64 flex items-center justify-center">
          Loading...
        </div>
      )}

      {status === "error" && (
        <div className="text-center text-error min-h-64 flex items-center justify-center">
          Error loading listings
        </div>
      )}


			{listings.value?.length === 0 && (
				<div className="text-center text-base-content/75 min-h-64 flex items-center justify-center">
					No listings found
				</div>
			)}
			<div ref={ref} />
		</>
	);
}
