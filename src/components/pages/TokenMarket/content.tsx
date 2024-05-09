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
	const currentHeight = computed(() => {
		return chainInfo.value?.blocks || 0;
	});

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
