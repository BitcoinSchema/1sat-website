import { API_HOST, AssetType } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import type { BSV20TXO } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useInView } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { toBitcoin } from "satoshi-token";
import type { MarketData } from "./list";
import { mySales } from "./signals";
import { Button } from "@/components/ui/button";

interface Props {
  ticker: MarketData;
  type: AssetType.BSV20 | AssetType.BSV21;
}

export function TokenMarketMySales({ ticker, type }: Props) {
  useSignals();

  const salesRef = useRef(null);
  const salesInView = useInView(salesRef);
  const newSalesOffset = useSignal(0);
  const reachedEndOfSales = useSignal(false);

  useEffect(() => {
    let nextPageOfSales: BSV20TXO[] = [];

    const fire = async (id: string, address: string) => {
      if (newSalesOffset.value === 0) {
        mySales.value = [];
      }
      let urlMarket = `${API_HOST}/api/bsv20/${address}/tick/${id}/history?dir=desc&limit=20&offset=${newSalesOffset.value}&sale=true`;
      if (type === AssetType.BSV21) {
        urlMarket = `${API_HOST}/api/bsv20/${address}/id/${id}/history?dir=desc&limit=20&offset=${newSalesOffset.value}&sale=true`;
      }
      newSalesOffset.value += 20;
      const { promise: promiseBsv20v1Market } =
        http.customFetch<BSV20TXO[]>(urlMarket);
      nextPageOfSales = await promiseBsv20v1Market;

      if (nextPageOfSales.length > 0) {
        // For some reason this would return some items the same id from the first call so we filter them out
        mySales.value = [
          ...(mySales.value || []),
          ...nextPageOfSales.filter(
            (l) => !mySales.value?.some((l2) => l2.txid === l.txid)
          ),
        ];
      } else {
        reachedEndOfSales.value = true;
      }
    };

    // if (salesInView) {
    //   console.log({ salesInView });
    // }
    
    if (ordAddress.value &&
      type === AssetType.BSV20 &&
      (salesInView || newSalesOffset.value === 0) &&
      ticker.tick &&
      !reachedEndOfSales.value
    ) {
      fire(ticker.tick, ordAddress.value);
    } else if (
      ordAddress.value &&
      type === AssetType.BSV21 &&
      (salesInView || newSalesOffset.value === 0) && // fire the first time
      ticker.id &&
      !reachedEndOfSales.value
    ) {
      fire(ticker.id, ordAddress.value);
    }
  }, [salesInView, newSalesOffset, reachedEndOfSales, ticker, type, ordAddress.value]);

  return (
    <>
      {mySales.value?.map((sale) => {
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
                  Number.parseInt(sale.amt) /
                  10 ** ticker.dec
                ).toLocaleString()}{" "}
                {ticker.tick}
              </span>
              <div className="flex items-center">
                <span className="text-muted-foreground text-xs">
                  {sale.pricePer} / token
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
                {Number.parseInt(sale.price) > 1000
                  ? `${toBitcoin(sale.price)} BSV`
                  : `${sale.price} sat`}
              </Button>
            </div>
          </div>
        );
      })}
      {mySales.value?.length === 0 && (
        <div className="text-center text-muted-foreground min-h-64 flex items-center justify-center">
          No sales found
        </div>
      )}
      <div ref={salesRef} />
    </>
  );
}
