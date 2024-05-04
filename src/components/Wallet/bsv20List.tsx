"use client";

import { API_HOST, AssetType, FetchStatus, MINI_API_HOST, resultsPerPage } from "@/constants";
import { bsv20Balances } from "@/signals/wallet";
import { ordAddress } from "@/signals/wallet/address";
import type { BSV20, BSV20Balance } from "@/types/bsv20";
import type { BSV20TXO, OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { getBalanceText } from "@/utils/wallet";
import { computed, effect, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useInView } from "framer-motion";
import { find, uniq } from "lodash";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef } from "react";
import { IoSend } from "react-icons/io5";

import { useLocalStorage } from "@/utils/storage";
import { Noto_Serif } from "next/font/google";
import { FaChevronRight, FaHashtag, FaParachuteBox } from "react-icons/fa6";
import { toBitcoin } from "satoshi-bitcoin-ts";
import AirdropTokensModal from "../modal/airdrop";
import TransferBsv20Modal from "../modal/transferBsv20";
import { IconWithFallback } from "../pages/TokenMarket/heading";
import type { MarketData } from "../pages/TokenMarket/list";
import { truncate } from "../transaction";
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
    "encryptedBackup"
  );
  console.log({ ordAddress: ordAddress.value, addressProp, encryptedBackup });

  const ref = useRef(null);
  const isInView = useInView(ref);
  const newOffset = useSignal(0);
  const reachedEndOfListings = useSignal(false);
  const balanceTab = useSignal(BalanceTab.Confirmed);
  const router = useRouter();
  const holdings = useSignal<BSV20TXO[] | null>(null);
  const addressBalances = useSignal<BSV20Balance[] | null>(null);
  const showAirdrop = useSignal<string | undefined>(undefined);

  const showSendModal = useSignal<string | undefined>(undefined);

  // get unspent ordAddress
  const bsv20s = useSignal<OrdUtxo[] | null>(null);
  const tickerDetails = useSignal<MarketData[] | null>(null);
  const history = useSignal<OrdUtxo[] | null>(null);
  const fetchHistoryStatus = useSignal<FetchStatus>(FetchStatus.Idle);
  const unspentStatus = useSignal<FetchStatus>(FetchStatus.Idle);

  effect(() => {
    const fire = async () => {
      const url = "https://1sat-api-production.up.railway.app/ticker/num";
      const unindexed =
        bsv20s.value?.map(
          (u) => u.origin?.data?.bsv20?.tick as string
        ) || [];
      const fromBalances =
        bsv20Balances.value?.map((b) => b.tick as string) || [];
      const finalArray = (unindexed.concat(fromBalances) || []).filter(
        (id) => !!id
      );
      console.log({ finalArray });
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

      console.log("POST TEST", { results });
      tickerDetails.value = results;
    };

    if (bsv20s.value !== null && tickerDetails.value === null) {
      fire();
    }
  });

  effect(async () => {
    // fetch token history
    const address = addressProp || ordAddress.value;
    if (fetchHistoryStatus.value === FetchStatus.Idle && address) {
      try {
        fetchHistoryStatus.value = FetchStatus.Loading;
        const historyUrl = `${API_HOST}/api/txos/address/${address}/history?limit=100&offset=0&bsv20=true&origins=true`;
        const { promise } = http.customFetch<OrdUtxo[]>(historyUrl, {
          method: "POST",
        });
        history.value = await promise;
        fetchHistoryStatus.value = FetchStatus.Success;
      } catch (error) {
        fetchHistoryStatus.value = FetchStatus.Error;
        console.error("Error fetching token history", error);
      }
    }
  })

  effect(() => {
    const address = addressProp || ordAddress.value;
    // get unindexed tickers
    const fire = async () => {
      unspentStatus.value = FetchStatus.Loading;
      bsv20s.value = [];
      try {

        const { promise } = http.customFetch<OrdUtxo[]>(
          `${API_HOST}/api/txos/address/${address}/unspent?limit=1000&offset=0&dir=ASC&status=all&bsv20=true`
        );
        const u = await promise;

        // filter out tickers that already exist in holdings, and group by ticker
        const tickerList = u.map((u) => u.data?.bsv20?.tick);
        console.log({ tickerList });
        bsv20s.value = u.filter((u) =>
          holdings.value?.every((h) => h.tick !== u.data?.bsv20?.tick)
        );
        console.log({ u });
        bsv20s.value = u;

        if (address !== ordAddress.value) {
          // not viewing own address
          // fetch balances
          const { promise: promiseBalances } = http.customFetch<
            BSV20Balance[]
          >(`${MINI_API_HOST}/${address}/balance`);
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
      };
    };
    if (!bsv20s.value && address && unspentStatus.value === FetchStatus.Idle) {
      fire();
    }
  });

  const unindexBalances = computed(
    () =>
      bsv20s.value?.reduce((acc, utxo) => {
        if (utxo.data?.bsv20?.tick) {
          if (acc[utxo.data.bsv20.tick]) {
            acc[utxo.data.bsv20.tick] += Number.parseInt(
              utxo.data.bsv20.amt
            );
          } else {
            acc[utxo.data.bsv20.tick] = Number.parseInt(
              utxo.data.bsv20.amt
            );
          }
        }
        return acc;
      }, {} as { [key: string]: number }) || {}
  );

  useEffect(() => {
    const address = addressProp || ordAddress.value;
    const fire = async () => {
      if (type === WalletTab.BSV20) {
        const urlTokens = `${API_HOST}/api/bsv20/${address}/unspent?limit=${resultsPerPage}&offset=${newOffset.value}&dir=desc&type=v1`;
        console.log("Fetching", urlTokens);
        const { promise: promiseBsv20 } =
          http.customFetch<BSV20TXO[]>(urlTokens);
        const newResults = await promiseBsv20;
        if (newResults.length > 0) {
          holdings.value = (holdings.value || []).concat(newResults);
          console.log("newLength", holdings.value.length);
        } else {
          reachedEndOfListings.value = true;
        }
      } else {
        const urlV2Tokens = `${API_HOST}/api/bsv20/${address}/unspent?limit=${resultsPerPage}&offset=${newOffset.value}&dir=desc&type=v2`;
        const { promise: promiseBsv21 } =
          http.customFetch<BSV20TXO[]>(urlV2Tokens);
        const newResults = await promiseBsv21;
        if (newResults.length > 0) {
          holdings.value = (holdings.value || []).concat(newResults);
          console.log("newLength", holdings.value.length);
        } else {
          reachedEndOfListings.value = true;
        }
      }
      newOffset.value += resultsPerPage;
    };
    if (address && isInView && !reachedEndOfListings.value) {
      fire();
    }
  }, [
    addressProp,
    holdings,
    isInView,
    newOffset,
    reachedEndOfListings,
    type,
  ]);

  const balances = computed(() => {
    return (
      addressProp ? addressBalances.value : bsv20Balances.value
    )?.filter((b) => (type === WalletTab.BSV20 ? !!b.tick : !b.tick));
  });

  const getDec = useCallback((tick?: string, id?: string) => {
    const deets = find(
      balances.value,
      (t) => type === WalletTab.BSV20 ? t.tick === tick : t.id === id
    );
    return deets?.dec || 0;
  }, [balances.value, type]);

  const getSym = useCallback((bsv20?: BSV20) => {
    return find(balances.value, (t) => t.id === bsv20?.id)?.sym;
  }, [balances.value]);

  const activity = computed(() => {

    return history.value
      ?.filter((b) => (type === WalletTab.BSV20 ? !!b.data?.bsv20?.tick : !b.data?.bsv20?.tick))
      ?.map((bsv20, index) => {
        const decimals = getDec(bsv20.data?.bsv20?.tick, bsv20.data?.bsv20?.id)
        const amount = getBalanceText(Number.parseInt(bsv20.data?.bsv20?.amt || "0") / 10 ** decimals, decimals)

        return (
          <React.Fragment key={`act-${bsv20.data?.bsv20?.tick}-${index}`}>
            <div className="text-xs text-info">
              <Link
                href={`https://whatsonchain.com/tx/${bsv20.txid}`}
                target="_blank"
              >
                {bsv20.height}
              </Link>
            </div>
            <div
              className="flex items-center cursor-pointer hover:text-blue-400 transition"
              onClick={() =>
                router.push(
                  `/market/${bsv20.data?.bsv20?.tick
                    ? `bsv20/${bsv20.data?.bsv20?.tick}`
                    : `bsv21/${bsv20.data?.bsv20?.id}`
                  }`
                )
              }
            >
              {bsv20.data?.bsv20?.tick || getSym(bsv20.data?.bsv20) || bsv20.data?.bsv20?.id?.slice(-8) || bsv20.data?.bsv20?.id?.slice(-8)}
            </div>
            <div>{bsv20.data?.bsv20?.op}</div>
            <div className="text-xs">{bsv20.data?.bsv20 && amount}</div>
            <div className={`text-xs ${bsv20.data?.list?.price ? bsv20.owner === ordAddress.value ? "text-emerald-500" : "text-red-400" : "text-gray-500"}`}>{bsv20.data?.list?.price ? `${toBitcoin(bsv20.data?.list?.price)} BSV` : "-"}</div>
            <div>
              <Link
                href={`/outpoint/${bsv20.txid}_${bsv20.vout}/token`}
              >
                <FaChevronRight />
              </Link>
            </div>
          </React.Fragment>
        )
      });
  });

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

  const confirmedContent = computed(() => {
    return (
      <div className="bg-[#101010] rounded-lg w-full mb-4 px-2">
        {confirmedBalances?.value?.map(
          ({ tick, all, sym, id, dec, listed, icon, price }, idx) => {
            // TODO: Get actual coin supply (hopefully return this on the balances endpoint?)
            const deets = find(
              tickerDetails.value,
              (t) => t.tick === tick
            );
            const supply = deets?.supply || deets?.amt;
            const balance =
              (all.confirmed - listed.confirmed) / 10 ** dec;

            // get number of decimals
            const numDecimals =
              balance.toString().split(".")[1]?.length || 0;

            const balanceText =
              getBalanceText(balance, numDecimals) || "0";
            const tooltip =
              balance.toString() !== balanceText.trim()
                ? balance.toLocaleString()
                : "";

            const showAirdropIcon =
              (!addressProp ||
                addressProp === ordAddress.value) &&
              all.confirmed / 10 ** dec > 10000;

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
                      <div
                        className="cursor-pointer hover:text-blue-400 transition text-xl"
                        onClick={() =>
                          router.push(
                            `/market/${id
                              ? "bsv21/" + id
                              : "bsv20/" +
                              tick
                            }`
                          )
                        }
                      >
                        {tick || sym}
                      </div>
                      <div className="text-[#555]">
                        {type === WalletTab.BSV20 && (
                          <FaHashtag className="w-4 h-4 mr-1 inline-block" />
                        )}
                        {deets?.num ||
                          truncate(id) ||
                          ""} {price}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-emerald-400 font-mono tooltip tooltip-bottom"
                      data-tip={tooltip || null}
                    >
                      {balanceText}
                    </div>
                    <div className="flex justify-end mt-2">
                      {showAirdropIcon && (
                        <div
                          className={`text-right ${showAirdropIcon
                            ? "mr-2"
                            : ""
                            }`}
                        >
                          <button
                            type="button"
                            className="btn btn-xs w-fit hover:border hover:border-yellow-200/25 tooltip tooltip-bottom"
                            data-tip={`Airdrop ${sym || tick
                              }`}
                            onClick={() => {
                              showAirdrop.value =
                                tick || id;
                            }}
                          >
                            <FaParachuteBox className="w-3" />
                          </button>
                          {
                            <AirdropTokensModal
                              onClose={() => {
                                showAirdrop.value =
                                  undefined;
                              }}
                              type={
                                id
                                  ? AssetType.BSV21
                                  : AssetType.BSV20
                              }
                              dec={dec}
                              id={(tick || id)!}
                              sym={sym}
                              open={
                                (!!tick &&
                                  showAirdrop.value ===
                                  tick) ||
                                (!!id &&
                                  showAirdrop.value ===
                                  id)
                              }
                              balance={
                                (all.confirmed - listed.confirmed) / 10 ** dec
                              }
                            />
                          }
                        </div>
                      )}
                      <div className={`text-right `}>
                        {(!addressProp ||
                          addressProp ===
                          ordAddress.value) &&
                          all.confirmed / 10 ** dec >
                          0 ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-xs w-fit hover:border hover:border-yellow-200/25 tooltip tooltip-bottom"
                              data-tip={`Send ${sym || tick
                                }`}
                              onClick={() => {
                                showSendModal.value =
                                  tick || id;
                              }}
                            >
                              <IoSend className="w-3" />
                            </button>
                            {showSendModal.value ===
                              (tick || id) && (
                                <TransferBsv20Modal
                                  onClose={() =>
                                  (showSendModal.value =
                                    undefined)
                                  }
                                  type={type}
                                  id={
                                    (tick ||
                                      id)!
                                  }
                                  dec={dec}
                                  balance={
                                    balance
                                  }
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
          }
        )}
      </div>
    );
  });

  const pendingContent = computed(() => {
    return (
      <div className="grid grid-cols-2 gap-3 bg-[#222] p-4 rounded mb-4">
        <div className="text-[#777] font-semibold">Ticker</div>
        <div className="text-[#777] font-semibold">Balance</div>
        {pendingBalances?.value?.map(
          ({ tick, all, sym, id, dec }, idx) => (
            <React.Fragment key={`bal-pending-${tick}`}>
              <div
                className="cursor-pointer hover:text-blue-400 transition"
                onClick={() =>
                  router.push(
                    `/market/${id ? "bsv21/" + id : "bsv20/" + tick
                    }`
                  )
                }
              >
                {tick || sym}
              </div>
              <div className="text-emerald-400">
                {all.pending / 10 ** dec}
              </div>
            </React.Fragment>
          )
        )}
      </div>
    );
  });

  const listedContent = computed(() => {
    return (
      <div className="grid grid-cols-2 gap-3 bg-[#222] p-4 rounded mb-4">
        <div className="text-[#777] font-semibold">Ticker</div>
        <div className="text-[#777] font-semibold">Balance</div>
        {listingBalances?.value?.map(
          ({ tick, all, sym, id, listed, dec }, idx) => (
            <React.Fragment key={`bal-listed-${tick}`}>
              <div
                className="cursor-pointer hover:text-blue-400 transition"
                onClick={() =>
                  router.push(
                    `/market/${id ? "bsv21/" + id : "bsv20/" + tick
                    }`
                  )
                }
              >
                {tick || sym}
              </div>
              <div className="text-emerald-400">
                {listed.confirmed / 10 ** dec}
              </div>
            </React.Fragment>
          )
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
          <div className="text-[#777] font-semibold">
            No unindexed tokens
          </div>
        )}
        {Object.entries(unindexBalances.value)
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
            checked={balanceTab.value === BalanceTab.Confirmed}
            onChange={() =>
              (balanceTab.value = BalanceTab.Confirmed)
            }
          />
          <div
            role="tabpanel"
            className="tab-content bg-base-100 border-base-200 rounded-box border-0 mt-4"
          >
            {confirmedContent.value}
          </div>

          <input
            type="radio"
            name="balanceTabs"
            role="tab"
            className="tab"
            aria-label="Pending"
            checked={balanceTab.value === BalanceTab.Pending}
            onChange={() => (balanceTab.value = BalanceTab.Pending)}
          />
          <div
            role="tabpanel"
            className="tab-content bg-base-100 border-base-200 rounded-box border-0 mt-4"
          >
            {pendingContent.value}
          </div>

          <input
            type="radio"
            name="balanceTabs"
            role="tab"
            className="tab"
            aria-label="Listed"
            checked={balanceTab.value === BalanceTab.Listed}
            onChange={() => (balanceTab.value = BalanceTab.Listed)}
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
                aria-label="Unindexed"
                checked={
                  balanceTab.value === BalanceTab.Unindexed
                }
                onChange={() =>
                  (balanceTab.value = BalanceTab.Unindexed)
                }
              />
              <div
                role="tabpanel"
                className="tab-content bg-base-100 border-base-200 rounded-box border-0 mt-4"
              >
                {unindexedContent.value}
              </div>
            </>
          )}
        </div>
      </div>
    );
  });

  const locked = computed(() => !ordAddress.value && !!encryptedBackup);

  if (locked.value) {
    return <SAFU />;
  }

  return (
    <div className="overflow-x-auto max-w-screen">
      <div className={`${"mb-12"} mx-auto w-full max-w-5xl`}>
        <WalletTabs type={type} address={addressProp} />
        <div className="tab-content bg-base-100 border-base-200 rounded-box md:p-6 flex flex-col md:flex-row">
          <div className="mb-4">{contentTabs.value}</div>
          <div className="md:mx-6">
            <h1 className="mb-4 flex items-center justify-between">
              <div className={`text-2xl ${notoSerif.className}`}>
                {type.toUpperCase()} History
              </div>
              <div className="text-sm text-[#555]" />
            </h1>
            <div className="my-2 w-full text-sm grid grid-cols-6 p-4 gap-x-4 gap-y-2 min-w-md bg-[#111]">
              <div className="font-semibold text-accent text-base">
                Height
              </div>
              <div className="font-semibold text-[#777] text-base">
                Ticker
              </div>
              <div className="font-semibold text-[#777] text-base">
                Op
              </div>
              <div className="font-semibold text-[#777] text-base">
                Amount
              </div>
              <div className="font-semibold text-[#777] text-base">
                Sale
              </div>
              <div className="" />
              {activity}
              <div ref={ref} />
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
