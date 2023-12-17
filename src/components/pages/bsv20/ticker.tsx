import Tabs, { MarketTab } from "@/components/pages/market/tabs";
import { API_HOST, Ticker } from "@/context/ordinals";
import { useWallet } from "@/context/wallet";
import { find } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import { useSearchParams } from "next/navigation";
import Router from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FetchStatus } from "..";

interface PageProps extends WithRouterProps {}

const TickerPage: React.FC<PageProps> = ({}) => {
  const searchParams = useSearchParams();

  const tick = searchParams.get("tick");
  const {
    fetchBsv20sStatus,
    setFetchBsv20sStatus,
    bsv20Balances,
    bsv20Activity,
  } = useWallet();

  const [ticker, setTicker] = useState<Partial<Ticker>>({
    tick,
    accounts: 0,
  } as Partial<Ticker>);

  const [fetchTickerStatus, setFetchTickerStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  const getTicker = useCallback(
    async (t: string) => {
      try {
        setFetchTickerStatus(FetchStatus.Loading);
        const resp = await fetch(
          `${API_HOST}/api/bsv20/tick/${encodeURIComponent(t)}`
        );

        const tickerDetails = (await resp.json()) as Ticker;
        setFetchTickerStatus(FetchStatus.Success);
        setTicker(tickerDetails);
      } catch (e) {
        setFetchTickerStatus(FetchStatus.Error);
        console.error({ e });
      }
    },
    [setTicker, setFetchTickerStatus]
  );

  const amtOwned = useMemo(() => {
    // return balance from bsv20Balances[ticker.tick]
    return bsv20Balances && ticker.tick
      ? find(bsv20Balances, (t) => t.tick === ticker.tick)?.all
      : { confirmed: 0, pending: 0 };
  }, [bsv20Balances, ticker]);

  useEffect(() => {
    const fire = async (t: string) => {
      await getTicker(t);
    };
    if (tick && fetchTickerStatus === FetchStatus.Idle) {
      fire(tick);
    }
  }, [tick, fetchTickerStatus, getTicker]);

  const mintedOut = useMemo(() => {
    return ticker?.supply === ticker?.max;
  }, [ticker]);

  // available count
  // pct minted

  return (
    <>
      {" "}
      <Head>
        <title>1SatOrdinals.com - BSV20 Ticker</title>
        <meta
          name="description"
          content="An Ordinals-compatible implementation on Bitcoin SV"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Tabs
        currentTab={MarketTab.BSV20}
        // onClickSelected={() =>
        //   fetchBsv20sStatus === FetchStatus.Loading
        //     ? () => {}
        //     : setFetchBsv20sStatus(FetchStatus.Idle)
        // }
        // showIndicator={fetchBsv20sStatus !== FetchStatus.Loading}
      />
      {!ticker.included && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="font-semibold text-2xl">{ticker?.tick}</div>
          <div></div>
          <div>Max Supply</div>
          <div>{ticker?.max}</div>
          <div>Mint Limit</div>
          <div>{ticker?.lim}</div>
        </div>
      )}
      {ticker.included && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="font-semibold text-2xl">{ticker?.tick}</div>
          <div></div>

          <div>Owned</div>
          <div>{amtOwned?.confirmed || 0}</div>

          <div>Pending</div>
          <div>{amtOwned?.pending || 0}</div>

          <div>Supply</div>
          <div>
            {ticker?.supply} / {ticker?.max}
          </div>
          <div>Mint Limit</div>
          <div>{ticker?.lim}</div>

          <div>Accounts</div>
          <div>{ticker?.accounts}</div>
        </div>
      )}
      {!ticker.included && (
        <div className="bg-blue-100 text-blue-800 p-2 rounded my-2 max-w-md">
          This ticker is not included in the Ordinals index. You can contribute
          to the indexing fund below (soonTm).
        </div>
      )}
      <br />
      <div className="flex items-center gap-2">
        {ticker.included &&
          parseInt(ticker.supply || "0") < parseInt(ticker.max || "0") && (
            <div
              onClick={(e) => {
                if (mintedOut) {
                  e.preventDefault();
                  return;
                }
                Router.push(`/inscribe?tab=bsv20&tick=${tick}&op=mint`);
              }}
              className="cursor-pointer hover:bg-emerald-500 transition p-2 rounded bg-emerald-600 text-white font-semibold"
            >
              {`Mint ${tick}`}
            </div>
          )}
        {ticker.included &&
          parseInt(ticker.supply || "0") >= parseInt(ticker.max || "0") && (
            <div className="text-red-400 bg-[#111] rounded p-2">Minted Out</div>
          )}
        {
          !ticker.included && "&nbsp;"
          // <div className="cursor-pointer hover:bg-emerald-500 transition p-2 rounded bg-emerald-600 text-white font-semibold">
          //   {`Index ${tick}`}
          // </div>
        }
      </div>
    </>
  );
};

export default TickerPage;
