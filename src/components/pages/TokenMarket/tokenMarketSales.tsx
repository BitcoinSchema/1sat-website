import { API_HOST, AssetType } from "@/constants";
import type { BSV20TXO } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useInView } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { toBitcoin } from "satoshi-token";
import type { MarketData } from "./list";
import { sales } from "./signals";
import { CurrencyDisplay, currencyDisplay, exchangeRate } from "@/signals/wallet";
import { Button } from "@/components/ui/button";

interface Props {
  ticker: MarketData;
  type: AssetType.BSV20 | AssetType.BSV21;
}

export function TokenMarketSales({ ticker, type }: Props) {
  useSignals();

  const salesRef = useRef(null);
  const salesInView = useInView(salesRef);
  const newSalesOffset = useSignal(0);
  const reachedEndOfSales = useSignal(false);

  useEffect(() => {
    let nextPageOfSales: BSV20TXO[] = [];

    const fire = async (id: string) => {
      if (newSalesOffset.value === 0) {
        sales.value = [];
      }
      let urlMarket = `${API_HOST}/api/bsv20/market/sales?dir=desc&limit=20&offset=${newSalesOffset.value}&tick=${id}&pending=true`;
      if (type === AssetType.BSV21) {
        urlMarket = `${API_HOST}/api/bsv20/market/sales?dir=desc&limit=20&offset=${newSalesOffset.value}&id=${id}&pending=true`;
      }
      newSalesOffset.value += 20;
      const { promise: promiseBsv20v1Market } =
        http.customFetch<BSV20TXO[]>(urlMarket);
      nextPageOfSales = await promiseBsv20v1Market;

      if (nextPageOfSales.length > 0) {
        // For some reason this would return some items the same id from the first call so we filter them out
        sales.value = [
          ...(sales.value || []),
          ...nextPageOfSales.filter(
            (l) => !sales.value?.some((l2) => l2.txid === l.txid)
          ),
        ];
      } else {
        reachedEndOfSales.value = true;
      }
    };

    // if (salesInView) {
    //   console.log({ salesInView });
    // }
    if (
      type === AssetType.BSV20 &&
      (salesInView || newSalesOffset.value === 0) &&
      ticker.tick &&
      !reachedEndOfSales.value
    ) {
      fire(ticker.tick);
    } else if (
      type === AssetType.BSV21 &&
      (salesInView || newSalesOffset.value === 0) && // fire the first time
      ticker.id &&
      !reachedEndOfSales.value
    ) {
      fire(ticker.id);
    }
  }, [salesInView, newSalesOffset, reachedEndOfSales, ticker, type]);

  
  return (
    <>
      {sales.value?.map((sale) => {

const qty = Number.parseInt(sale.amt, 10) / 10 ** ticker.dec;
const _qtyStr = `${qty.toLocaleString()} ${ticker.tick || ticker.sym}`;

const pricePerSat = Number.parseFloat(sale.price) / qty;
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
          ? Number.parseInt(sale.price, 10) < 1000
            ? `${sale.price} sat`
            : `${toBitcoin(sale.price)} BSV`
          : `${(
              (Number.parseInt(sale.price, 10) / 1e8) *
              exchangeRate.value
            ).toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
              useGrouping: true,
            })}`;

        return (
          <div
            className="flex w-full justify-between items-center py-2 border-b border-border last:border-b-0"
            key={`${sale.txid}-${sale.vout}-${sale.height}`}
          >
            <Link
              href={`/outpoint/${sale.txid}`}
              className="flex flex-col py-1 hover:text-primary transition"
            >
              <span className="text-foreground">
                {(
                  Number.parseInt(sale.amt, 10) /
                  10 ** ticker.dec
                ).toLocaleString()}{" "}
                {ticker.tick}
              </span>
              <div className="flex items-center">
                <span className="text-muted-foreground text-xs">
                  {pricePer} / token
                </span>
                <span className="text-primary text-xs mx-1">
                  •
                </span>
                <span className="text-primary text-xs">
                  Block #{sale.height}
                </span>
              </div>
            </Link>
            <div className="py-1">
              <Button
                variant="outline"
                size="sm"
                disabled
                className="text-xs pointer-events-none"
              >
                {buttonText}
              </Button>
            </div>
          </div>
        );
      })}
      {sales.value?.length === 0 && (
        <div className="text-center text-muted-foreground min-h-64 flex items-center justify-center">
          No sales found
        </div>
      )}
      <div ref={salesRef} />
    </>
  );
}
