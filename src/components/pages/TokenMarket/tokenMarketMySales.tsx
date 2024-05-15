import { API_HOST, AssetType } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import type { BSV20TXO } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useInView } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { toBitcoin } from "satoshi-bitcoin-ts";
import type { MarketData } from "./list";
import { mySales } from "./signals";

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

    const fire = async (id: string) => {
      if (newSalesOffset.value === 0) {
        mySales.value = [];
      }
      let urlMarket = `${API_HOST}/api/bsv20/${ordAddress.value}/tick/${id}/history?dir=desc&limit=20&offset=${newSalesOffset.value}&listing=true`;
      if (type === AssetType.BSV21) {
        urlMarket = `${API_HOST}/api/bsv20/${ordAddress.value}/id/${id}/history?dir=desc&limit=20&offset=${newSalesOffset.value}&listing=true`;
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

    if (salesInView) {
      console.log({ salesInView });
    }
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
      {mySales.value?.map((sale) => {
        return (
          <div
            className="flex w-full justify-between"
            key={`${sale.txid}-${sale.vout}-${sale.height}`}
          >
            <Link
              href={`/outpoint/${sale.txid}`}
              className="flex flex-col py-1"
            >
              <span className="text-secondary-content/75">
                {(
                  Number.parseInt(sale.amt) /
                  10 ** ticker.dec
                ).toLocaleString()}{" "}
                {ticker.tick}
              </span>
              <div className="flex items-center">
                <span className="text-accent text-xs">
                  {sale.pricePer} / token
                </span>
                <span className="text-accent text-xs mx-1">
                  •
                </span>
                <span className="text-accent text-xs">
                  Block #{sale.height}
                </span>
              </div>
            </Link>
            <div className="py-1">
              <button
                type="button"
                disabled
                className="btn btn-xs btn-outline btn-secondary pointer-events-none"
              >
                {Number.parseInt(sale.price) > 1000
                  ? `${toBitcoin(sale.price)} BSV`
                  : `${sale.price} sat`}
              </button>
            </div>
          </div>
        );
      })}
      {mySales.value?.length === 0 && (
        <div className="text-center text-base-content/75 min-h-64 flex items-center justify-center">
          No sales found
        </div>
      )}
      <div ref={salesRef} />
    </>
  );
}
