"use client";

import { computed } from "@preact/signals-react";
import type { AssetType } from "@/constants";
import { chainInfo } from "@/signals/wallet";
import TremorChartComponent, { ChartStyle, DataCategory } from "./chart";
import type { MarketData } from "./list";

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

	return (
		show && (
			<div className="transition bg-muted/30 flex py-4 w-full">
				<div className="w-1/2 align-top">
					<TremorChartComponent
						ticker={ticker}
						dataCategory={DataCategory.Listings}
						chartStyle={ChartStyle.Bubble}
						currentHeight={currentHeight.value}
					/>
				</div>
				<div className="w-1/2 align-top">
					<TremorChartComponent
						ticker={ticker}
						dataCategory={DataCategory.Sales}
						chartStyle={ChartStyle.Line}
						currentHeight={currentHeight.value}
					/>
				</div>
			</div>
		)
	);
};

export default TickerContent;
