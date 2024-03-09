"use client";

import { Signal, computed } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { AreaChart, ScatterChart } from "@tremor/react";
import { FC, useMemo } from "react";
import { MarketData } from "./list";
import ListingForm from "./listingForm";
import { listings, sales } from "./signals";

export const enum ChartStyle {
  Bubble = "bubble",
  Line = "line",
}

export const enum DataCategory {
  Sales = "sales",
  Listings = "listings",
}

interface ChartProps {
  dataCategory: DataCategory;
  chartStyle: ChartStyle;
  currentHeight: number;
  showListingForm?: Signal<boolean>;
  ticker: Partial<MarketData>;
}
const TremorChartComponent: FC<ChartProps> = ({
  dataCategory,
  chartStyle,
  currentHeight,
  showListingForm,
  ticker,
}) => {
  useSignals();

  // const data = computed(() => {
  //   if (dataCategory === DataCategory.Listings) {
  //     return listings.value;
  //    } else if (dataCategory === DataCategory.Sales) {
  //     return sales.value;
  //   }
  //   return [];
  // })
  

  // Prepare the dataset
  const dataset = computed(() => {
    const data = dataCategory === DataCategory.Listings ? listings.value : sales.value;
    if (!data) {
      return [];
    }
    // Extract raw data and sort by block height
    const rawData = [...data].sort(
      (a, b) => {
        if (a.height === 0) {
        
          -1
        }
        if (b.height === 0) {
          return 1
        }
          
        return a.height > b.height ? -1 : 1;
      }
    );


    // Group data by height and calculate mean price and total amount
    const groupedData = rawData.reduce((acc, item) => {
      const height = item.height!;
      if (!acc[height]) {
        acc[height] = { price: 0, amt: 0, count: 0 };
      }
      const amt = ticker.dec ? parseFloat(item.amt) / 10 ** ticker.dec : parseFloat(item.amt);
      acc[height].price += parseFloat(item.pricePer) * amt;
      acc[height].amt += amt;
      acc[height].count += 1;
      return acc;
    }, {} as Record<number, { price: number; amt: number; count: number }>);

    // Create final data array
    const finalData = Object.entries(groupedData).map(([height, data]) => {
      const averagePrice = data.price / data.amt;
      return {
        height: parseInt(height),
        price: averagePrice,
        amt: data.amt,
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
  });

  // Define categories for the chart based on dataCategory
  const categories = useMemo(() => [dataCategory], [dataCategory]);


  // Render the chart using the Chart component from @tremor/react
  return (
    <>
     
        {chartStyle === "bubble" ? (
          showListingForm?.value ? (
            <ListingForm
              dataset={dataset.value}
              ticker={ticker}
              onClose={() => {
                console.log("close");
                showListingForm.value = false;
              }}
            />
          ) : (
            <ScatterChart
              className="w-full h-60"
              data={dataset.value}
              colors={["orange-400", "orange-500", "teal-400", "orange-300", "emerald-400", "purple-400", "pink-400", "yellow-400", "red-200", "gray-200", "indigo-200", "rose-200", "teal-200", "blue-200", "green-200", "purple-200", "pink-200", "yellow-200", "red-200", "gray-200"]}
              showLegend={false}
              allowDecimals={true}
              x={"height"}
              category={"amt"}
              y={"price"}
              size={"amt"}
              minXValue={dataset.value.length ? dataset.value[0].height : 0}
            />
          )
        ) : (
          <AreaChart
            className="w-full h-60"
            data={dataset.value}
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
