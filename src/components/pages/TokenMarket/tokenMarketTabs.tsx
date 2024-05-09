"use client";

import { Signal, computed, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { TokenMarketListings } from "./tokenMarketListings";
import { MarketData } from "./list";
import { AssetType } from "@/constants";
import clsx from "clsx";
import { bsv20Balances } from "@/signals/wallet";
import { TokenMarketSales } from "./tokenMarketSales";
import { TokenMarketMyListings } from "./tokenMarketMyListings";
import { TokenMarketMySales } from "./tokenMarketMySales";

interface Props {
	ticker: MarketData;
	show: boolean;
	type: AssetType.BSV20 | AssetType.BSV21;
	showListingForm: Signal<boolean>;
}

export function TokenMarketTabs({
	ticker,
	show,
	type,
	showListingForm,
}: Props) {
	useSignals();
	const selectedTab = useSignal<
		"listings" | "sales" | "my_listings" | "my_sales"
	>("listings");

	const ownsTicker = computed(() => {
		return bsv20Balances.value?.some((b) => {
			// TODO: Fix for v2
			return b.tick === ticker.tick || b.sym === ticker.tick;
		});
	});

	return (
		<div className="flex w-full items-center justify-between">
			<div role="tablist" className="tabs tabs-lifted tabs-lg w-full">
				<a
					role="tab"
					className={clsx("tab font-bold", {
						"tab-active [--tab-bg:bg-base-200]":
							selectedTab.value === "listings",
					})}
					onClick={(e) => {
						e.preventDefault();
						selectedTab.value = "listings";
					}}
				>
					<div className="font-semibold text-base-content/75 flex justify-between text-lg font-mono">
						<div>Listings</div>

						{ownsTicker.value && (
							<div
								className="btn btn-sm ml-8"
								onClick={() => {
									showListingForm.value =
										!showListingForm.value;
								}}
							>
								{showListingForm.value === false
									? "Add Listing"
									: "Scatter Chart"}
							</div>
						)}
					</div>
				</a>
				<div
					role="tabpanel"
					className="tab-content bg-base-200 border-base-300 rounded-box p-6"
				>
					<TokenMarketListings
						ticker={ticker}
						show={show}
						type={type}
					/>
				</div>

				<a
					role="tab"
					className={clsx("tab font-bold", {
						"tab-active [--tab-bg:bg-base-200]":
							selectedTab.value === "sales",
					})}
					onClick={(e) => {
						e.preventDefault();
						selectedTab.value = "sales";
					}}
				>
					<div className="font-semibold text-base-content/75 flex justify-between text-lg font-mono">
						<div>Recent Sales</div>
						<div>&nbsp;</div>
					</div>
				</a>
				<div
					role="tabpanel"
					className="tab-content bg-base-200 border-base-300 rounded-box p-6"
				>
					<TokenMarketSales ticker={ticker} type={type} />
				</div>

				<a
					role="tab"
					className={clsx("tab font-bold", {
						"tab-active [--tab-bg:bg-base-200]":
							selectedTab.value === "my_listings",
					})}
					onClick={(e) => {
						e.preventDefault();
						selectedTab.value = "my_listings";
					}}
				>
					<div className="font-semibold text-base-content/75 flex justify-between text-lg font-mono">
						<div>My Listings</div>
						<div>&nbsp;</div>
					</div>
				</a>
				<div
					role="tabpanel"
					className="tab-content bg-base-200 border-base-300 rounded-box p-6"
				>
					<TokenMarketMyListings ticker={ticker} type={type} />
				</div>

				<a
					role="tab"
					className={clsx("tab font-bold", {
						"tab-active [--tab-bg:bg-base-200]":
							selectedTab.value === "my_sales",
					})}
					onClick={(e) => {
						e.preventDefault();
						selectedTab.value = "my_sales";
					}}
				>
					<div className="font-semibold text-base-content/75 flex justify-between text-lg font-mono">
						<div>My Sales</div>
						<div>&nbsp;</div>
					</div>
				</a>
				<div
					role="tabpanel"
					className="tab-content bg-base-200 border-base-300 rounded-box p-6"
				>
					<TokenMarketMySales ticker={ticker} type={type} />
				</div>
			</div>
		</div>
	);
}
