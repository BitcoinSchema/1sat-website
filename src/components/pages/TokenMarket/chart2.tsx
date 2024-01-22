"use client";

import { bsv20Balances } from "@/signals/wallet";
import { computed } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { AreaChart, ScatterChart } from "@tremor/react";
import { FC, useEffect, useMemo } from "react";
import { MarketData } from "./list"; // Ensure the import path is correct
import ListingForm from "./listingForm";

interface ChartProps {
  marketData: MarketData;
  dataCategory: "sales" | "listings";
  chartStyle: "bubble" | "line"; // The chartStyle prop might need to be updated to match Tremor's chart types
  currentHeight: number;
}
const TremorChartComponent: FC<ChartProps> = ({
  marketData,
  dataCategory,
  chartStyle,
  currentHeight
}) => {
  useSignals();

  const ownsTicker = computed(() => {
    return bsv20Balances.value?.some((b) => {
      // TODO: Fix for v2
      return b.tick === marketData.tick || b.sym === marketData.tick;
    });
  });

  // Prepare the dataset
  const dataset = useMemo(() => {
    if (!marketData[dataCategory]) {
      return [];
    }
    // Extract raw data and sort by block height
    const rawData = [...marketData[dataCategory]!].sort(
      (a, b) => a.height! - b.height!
    );

    // Group data by height and calculate mean price and total amount
    const groupedData = rawData.reduce((acc, item) => {
      const height = item.height!;
      if (!acc[height]) {
        acc[height] = { price: 0, amt: 0, count: 0 };
      }
      acc[height].price += parseFloat(item.pricePer) * parseFloat(item.amt);
      acc[height].amt += parseFloat(item.amt);
      acc[height].count += 1;
      return acc;
    }, {} as Record<number, { price: number; amt: number; count: number }>);

    // Create final data array
    const finalData = Object.entries(groupedData).map(([height, data]) => {
      const averagePrice = data.price / data.amt;
      return {
        height: parseInt(height),
        price: averagePrice,
        amt: data.amt, // Use total amount for bubble size in scatter chart
      };
    });

    const lastHeight = finalData[finalData.length - 1]?.height || 0;
    const lastPrice = finalData[finalData.length - 1]?.price || 0;
    if (lastHeight < currentHeight) {
      finalData.push({
        height: currentHeight,
        price: lastPrice,
        amt: 0,
      })
    }

    return finalData;
  }, [marketData, dataCategory, currentHeight]);

  // Define categories for the chart based on dataCategory
  const categories = useMemo(() => [dataCategory], [dataCategory]);

  useEffect(()=>{
    if (dataCategory === "listings") {
    console.log({dataset})
    }
  },[dataCategory ,dataset])
  // Render the chart using the Chart component from @tremor/react
  return (
    <>
     
        {chartStyle === "bubble" ? (
          ownsTicker.value ? (
            <ListingForm
              dataset={dataset}
              marketData={marketData}
            ></ListingForm>
          ) : (
            <ScatterChart
              className="w-full h-60"
              data={dataset}
              colors={["orange-400", "orange-500", "teal-400", "orange-300", "emerald-400", "purple-400", "pink-400", "yellow-400", "red-200", "gray-200", "indigo-200", "rose-200", "teal-200", "blue-200", "green-200", "purple-200", "pink-200", "yellow-200", "red-200", "gray-200"]}
              showLegend={false}
              allowDecimals={true}
              x={"height"}
              category={"amt"}
              y={"price"}
              size={"amt"}
              minXValue={dataset.length ? dataset[0].height : 0}
            />
          )
        ) : (
          <AreaChart
            className="w-full h-60"
            data={dataset}
            index="height"
            categories={["price"]}
            colors={["orange-400"]}
            showLegend={false}
            connectNulls={true}
            allowDecimals={true}
          />
        )}
    
    </>
  );
};

export default TremorChartComponent;
