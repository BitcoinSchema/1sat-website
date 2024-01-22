"use client";

import BuyArtifactModal from "@/components/modal/buyArtifact";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import Link from "next/link";
import { toBitcoin } from "satoshi-bitcoin-ts";
import TremorChartComponent from "./chart2";
import { MarketData } from "./list";

const TickerContent = ({ ticker, currentHeight, show }: { ticker: MarketData, currentHeight: number, show: boolean }) => {
  useSignals();

  const showBuy = useSignal<string | null>(null);

  return (
    <tr className={`transition ${show ? "bg-base-200" : "hidden"}`}>
      <td colSpan={3} className="align-top">
        <TremorChartComponent
          marketData={ticker}
          dataCategory={"listings"}
          chartStyle="bubble"
          currentHeight={currentHeight}
        />
        <div className="font-semibold mt-4 text-base-content/75 flex justify-between text-lg font-mono">
          <div>Listings</div>
          <div>View All</div>
        </div>
        <div className="divider my-1" />
        {ticker.listings?.map((listing) => {
          return (
            <div
              className="flex w-full justify-between"
              key={`${listing.txid}`}
            >
              <Link
                href={`/outpoint/${listing.txid}_${listing.vout}`}
                className="flex flex-col py-1"
                key={`${listing.txid}-${listing.vout}-${listing.height}`}
              >
                <span className="text-secondary-content/75">{`${(
                  parseInt(listing.amt) /
                  10 ** ticker.dec
                ).toLocaleString()} ${ticker.tick}`}</span>
                <span className="text-accent text-xs">
                  {listing.pricePer} sat/token
                </span>
              </Link>
              <div className="py-1">
                <button
                  className="ml-2 btn btn-outline hover:btn-primary transition btn-xs"
                  onClick={() => {
                    console.log({ listing });
                    showBuy.value = listing.txid || null;
                  }}
                >
                  {toBitcoin(listing.price)} BSV
                </button>
                {show &&
                  showBuy.value === listing.txid && (
                    <BuyArtifactModal
                      listing={listing}
                      onClose={() => showBuy.value = null}
                      price={parseInt(listing.price)}
                      showLicense={false}
                      content={
                        <div className="w-full h-full rounded border border-secondary flex flex-col items-center justify-center">
                          <span className="text-xl text-secondary-content/75">{`${(
                            parseInt(listing.amt) /
                            10 ** ticker.dec
                          ).toLocaleString()} ${ticker.tick}`}</span>
                          <span className="texl-base text-accent text-xs my-1">
                            {listing.pricePer} sat/token
                          </span>
                          <span className="text-base-content/75">
                            Status: {listing.status}
                          </span>
                          <Link href={`/outpoint/${listing.txid}_${listing.vout}`} className="text-sm flex items-center my-2">Listing Details</Link>
                          
                        </div>
                      }
                    />
                  )}
              </div>
            </div>
          );
        })}
      </td>
      <td colSpan={2} className="align-top">
        <TremorChartComponent
          marketData={ticker}
          dataCategory={"sales"}
          chartStyle="line"
          currentHeight={currentHeight}
        />
        <div className="font-semibold mt-4 text-base-content/75 flex justify-between text-lg font-mono">
          <div>Recent Sales</div>
          <div>View All</div>
        </div>
        <div className="divider my-1" />
        {/* {ticker.sales?.map((sale) => {
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
                  {(parseInt(sale.amt) / 10 ** ticker.dec).toLocaleString()}{" "}
                  {ticker.tick}
                </span>
                <span className="text-accent text-xs">
                  {sale.pricePer} / token
                </span>
              </Link>
              <div className="py-1">
                <button
                  disabled
                  className="btn btn-xs btn-outline btn-secondary pointer-events-none"
                >
                  {toBitcoin(sale.price)} BSV
                </button>
              </div>
            </div>
          );
        })} */}
      </td>
    </tr>
  );
};

export default TickerContent;
