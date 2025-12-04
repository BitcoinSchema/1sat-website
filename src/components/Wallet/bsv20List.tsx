"use client";

import {
  API_HOST,
  AssetType,
  FetchStatus,
  MARKET_API_HOST,
  resultsPerPage,
} from "@/constants";
import { bsv20Balances, usdRate } from "@/signals/wallet";
import { ordAddress } from "@/signals/wallet/address";
import type { BSV20Balance } from "@/types/bsv20";
import type { BSV20TXO } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { getBalanceText } from "@/utils/wallet";
import { computed, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useInView } from "framer-motion";
import { useVirtualizer } from "@tanstack/react-virtual";
import { find, uniq } from "lodash";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IoSend } from "react-icons/io5";

import { useLocalStorage } from "@/utils/storage";
import { Noto_Serif } from "next/font/google";
import {
  FaChevronRight,
  FaFireFlameCurved,
  FaHashtag,
  FaParachuteBox,
} from "react-icons/fa6";
import { toBitcoin } from "satoshi-token";
import { Empty, EmptyTitle, EmptyDescription, EmptyContent } from "@/components/ui/empty";
import AirdropTokensModal from "../modal/airdrop";
import TransferBsv20Modal from "../modal/transferBsv20";
import { IconWithFallback } from "../pages/TokenMarket/heading";
import type { MarketData } from "../pages/TokenMarket/list";
import { truncate } from "../transaction/display";
import SAFU from "./safu";
import WalletTabs, { WalletTab } from "./tabs";

enum BalanceTab {
  Confirmed = 0,
  Pending = 1,
  Listed = 2,
  Unindexed = 3,
}
const notoSerif = Noto_Serif({
  style: "italic",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const Bsv20List = ({
  type,
  address: addressProp,
}: {
  type: WalletTab.BSV20 | WalletTab.BSV21;
  address?: string;
}) => {
  useSignals();

  const [encryptedBackup] = useLocalStorage<string | undefined>(
    "encryptedBackup", undefined
  );
  // console.log({ ordAddress: ordAddress.value, addressProp, encryptedBackup });

  const ref = useRef(null);
  const isInView = useInView(ref);
  const parentRef = useRef<HTMLDivElement>(null);
  const [newOffset, setNewOffset] = useState(0);
  const [reachedEndOfListings, setReachedEndOfListings] = useState(false);
  const [balanceTab, setBalanceTab] = useState(BalanceTab.Confirmed);
  const router = useRouter();
  const holdings = useSignal<BSV20TXO[] | null>(null);
  const addressBalances = useSignal<BSV20Balance[] | null>(null);
  const [showAirdrop, setShowAirdrop] = useState<string | undefined>(undefined);
  const [showSendModal, setShowSendModal] = useState<string | undefined>(undefined);
  const [showBurnModal, setShowBurnModal] = useState<string | undefined>(undefined);

  // get unspent ordAddress
  const bsv20s = useSignal<BSV20TXO[] | null>(null);
  const tickerDetails = useSignal<MarketData[] | null>(null);
  const history = useSignal<BSV20TXO[] | null>(null);
  const fetchHistoryStatus = useSignal<FetchStatus>(FetchStatus.Idle);
  const unspentStatus = useSignal<FetchStatus>(FetchStatus.Idle);
  const [loadingNextPage, setLoadingNextPage] = useState<FetchStatus>(FetchStatus.Idle);

  useEffect(() => {
    const fire = async () => {
      const url = `${MARKET_API_HOST}/ticker/num`;
      const unindexed = bsv20s.value?.map((u) => u.tick as string) || [];
      const fromBalances =
        bsv20Balances.value?.map((b) => b.tick as string) || [];
      const finalArray = (unindexed.concat(fromBalances) || []).filter(
        (id) => !!id,
      );
      // console.log({ finalArray });
      const ids = uniq(finalArray);
      if (!ids.length) return;

      tickerDetails.value = [];
      const result = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids }),
      });
      const results = (await result.json()) as MarketData[];
      tickerDetails.value = results;
    };

    if (bsv20s.value !== null && tickerDetails.value === null) {
      fire();
    }
  }, [bsv20s.value, tickerDetails.value]);

  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    const fire = async (address: string) => {
      // fetch token history
      // TODO: Use type
      if (fetchHistoryStatus.value === FetchStatus.Idle && address) {
        try {
          fetchHistoryStatus.value = FetchStatus.Loading;
          const historyUrl = `${API_HOST}/api/bsv20/${address}/history?limit=100&offset=0&type=${type === WalletTab.BSV20 ? "v1" : "v2"}`;
          const { promise } = http.customFetch<BSV20TXO[]>(historyUrl);
          history.value = await promise;
          fetchHistoryStatus.value = FetchStatus.Success;
        } catch (error) {
          fetchHistoryStatus.value = FetchStatus.Error;
          console.error("Error fetching token history", error);
        }
      }
    };
    if (!fetched) {
      const address = addressProp || ordAddress.value;
      if (address) {
        fire(address);
        setFetched(true);
      }
    }
  }, [fetchHistoryStatus, addressProp, type, ordAddress.value, fetched]);

  useEffect(() => {
    const address = addressProp || ordAddress.value;
    // get unindexed tickers
    const fire = async () => {
      unspentStatus.value = FetchStatus.Loading;
      bsv20s.value = [];
      try {
        const { promise } = http.customFetch<BSV20TXO[]>(
          `${API_HOST}/api/bsv20/${address}/unspent?limit=1000&offset=0&type=${type === WalletTab.BSV20 ? "v1" : "v2"}`,
        );
        const u = await promise;

        // filter out tickers that already exist in holdings, and group by ticker
        const tickerList = u.map((u) => u.tick);
        // console.log({ tickerList });
        bsv20s.value = u.filter((u) =>
          holdings.value?.every((h) => h.tick !== u.tick),
        );
        // console.log({ u });
        bsv20s.value = u;

        if (address !== ordAddress.value) {
          // not viewing own address
          // fetch balances
          const { promise: promiseBalances } = http.customFetch<BSV20Balance[]>(
            `${MARKET_API_HOST}/user/${address}/balance`,
          );
          const b = await promiseBalances;
          addressBalances.value = b.sort((a, b) => {
            return b.all.confirmed + b.all.pending >
              a.all.confirmed + a.all.pending
              ? 1
              : -1;
          });
        }
        unspentStatus.value = FetchStatus.Success;
      } catch (error) {
        console.error("Error fetching bsv20s", error);
        unspentStatus.value = FetchStatus.Error;
      }
    };
    if (!bsv20s.value && address && unspentStatus.value === FetchStatus.Idle) {
      fire();
    }
  }, [bsv20s, addressProp, unspentStatus.value]);

  const unindexBalances = useMemo(() => {
    return (
      bsv20s.value?.reduce(
        (acc, utxo) => {
          if (utxo.tick) {
            if (acc[utxo.tick]) {
              acc[utxo.tick] += Number.parseInt(utxo.amt);
            } else {
              acc[utxo.tick] = Number.parseInt(utxo.amt);
            }
          }
          return acc;
        },
        {} as { [key: string]: number },
      ) || {}
    );
  }, [bsv20s.value]);

  useEffect(() => {
    const fire = async (address: string) => {
      setLoadingNextPage(FetchStatus.Loading);
      if (type === WalletTab.BSV20) {
        const urlTokens = `${API_HOST}/api/bsv20/${address}/history?limit=${resultsPerPage}&offset=${newOffset}&dir=desc&type=v1`;
        const { promise: promiseBsv20 } =
          http.customFetch<BSV20TXO[]>(urlTokens);
        const newResults = await promiseBsv20;
        if (newResults.length > 0) {
          holdings.value = (holdings.value || []).concat(newResults);
          setLoadingNextPage(FetchStatus.Idle);
        } else {
          setReachedEndOfListings(true);
          setLoadingNextPage(FetchStatus.Success);
        }
      } else {
        const urlV2Tokens = `${API_HOST}/api/bsv20/${address}/history?limit=${resultsPerPage}&offset=${newOffset}&dir=desc&type=v2`;
        const { promise: promiseBsv21 } =
          http.customFetch<BSV20TXO[]>(urlV2Tokens);
        const newResults = await promiseBsv21;
        if (newResults.length > 0) {
          holdings.value = (holdings.value || []).concat(newResults);
          setLoadingNextPage(FetchStatus.Idle);
        } else {
          setReachedEndOfListings(true);
          setLoadingNextPage(FetchStatus.Success);
        }
      }
      setNewOffset(prev => prev + resultsPerPage);
    };

    // Debounce scroll trigger to prevent rapid-fire requests
    const timeoutId = setTimeout(() => {
      if (
        isInView &&
        !reachedEndOfListings &&
        loadingNextPage === FetchStatus.Idle
      ) {
        const address = addressProp || ordAddress.value;
        if (address) {
          fire(address);
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    addressProp,
    holdings,
    isInView,
    newOffset,
    reachedEndOfListings,
    loadingNextPage,
    type,
    ordAddress.value
  ]);

  const balances = computed(() => {
    return (addressProp ? addressBalances.value : bsv20Balances.value)?.filter(
      (b) => (type === WalletTab.BSV20 ? !!b.tick : !b.tick),
    );
  });

  const getDec = useCallback(
    (tick?: string, id?: string) => {
      const deets = find(balances.value, (t) =>
        type === WalletTab.BSV20 ? t.tick === tick : t.id === id,
      );
      return deets?.dec || 0;
    },
    [balances.value, type],
  );

  const getSym = useCallback(
    (id: string) => {
      return find(balances.value, (t) => t.id === id)?.sym;
    },
    [balances.value],
  );

  const getAction = useCallback(
    (bsv20: BSV20TXO) => {
      // if (bsv20.owner === ordAddress.value) {
      //   return "Received";
      // }
      // // default
      // return bsv20.op;
      if (bsv20.sale) {
        return "Sale";
      }

      if (bsv20.spend !== "") {
        return "Transferred";
      }

      return "Recieved";
    },
    [ordAddress.value, balances.value],
  );

  const activityData = useMemo(() => {
    return (history.value || [])
      .concat(bsv20s.value || [])
      .filter((b) => (type === WalletTab.BSV20 ? !!b.tick : !b.tick));
  }, [history.value, bsv20s.value, type]);

  const rowVirtualizer = useVirtualizer({
    count: activityData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40, // Estimated row height
    overscan: 5, // Render 5 extra items above/below viewport
  });

  const renderActivityRow = useCallback((bsv20: BSV20TXO) => {
    const decimals = getDec(bsv20.tick, bsv20.id);
    const amount = getBalanceText(
      Number.parseInt(bsv20.amt || "0") / 10 ** decimals,
      decimals,
    );

    return (
      <>
        <div className="text-xs text-info">
          <Link
            href={`https://whatsonchain.com/tx/${bsv20.txid}`}
            target="_blank"
          >
            {bsv20.height}
          </Link>
        </div>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <div
          className="flex items-center cursor-pointer hover:text-blue-400 transition"
          onClick={() =>
            router.push(
              `/market/${bsv20.tick ? `bsv20/${bsv20.tick}` : `bsv21/${bsv20?.id}`
              }`,
            )
          }
        >
          {bsv20.tick ||
            getSym(bsv20.id) ||
            bsv20.id?.slice(-8) ||
            bsv20.id?.slice(-8)}
        </div>
        <div>{getAction(bsv20)}</div>
        <div className="text-xs">{bsv20 && amount}</div>
        <div
          className={`text-xs ${bsv20.price ? (bsv20.owner === ordAddress.value ? "text-emerald-500" : "text-red-400") : "text-gray-500"}`}
        >
          {bsv20.price && bsv20.price !== "0"
            ? `${toBitcoin(bsv20.price)} BSV`
            : "-"}
        </div>
        <div>
          <Link href={`/outpoint/${bsv20.txid}_${bsv20.vout}/token`}>
            <FaChevronRight />
          </Link>
        </div>
      </>
    );
  }, [getDec, getSym, getAction, ordAddress.value, router]);

  const listingBalances = computed(() => {
    return balances.value?.filter((b) => {
      return b.listed.confirmed + b.listed.pending > 0;
    });
  });

  const pendingBalances = computed(() => {
    return balances.value?.filter((b) => {
      return b.all.pending > 0;
    });
  });

  const confirmedBalances = computed(() => {
    return balances.value?.filter((b) => {
      return b.all.confirmed > 0;
    });
  });

  const confirmedContent = useMemo(() => {
    // Show error state if balance fetch failed
    if (unspentStatus.value === FetchStatus.Error) {
      return (
        <Empty>
          <EmptyTitle>Failed to load balances</EmptyTitle>
          <EmptyDescription>Unable to fetch balance data. Please check your connection and try again.</EmptyDescription>
          <EmptyContent>
            <button
              type="button"
              onClick={() => {
                unspentStatus.value = FetchStatus.Idle;
                bsv20s.value = null;
              }}
              className="btn btn-sm btn-primary"
            >
              Retry
            </button>
          </EmptyContent>
        </Empty>
      );
    }

    // Show loading state
    if (unspentStatus.value === FetchStatus.Loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      );
    }

    // Show empty state if no balances
    if (!confirmedBalances?.value || confirmedBalances.value.length === 0) {
      return (
        <Empty>
          <EmptyTitle>No confirmed balances</EmptyTitle>
          <EmptyDescription>You don&apos;t have any confirmed token balances yet.</EmptyDescription>
        </Empty>
      );
    }

    return (
      <div className="bg-[#101010] rounded-lg w-full mb-4 px-2">
        {confirmedBalances.value.map(
          ({ tick, all, sym, id, dec, listed, icon, price }, idx) => {
            // TODO: Get actual coin supply (hopefully return this on the balances endpoint?)
            const deets = find(tickerDetails.value, (t) => t.tick === tick);
            const supply = deets?.supply || deets?.amt;
            const balance = (all.confirmed - listed.confirmed) / 10 ** dec;

            // get number of decimals
            const numDecimals = balance.toString().split(".")[1]?.length || 0;

            const balanceText = getBalanceText(balance, numDecimals) || "0";
            const tooltip =
              balance.toString() !== balanceText.trim()
                ? balance.toLocaleString()
                : "";

            const showAirdropIcon =
              (!addressProp || addressProp === ordAddress.value) &&
              all.confirmed / 10 ** dec > 100;

            const tokenPrice = price
              ? `$${((price * balance) / usdRate.value).toFixed(2)}`
              : "";
            return (
              <React.Fragment key={`bal-confirmed-${tick}`}>
                <div className="grid grid-cols-2 gap-3 auto-cols-auto items-center max-w-md p-2">
                  <div className="flex items-center">
                    {WalletTab.BSV21 === type && (
                      <IconWithFallback
                        icon={icon || null}
                        alt={sym || ""}
                        className="w-12 h-12 mr-2"
                      />
                    )}
                    <div>
                      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                      <div
                        className="cursor-pointer hover:text-blue-400 transition text-xl"
                        onClick={() =>
                          router.push(
                            `/market/${id ? `bsv21/${id}` : `bsv20/${tick}`}`,
                          )
                        }
                      >
                        {tick || sym}
                      </div>
                      <div className="text-[#555]">
                        {type === WalletTab.BSV20 && (
                          <FaHashtag className="w-4 h-4 mr-1 inline-block" />
                        )}
                        {deets?.num || truncate(id) || ""}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-emerald-400 font-mono tooltip tooltip-bottom"
                      data-tip={tooltip || null}
                    >
                      <span className="text-[#555] mr-2">{tokenPrice}</span>{" "}
                      {balanceText}
                    </div>
                    <div className="flex justify-end mt-2">
                      {showAirdropIcon && (
                        <div
                          className={`text-right ${showAirdropIcon ? "mr-2" : ""
                            }`}
                        >
                          <button
                            type="button"
                            className="btn btn-xs w-fit hover:border hover:border-yellow-200/25 tooltip tooltip-bottom"
                            data-tip={`Airdrop ${sym || tick}`}
                            onClick={() => {
                              setShowAirdrop(tick || id);
                            }}
                          >
                            <FaParachuteBox className="w-3" />
                          </button>
                          {showAirdrop === (tick || id) && (
                            <AirdropTokensModal
                              onClose={() => {
                                setShowAirdrop(undefined);
                              }}
                              type={id ? AssetType.BSV21 : AssetType.BSV20}
                              dec={dec}
                              id={(tick || id)!}
                              sym={sym}
                              open={
                                (!!tick && showAirdrop === tick) ||
                                (!!id && showAirdrop === id)
                              }
                              balance={
                                (all.confirmed - listed.confirmed) / 10 ** dec
                              }
                            />
                          )}
                        </div>
                      )}
                      <div className="text-right mr-2">
                        <button
                          type="button"
                          className="btn btn-xs w-fit hover:border hover:border-yellow-200/25 tooltip tooltip-bottom"
                          data-tip={`Burn ${sym || tick}`}
                          onClick={() => {
                            setShowBurnModal(tick || id);
                          }}
                        >
                          <FaFireFlameCurved className="w-3" />
                        </button>
                      </div>
                      <div className={"text-right"}>
                        {(!addressProp || addressProp === ordAddress.value) &&
                          all.confirmed / 10 ** dec > 0 ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-xs w-fit hover:border hover:border-yellow-200/25 tooltip tooltip-bottom"
                              data-tip={`Send ${sym || tick}`}
                              onClick={() => {
                                setShowSendModal(tick || id);
                              }}
                            >
                              <IoSend className="w-3" />
                            </button>
                            {(showSendModal === (tick || id) ||
                              showBurnModal === (tick || id)) && (
                                <TransferBsv20Modal
                                  onClose={() => {
                                    setShowBurnModal(undefined);
                                    setShowSendModal(undefined);
                                  }}
                                  type={type}
                                  id={(tick || id)!}
                                  dec={dec}
                                  balance={balance}
                                  burn={showBurnModal === (tick || id)}
                                  sym={sym}
                                />
                              )}
                          </>
                        ) : (
                          <></>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="divider my-0" />
              </React.Fragment>
            );
          },
        )}
      </div>
    );
  }, [confirmedBalances.value, tickerDetails.value, unspentStatus.value]);

  const pendingContent = useMemo(() => {
    // Show error state if balance fetch failed
    if (unspentStatus.value === FetchStatus.Error) {
      return (
        <Empty>
          <EmptyTitle>Failed to load balances</EmptyTitle>
          <EmptyDescription>Unable to fetch balance data. Please check your connection and try again.</EmptyDescription>
          <EmptyContent>
            <button
              type="button"
              onClick={() => {
                unspentStatus.value = FetchStatus.Idle;
                bsv20s.value = null;
              }}
              className="btn btn-sm btn-primary"
            >
              Retry
            </button>
          </EmptyContent>
        </Empty>
      );
    }

    // Show empty state if no pending balances
    if (!pendingBalances?.value || pendingBalances.value.length === 0) {
      return (
        <Empty>
          <EmptyTitle>No pending balances</EmptyTitle>
          <EmptyDescription>You don&apos;t have any pending token balances.</EmptyDescription>
        </Empty>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-3 bg-[#222] p-4 rounded mb-4">
        <div className="text-[#777] font-semibold">Ticker</div>
        <div className="text-[#777] font-semibold">Balance</div>
        {pendingBalances.value.map(({ tick, all, sym, id, dec }, idx) => (
          <React.Fragment key={`bal-pending-${tick}`}>
            <div
              className="cursor-pointer hover:text-blue-400 transition"
              onClick={() =>
                router.push(`/market/${id ? "bsv21/" + id : "bsv20/" + tick}`)
              }
            >
              {tick || sym}
            </div>
            <div className="text-emerald-400">{all.pending / 10 ** dec}</div>
          </React.Fragment>
        ))}
      </div>
    );
  }, [pendingBalances.value, balances.value, tickerDetails.value, unspentStatus.value]);

  const listedContent = computed(() => {
    return (
      <div className="grid grid-cols-2 gap-3 bg-[#222] p-4 rounded mb-4">
        <div className="text-[#777] font-semibold">Ticker</div>
        <div className="text-[#777] font-semibold">Balance</div>
        {listingBalances?.value?.map(
          ({ tick, all, sym, id, listed, dec }, idx) => (
            <React.Fragment key={`bal-listed-${tick}`}>
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
              <div
                className="cursor-pointer hover:text-blue-400 transition"
                onClick={() =>
                  router.push(`/market/${id ? `bsv21/${id}` : `bsv20/${tick}`}`)
                }
              >
                {tick || sym}
              </div>
              <div className="text-emerald-400">
                {getBalanceText(listed.confirmed / 10 ** dec, dec)}
              </div>
            </React.Fragment>
          ),
        )}
      </div>
    );
  });

  const unindexedContent = computed(() => {
    return (
      <div className="grid grid-cols-2 gap-3 bg-[#222] p-4 rounded mb-4">
        <div className="text-[#777] font-semibold">Ticker</div>
        <div className="text-[#777] font-semibold">Balance</div>
        {bsv20s && bsv20s.value?.length === 0 && (
          <div className="text-[#777] font-semibold">No unindexed tokens</div>
        )}
        {Object.entries(unindexBalances)
          .filter((t) => {
            // return type === AssetType.BSV20 ? tick : id;
            return true;
          })
          .map(([tick, amount], idx) => (
            <React.Fragment key={`bal-unindexed-${tick}`}>
              <Link
                href={`/market/${type}/${tick}`}
                className="cursor-pointer hover:text-blue-400 transition"
              >
                {tick}
              </Link>
              <div
                className="text-emerald-400 tooltip"
                data-tip={`[ ! ] This balance does not consider decimals.`}
              >
                {amount}
              </div>
            </React.Fragment>
          ))}
      </div>
    );
  });

  const contentTabs = computed(() => {
    return (
      <div className="mb-4 p-2 md:p-0">
        <div role="tablist" className="tabs md:tabs-lg tabs-bordered">
          <input
            type="radio"
            name="balanceTabs"
            role="tab"
            className="tab ml-1"
            aria-label="Confirmed"
            checked={balanceTab === BalanceTab.Confirmed}
            onChange={() => setBalanceTab(BalanceTab.Confirmed)}
          />
          <div
            role="tabpanel"
            className="tab-content bg-base-100 border-base-200 rounded-box border-0 mt-4"
          >
            {confirmedContent}
          </div>

          <input
            type="radio"
            name="balanceTabs"
            role="tab"
            className="tab"
            aria-label="Pending"
            checked={balanceTab === BalanceTab.Pending}
            onChange={() => setBalanceTab(BalanceTab.Pending)}
          />
          <div
            role="tabpanel"
            className="tab-content bg-base-100 border-base-200 rounded-box border-0 mt-4"
          >
            {pendingContent}
          </div>

          <input
            type="radio"
            name="balanceTabs"
            role="tab"
            className="tab"
            aria-label="Listed"
            checked={balanceTab === BalanceTab.Listed}
            onChange={() => setBalanceTab(BalanceTab.Listed)}
          />
          <div
            role="tabpanel"
            className="tab-content bg-base-100 border-base-200 rounded-box border-0 mt-4"
          >
            {listedContent.value}
          </div>

          {type === WalletTab.BSV20 && (
            <>
              <input
                type="radio"
                name="balanceTabs"
                role="tab"
                className="tab mr-1"
                aria-label="UTXO"
                checked={balanceTab === BalanceTab.Unindexed}
                onChange={() => setBalanceTab(BalanceTab.Unindexed)}
              />
              <div
                role="tabpanel"
                className="tab-content bg-base-100 border-base-200 rounded-box border-0 mt-4"
              >
                {unindexedContent}
              </div>
            </>
          )}
        </div>
      </div>
    );
  });

  const locked = computed(() => !ordAddress.value && !!encryptedBackup);

  return !addressProp && locked.value ? <SAFU /> : (
    <div className="overflow-x-auto max-w-screen">
      <div className={`${"mb-12"} mx-auto w-full max-w-5xl`}>
        <WalletTabs type={type} address={addressProp} />
        <div className="tab-content bg-base-100 border-base-200 rounded-box md:p-6 flex flex-col md:flex-row">
          <div className="mb-4">{contentTabs.value}</div>
          <div className="md:ml-6">
            <h1 className="mb-4 flex items-center justify-between">
              <div className={`text-2xl ${notoSerif.className}`}>
                {type.toUpperCase()} History
              </div>
              <div className="text-sm text-[#555]" />
            </h1>
            <div className="my-2 w-full text-sm bg-[#111]">
              <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] p-4 gap-x-4 gap-y-2 min-w-md sticky top-0 bg-[#111] z-10">
                <div className="font-semibold text-accent text-base">Height</div>
                <div className="font-semibold text-[#777] text-base">Ticker</div>
                <div className="font-semibold text-[#777] text-base">Op</div>
                <div className="font-semibold text-[#777] text-base">Amount</div>
                <div className="font-semibold text-[#777] text-base">Sale</div>
                <div className="" />
              </div>
              <div
                ref={parentRef}
                className="overflow-auto"
                style={{ height: "600px" }}
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const item = activityData[virtualRow.index];
                    return (
                      <div
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] p-4 gap-x-4 min-w-md"
                      >
                        {renderActivityRow(item)}
                      </div>
                    );
                  })}
                  <div
                    ref={ref}
                    style={{
                      position: "absolute",
                      top: `${rowVirtualizer.getTotalSize()}px`,
                      height: "1px",
                      width: "100%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bsv20List;

// export const getBsv20Utxos = async (ordUtxos: Signal<OrdUtxo[] | null>) => {
//   bsv20Utxos.value = [];
//   const { promise } = http.customFetch<OrdUtxo[]>(
//     `${API_HOST}/api/txos/address/${ordAddress.value}/unspent?limit=${resultsPerPage}&offset=0&dir=DESC&status=all&bsv20=true`
//   );
//   const u = await promise;
//   bsv20Utxos.value = u;
// };
