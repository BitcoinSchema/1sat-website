import Tabs, { Tab } from "@/components/tabs";
import { Bsv20Status, useOrdinals } from "@/context/ordinals";
import { useWallet } from "@/context/wallet";
import { WithRouterProps } from "next/dist/client/with-router";
import Head from "next/head";
import { useRouter, useSearchParams } from "next/navigation";
import Router from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { FetchStatus } from "..";
import WalletTabs, { WalletTab } from "../wallet/tabs";

interface PageProps extends WithRouterProps {}

const textStatus = (status: Bsv20Status) => {
  switch (status) {
    case Bsv20Status.Invalid:
      return "Invalid";
    case Bsv20Status.Pending:
      return "Pending";
    case Bsv20Status.Valid:
      return "Valid";
  }
};

const Bsv20WalletPage: React.FC<PageProps> = ({}) => {
  const {
    payPk,
    ordPk,
    fetchBsv20sStatus,
    setFetchBsv20sStatus,
    bsv20Balances,
    bsv20Activity,
    bsv20ArchiveActivity,
  } = useWallet();
  const router = useRouter();
  const { stats, fetchStatsStatus } = useOrdinals();
  const searchParams = useSearchParams();

  const page = searchParams.get("page");
  const [lastSettled, setLastSettled] = useState<number | undefined>();
  const [showInvalid, setShowInvalid] = useState<boolean>(false);

  const activity = useMemo(() => {
    return bsv20Activity?.sort((a, b) => {
      if (!a && !!b) {
        return 1;
      }
      if (!!a && !b) {
        return -1;
      }
      // pending to the top
      if (a.status !== Bsv20Status.Valid && b.status === Bsv20Status.Valid) {
        return -1;
      }
      // if (a.height! < b.height!) {
      //   return -1;
      // }
      // same block, use index
      // if (a.height === b.height) {
      //   return parseInt(a.idx) > parseInt(b.idx) ? -1 : 1;
      // }
      return 1;
    });
  }, [bsv20Activity]);

  const archiveActivity = useMemo(() => {
    return bsv20ArchiveActivity?.sort((a, b) => {
      if (!a && !!b) {
        return 1;
      }
      if (!!a && !b) {
        return -1;
      }
      // pending to the top
      if (a.status !== Bsv20Status.Valid && b.status === Bsv20Status.Valid) {
        return -1;
      }
      // if (a.height! < b.height!) {
      //   return -1;
      // }
      // same block, use index
      // if (a.height === b.height) {
      //   return parseInt(a.idx) > parseInt(b.idx) ? -1 : 1;
      // }
      return 1;
    });
  }, [bsv20ArchiveActivity]);

  useEffect(() => {
    if (stats && stats["bsv20-deploy"] !== lastSettled) {
      // TODO: When indexer resets this is LOUD
      // crawl someone went back the beginning
      // as it flys through blocks with no matching txs
      // setFetchBsv20sStatus(FetchStatus.Idle);
      setLastSettled(stats["bsv20-deploy"]);
    }
  }, [lastSettled, stats]);

  const archivedActivity = useMemo(() => {
    if (!showInvalid) {
      return archiveActivity?.filter((a) => a.status !== Bsv20Status.Invalid);
    }
    return archiveActivity;
  }, [archiveActivity, showInvalid]);

  const filteredActivity = useMemo(() => {
    if (!showInvalid) {
      return activity?.filter((a) => a.status !== Bsv20Status.Invalid);
    }
    return activity;
  }, [activity, showInvalid]);

  // log filteredActivity
  useEffect(() => {
    console.log({ filteredActivity, archiveActivity });
  }, [filteredActivity, archiveActivity]);

  const pagination = useMemo(() => {
    return (
      <div className="text-center h-full flex items-center justify-center">
        <div className="flex items-center justify-between max-w-2xl">
          {parseInt(page || "1") > 1 && (
            <div className="">
              <button
                className="bg-[#111] rounded mb-8 text-sm p-2 md:p-4 my-4"
                onClick={() =>
                  router.push(`/bsv20/?page=${page ? parseInt(page) - 1 : 1}`)
                }
              >
                Prev
              </button>
            </div>
          )}
          <div className="bg-[#111] rounded flex items-center mb-8 max-w-2xl text-sm p-2 md:p-4 m-4">
            Page {parseInt(page || "1")}
          </div>
          <div className="">
            <button
              className="bg-[#111] rounded mb-8 text-sm p-2 md:p-4 my-4"
              onClick={() =>
                router.push(
                  page
                    ? `/bsv20/?page=${parseInt(page || "1") + 1}`
                    : "/bsv20/?page=2"
                )
              }
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }, [router, page]);

  // log bsv20 balances
  useEffect(() => {
    console.log({ bsv20Balances });
  }, [bsv20Balances]);

  return (
    <>
      <Head>
        <title>1SatOrdinals.com - BSV20</title>
        <meta
          name="description"
          content="An Ordinals-compatible implementation on Bitcoin SV"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Tabs
        currentTab={Tab.Wallet}
        onClickSelected={() =>
          fetchBsv20sStatus === FetchStatus.Loading
            ? () => {}
            : setFetchBsv20sStatus(FetchStatus.Idle)
        }
        showIndicator={fetchBsv20sStatus !== FetchStatus.Loading}
      />
      <WalletTabs currentTab={WalletTab.BSV20} />

      <div className="p-4">
        {fetchBsv20sStatus !== FetchStatus.Loading && (!payPk || !ordPk) && (
          <div
            className="max-w-md rounded my-8 bg-[#222] hover:bg-[#333] cursor-pointer mx-auto p-4 md:p-8"
            onClick={() => Router.push("./wallet")}
          >
            You need a wallet first.
          </div>
        )}
        {fetchBsv20sStatus === FetchStatus.Success &&
          bsv20Balances?.length === 0 &&
          payPk &&
          ordPk && (
            <div className="max-w-md rounded bg-[#222] hover:bg-[#333] cursor-pointer mx-auto p-8 my-8">
              You, sadly, have no artifacts.
            </div>
          )}

        <div className={`${"mb-12"} mx-auto min-w-[300px]`}>
          {/* <div className="my-2 text-lg flex justify-between items-center">
            <div>BSV-20</div>
            <div className="flex items-center"></div>
          </div> */}

          <div className="flex flex-col md:flex-row">
            <div className="mb-4">
              <h1 className="text-lg mb-4">Balances</h1>
              <div className="grid grid-cols-2 gap-3 bg-[#222] p-4 rounded md:mr-4 mb-4">
                <div className="text-[#777] font-semibold">Ticker</div>
                <div className="text-[#777] font-semibold">Balance</div>
                {bsv20Balances &&
                  bsv20Balances.map(({ tick, all, listed }, idx) => (
                    <React.Fragment key={`bal-${tick}-${idx}`}>
                      <div
                        className="cursor-pointer hover:text-blue-400 transition"
                        onClick={() => Router.push(`/market/bsv20/${tick}`)}
                      >
                        {tick}
                      </div>
                      <div className="text-emerald-400">{all.confirmed}</div>
                    </React.Fragment>
                  ))}
              </div>
            </div>

            <div className="md:ml-4">
              <h1 className="text-lg mb-4 flex items-center justify-between">
                <div>Activity</div>
                <div className="text-sm text-[#555]">
                  <label className="cursor-pointer hover:text-[#777] transition">
                    Show Invalid{" "}
                    <input
                      checked={showInvalid}
                      type="checkbox"
                      className="ml-2 transition"
                      onChange={(e) => {
                        console.log({ cehcked: e.target.checked });
                        setShowInvalid(!showInvalid);
                      }}
                    />
                  </label>
                </div>
              </h1>
              <div className="my-2 w-full text-sm grid grid-cols-4 p-4 gap-x-4 gap-y-2">
                <div className="font-semibold text-[#777] text-base">
                  Ticker
                </div>
                <div className="font-semibold text-[#777] text-base">Op</div>
                <div className="font-semibold text-[#777] text-base">
                  Amount
                </div>
                <div className="font-semibold text-[#777] text-base text-right">
                  Valid
                </div>
                {filteredActivity?.map((bsv20, index) => (
                  <React.Fragment key={`act-${bsv20.tick}-${index}`}>
                    <div
                      className="flex items-center cursor-pointer hover:text-blue-400 transition"
                      onClick={() => Router.push(`/market/bsv20/${bsv20.tick}`)}
                    >
                      {bsv20.tick}
                    </div>
                    <div>{bsv20.op} </div>
                    <div>{bsv20.amt} </div>
                    <div className="text-right">
                      {bsv20.status === Bsv20Status.Pending ? (
                        <a href={`https://whatsonchain.com/tx/${bsv20.id}`}>
                          [-]
                        </a>
                      ) : bsv20.status === Bsv20Status.Valid ? (
                        "[✓]"
                      ) : (
                        "[✗]"
                      )}
                    </div>
                    {bsv20.status === Bsv20Status.Invalid && (
                      <div className="text-red-500 col-span-4">
                        Reason: {textStatus(bsv20.status)}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="max-w-md flex">{pagination}</div>
            </div>

            <div className="md:ml-4">
              <h1 className="text-lg mb-4 flex items-center justify-between">
                <div>Old Activity</div>
                <div className="text-sm text-[#555]">
                  <label className="cursor-pointer hover:text-[#777] transition">
                    Show Invalid{" "}
                    <input
                      checked={showInvalid}
                      type="checkbox"
                      className="ml-2 transition"
                      onChange={(e) => {
                        console.log({ cehcked: e.target.checked });
                        setShowInvalid(!showInvalid);
                      }}
                    />
                  </label>
                </div>
              </h1>
              <div className="my-2 w-full text-sm grid grid-cols-4 p-4 gap-x-4 gap-y-2">
                <div className="font-semibold text-[#777] text-base">
                  Ticker
                </div>
                <div className="font-semibold text-[#777] text-base">Op</div>
                <div className="font-semibold text-[#777] text-base">
                  Amount
                </div>
                <div className="font-semibold text-[#777] text-base text-right">
                  Valid
                </div>
                {archivedActivity?.map((bsv20, index) => (
                  <React.Fragment key={`act-${bsv20.tick}-${index}`}>
                    <div
                      className="flex items-center cursor-pointer hover:text-blue-400 transition"
                      onClick={() => Router.push(`/market/bsv20/${bsv20.tick}`)}
                    >
                      {bsv20.tick}
                    </div>
                    <div>{bsv20.op} </div>
                    <div>{bsv20.amt} </div>
                    <div className="text-right">
                      {bsv20.status === Bsv20Status.Pending ? (
                        <a href={`https://whatsonchain.com/tx/${bsv20.id}`}>
                          [-]
                        </a>
                      ) : bsv20.status === Bsv20Status.Valid ? (
                        "[✓]"
                      ) : (
                        "[✗]"
                      )}
                    </div>
                    {bsv20.status === Bsv20Status.Invalid && (
                      <div className="text-red-500 col-span-4">
                        Reason: {textStatus(bsv20.status)}
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="max-w-md flex">{pagination}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Bsv20WalletPage;
