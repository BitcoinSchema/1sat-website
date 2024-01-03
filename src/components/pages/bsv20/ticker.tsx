import Tabs, { MarketTab } from "@/components/pages/market/tabs";
import { API_HOST, Ticker } from "@/context/ordinals";
import { useWallet } from "@/context/wallet";
import { find } from "lodash";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import { useSearchParams } from "next/navigation";
import Router from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaQuestionCircle } from "react-icons/fa";
import { toBitcoin } from "satoshi-bitcoin-ts";
import { FetchStatus } from "..";
import { baseFee, calculateIndexingFee, minFee } from "../inscribe/bsv20";

interface PageProps extends WithRouterProps {}

const TickerPage: React.FC<PageProps> = ({}) => {
  const searchParams = useSearchParams();

  const tick = searchParams.get("tick");
  const {
    fetchBsv20sStatus,
    setFetchBsv20sStatus,
    bsv20Balances,
    usdRate,
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

  const fundTicker = useMemo(() => {
    return (
      <div className="my-2 bg-[#111] p-4">
        <h3 className="text-lg text-center my-2 font-semibold">
          Indexing Fund
        </h3>
        {/* <QRCodeSVG
          value={ticker.fundAddress || ""}
          className="my-4 w-full h-full"
          includeMargin={true}
        /> */}

        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {/* <div>Indexing Fund Address</div>
          <div className="text-right text-xs">{ticker.fundAddress}</div> */}
          {!ticker.included && (
            <>
              <div>
                Listing Price{" "}
                <div
                  className="tooltip"
                  data-tip={`This fee covers including ${ticker.tick} on 1satordinals.com. All pending actions must also be funded in addition to the listing fee before balances can be fully determined.`}
                >
                  <FaQuestionCircle className="inline" />
                </div>
              </div>
              <div className="text-right">
                $
                {calculateIndexingFee(
                  baseFee,
                  BigInt(ticker.supply || "0"),
                  parseInt(ticker.lim || "0"),
                  minFee,
                  usdRate || 0
                )}
              </div>
            </>
          )}
          <div>Balance</div>
          <div className="text-right">{ticker.fundBalance}</div>
          <div>Used</div>
          <div className="text-right">{ticker.fundUsed}</div>
        </div>
      </div>
    );
  }, [ticker, usdRate]);

  return (
    <>
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
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full max-w-lg">
          <div className="font-semibold text-2xl">{ticker?.tick}</div>
          <div></div>
          <div>Max Supply</div>
          <div className="text-right">{ticker?.max}</div>
          <div>Mint Limit</div>
          <div className="text-right">{ticker?.lim}</div>
        </div>
      )}
      {ticker.included && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full max-w-lg">
          <div className="font-semibold text-2xl">{ticker?.tick}</div>
          <div>&nbsp;</div>

          <div>Owned</div>
          <div className="text-right">{amtOwned?.confirmed || 0}</div>

          <div>Pending</div>
          <div className="text-right">{amtOwned?.pending || 0}</div>

          <div>Supply</div>
          <div className="text-right">
            {ticker?.supply} / {ticker?.max}
          </div>
          <div>Mint Limit</div>
          <div className="text-right">{ticker?.lim}</div>

          <div>Accounts</div>
          <div className="text-right">{ticker?.accounts}</div>
        </div>
      )}
      {!ticker.included && (
        <div className="max-w-lg">
          <div className="bg-blue-100 text-blue-800 p-2 rounded my-4 w-full">
            This ticker is not included in the Ordinals index. You can
            contribute to the indexing fund below. Once included in the index,
            gas will still be required to maintain its status.
          </div>
          {fundTicker}
        </div>
      )}
      {ticker.included && parseInt(ticker.pendingOps || "0") > 0 && (
        <>
          <div className="max-w-lg my-2 bg-warning text-warning-content p-2 rounded">
            Need payment for {ticker.pendingOps} unindexed actions:{" "}
            {toBitcoin(parseInt(ticker.pendingOps || "0") * 1000)} BSV. Balances
            are not updated in real time, but will be show once included in a
            block.
          </div>
          {fundTicker}
        </>
      )}
      <div className="flex items-center gap-2">
        {ticker.included &&
          parseInt(ticker.pendingOps || "0") === 0 &&
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
      </div>
    </>
  );
};

export default TickerPage;
