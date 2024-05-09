"use client";

import { API_HOST, AssetType, resultsPerPage } from "@/constants";
import { bsv20Balances, chainInfo } from "@/signals/wallet";
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
import { TokenMarketTabs } from "./tokenMarketTabs";

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
	const salesInView = useInView(salesRef);
	const newOffset = useSignal(0);
	const newSalesOffset = useSignal(0);
	const reachedEndOfListings = useSignal(false);
	const reachedEndOfSales = useSignal(false);

	const currentHeight = computed(() => {
		return chainInfo.value?.blocks || 0;
	});

	// useEffect(() => {
	// 	let nextPageOfListings: Listing[] = [];

	// 	const fire = async (id: string) => {
	// 		if (newOffset.value === 0) {
	// 			listings.value = [];
	// 		}
	// 		let urlMarket = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=${resultsPerPage}&offset=${newOffset.value}&tick=${id}`;
	// 		if (type === AssetType.BSV21) {
	// 			urlMarket = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=${resultsPerPage}&offset=${newOffset.value}&id=${id}`;
	// 		}
	// 		newOffset.value += 20;
	// 		const { promise: promiseBsv20v1Market } =
	// 			http.customFetch<Listing[]>(urlMarket);
	// 		nextPageOfListings = await promiseBsv20v1Market;

	// 		if (nextPageOfListings.length > 0) {
	// 			// For some reason this would return some items the same id from the first call so we filter them out
	// 			listings.value = [
	// 				...(nextPageOfListings || []),
	// 				...(listings.value || []).filter(
	// 					(l) =>
	// 						!nextPageOfListings?.some(
	// 							(l2) => l2.txid === l.txid
	// 						)
	// 				),
	// 			].sort((a, b) => {
	// 				return Number.parseFloat(a.pricePer) <
	// 					Number.parseFloat(b.pricePer)
	// 					? -1
	// 					: 1;
	// 			});
	// 		} else {
	// 			reachedEndOfListings.value = true;
	// 		}
	// 	};

	// 	if (
	// 		type === AssetType.BSV20 &&
	// 		(isInView || newOffset.value === 0) &&
	// 		ticker.tick &&
	// 		!reachedEndOfListings.value
	// 	) {
	// 		// const urlTokens = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=20&offset=0&type=v1`;
	// 		// const { promise: promiseBsv20 } = http.customFetch<BSV20TXO[]>(urlTokens);
	// 		// listings = await promiseBsv20;
	// 		fire(ticker.tick);
	// 	} else if (
	// 		type === AssetType.BSV21 &&
	// 		(isInView || newOffset.value === 0) && // fire the first time
	// 		ticker.id &&
	// 		!reachedEndOfListings.value
	// 	) {
	// 		console.log({ isInView, ticker });
	// 		fire(ticker.id);
	// 	}
	// }, [isInView, newOffset, reachedEndOfListings, ticker, type]);

	// useEffect(() => {
	// 	let nextPageOfSales: BSV20TXO[] = [];

	// 	const fire = async (id: string) => {
	// 		if (newSalesOffset.value === 0) {
	// 			sales.value = [];
	// 		}
	// 		let urlMarket = `${API_HOST}/api/bsv20/market/sales?dir=desc&limit=20&offset=${newSalesOffset.value}&tick=${id}&pending=true`;
	// 		if (type === AssetType.BSV21) {
	// 			urlMarket = `${API_HOST}/api/bsv20/market/sales?dir=desc&limit=20&offset=${newSalesOffset.value}&id=${id}&pending=true`;
	// 		}
	// 		newSalesOffset.value += 20;
	// 		const { promise: promiseBsv20v1Market } =
	// 			http.customFetch<BSV20TXO[]>(urlMarket);
	// 		nextPageOfSales = await promiseBsv20v1Market;

	// 		if (nextPageOfSales.length > 0) {
	// 			// For some reason this would return some items the same id from the first call so we filter them out
	// 			sales.value = [
	// 				...(sales.value || []),
	// 				...nextPageOfSales.filter(
	// 					(l) => !sales.value?.some((l2) => l2.txid === l.txid)
	// 				),
	// 			];
	// 		} else {
	// 			reachedEndOfSales.value = true;
	// 		}
	// 	};

	// 	if (salesInView) {
	// 		console.log({ salesInView });
	// 	}
	// 	if (
	// 		type === AssetType.BSV20 &&
	// 		(salesInView || newSalesOffset.value === 0) &&
	// 		ticker.tick &&
	// 		!reachedEndOfSales.value
	// 	) {
	// 		fire(ticker.tick);
	// 	} else if (
	// 		type === AssetType.BSV21 &&
	// 		(salesInView || newSalesOffset.value === 0) && // fire the first time
	// 		ticker.id &&
	// 		!reachedEndOfSales.value
	// 	) {
	// 		fire(ticker.id);
	// 	}
	// }, [salesInView, newSalesOffset, reachedEndOfSales, ticker, type]);

	// const showBuy = useSignal<string | null>(null);
	// const showCancel = useSignal<string | null>(null);

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
			<>
				<tr className={"transition bg-base-200"}>
					<td colSpan={3} className="align-top">
						<TremorChartComponent
							ticker={ticker}
							dataCategory={DataCategory.Listings}
							chartStyle={ChartStyle.Bubble}
							currentHeight={currentHeight.value}
							showListingForm={showListingForm}
						/>
					</td>
					<td
						colSpan={type === AssetType.BSV21 ? 3 : 2}
						className="align-top"
					>
						<TremorChartComponent
							ticker={ticker}
							dataCategory={DataCategory.Sales}
							chartStyle={ChartStyle.Line}
							currentHeight={currentHeight.value}
						/>
					</td>
				</tr>
				<tr className={"transition bg-base-200"}>
					<td colSpan={6} className="align-top">
						<TokenMarketTabs
							ticker={ticker}
							show={show}
							type={type}
							showListingForm={showListingForm}
						/>
					</td>
				</tr>
			</>
		)
	);
};

export default TickerContent;
