"use client";

import Image from 'next/image';
import { FC, useEffect, useState } from 'react';
import { MarketData } from './list'; // Ensure the import path is correct

interface ChartProps {
  marketData: MarketData;
  dataCategory: 'sales' | 'listings';
  chartStyle: 'bubble' | 'line';
}

interface AggregatedData {
  x: number; // Block height
  y: number; // Average price per token in satoshi
  count: number; // Number of sales or listings
}

const ChartComponent: FC<ChartProps> = ({ marketData, dataCategory, chartStyle }) => {
  const [chartUrl, setChartUrl] = useState<string>('');

  useEffect(() => {
    if (!marketData[dataCategory]) {
      return
    }
    // Sort the data by block height
    const sortedData = [...marketData[dataCategory]!].sort((a, b) => a.height! - b.height!);

    // Aggregate data by block height with weighted average
    const aggregatedData: Record<number, { totalAmount: number; totalPrice: number; count: number }> = {};

    sortedData.forEach(item => {
      const blockHeight = item.height!;
      const amount = parseFloat(item.amt); // Assuming 'amt' is a string that can be converted to a number
      const price = parseFloat(item.pricePer);
      const totalPrice = amount * price;

      if (!aggregatedData[blockHeight]) {
        aggregatedData[blockHeight] = { totalAmount: 0, totalPrice: 0, count: 0 };
      }

      aggregatedData[blockHeight].totalAmount += amount;
      aggregatedData[blockHeight].totalPrice += totalPrice;
      aggregatedData[blockHeight].count += 1;
    });

    const finalData = Object.entries(aggregatedData).map(([x, { totalAmount, totalPrice }]) => ({
      x: parseInt(x),
      y: totalPrice / totalAmount // calculate the weighted average price
    }));

    let chartConfig: any; // Use 'any' or define a type for your chart config
    const options = {
      legend: { display: false },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Block Height' },
        },
        y: {
          title: { display: true, text: 'Price per Token (sats)' },
          ticks: { callback: (value: number) => value.toLocaleString() }
        },
      },
    };

    if (chartStyle === 'line') {
      chartConfig = {
        type: 'scatter',
        data: {
          datasets: [{
            label: dataCategory,
            data: finalData,
            showLine: true,
            lineTension: 0,
            borderColor: '#ffc933',
            backgroundColor: 'transparent',
            pointBackgroundColor: '#cf33ff',
            fill: false
          }]
        },
        options
      };
    } else if (chartStyle === 'bubble') {
      // Prepare the bubble data with radius
      const bubbleData = finalData.map(item => ({
        ...item,
        r: Math.sqrt(aggregatedData[item.x].count) * 3 // example radius calculation
      }));

      chartConfig = {
        type: 'bubble',
        data: {
          datasets: [{
            label: dataCategory.charAt(0).toUpperCase() + dataCategory.slice(1),
            data: bubbleData,
            backgroundColor: 'rgba(255, 208, 52, 0.5)',
            borderColor: '#ffc933',
            borderWidth: 1
          }]
        },
        options
      };
    }

    // Encode the configuration for the URL
    const encodedChartConfig = encodeURIComponent(JSON.stringify(chartConfig));
    const quickChartUrl = `https://quickchart.io/chart?c=${encodedChartConfig}`;
    setChartUrl(quickChartUrl);

  }, [marketData, dataCategory, chartStyle]);

  return (
    <div>
      {chartUrl && <Image src={chartUrl} alt={`${dataCategory} ${chartStyle} Chart`} />}
    </div>
  );
};

export default ChartComponent;
