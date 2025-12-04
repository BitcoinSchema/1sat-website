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
import {
  FaChevronRight,
  FaFireFlameCurved,
  FaHashtag,
  FaParachuteBox,
} from "react-icons/fa6";
import { toBitcoin } from "satoshi-token";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import AirdropTokensModal from "../modal/airdrop";
import TransferBsv20Modal from "../modal/transferBsv20";
import { IconWithFallback } from "../pages/TokenMarket/heading";
import type { MarketData } from "../pages/TokenMarket/list";
import { truncate } from "../transaction/display";
import SAFU from "./safu";
import { WalletTab } from "./tabs";
import { BalanceFilter, selectedBalanceFilter } from "./WalletSidebar";

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

  const ref = useRef(null);
  const isInView = useInView(ref);
  const parentRef = useRef<HTMLDivElement>(null);
  const [newOffset, setNewOffset] = useState(0);
  const [reachedEndOfListings, setReachedEndOfListings] = useState(false);
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
    const fire = async () => {
      unspentStatus.value = FetchStatus.Loading;
      bsv20s.value = [];
      try {
        const { promise } = http.customFetch<BSV20TXO[]>(
          `${API_HOST}/api/bsv20/${address}/unspent?limit=1000&offset=0&type=${type === WalletTab.BSV20 ? "v1" : "v2"}`,
        );
        const u = await promise;
        bsv20s.value = u.filter((u) =>
          holdings.value?.every((h) => h.tick !== u.tick),
        );
        bsv20s.value = u;

        if (address !== ordAddress.value) {
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
    estimateSize: () => 40,
    overscan: 5,
  });

  const renderActivityRow = useCallback((bsv20: BSV20TXO) => {
    const decimals = getDec(bsv20.tick, bsv20.id);
    const amount = getBalanceText(
      Number.parseInt(bsv20.amt || "0") / 10 ** decimals,
      decimals,
    );

    return (
      <>
        <TableCell className="w-24 font-mono text-xs text-muted-foreground">
          <Link
            href={`https://whatsonchain.com/tx/${bsv20.txid}`}
            target="_blank"
            className="hover:text-primary transition-colors"
          >
            {bsv20.height}
          </Link>
        </TableCell>
        <TableCell className="font-mono text-sm font-medium">
          <div
            className="flex items-center cursor-pointer hover:text-primary transition-colors"
            onClick={() =>
              router.push(
                `/market/${bsv20.tick ? `bsv20/${bsv20.tick}` : `bsv21/${bsv20?.id}`}`,
              )
            }
          >
            {bsv20.tick ||
              getSym(bsv20.id) ||
              bsv20.id?.slice(-8) ||
              bsv20.id?.slice(-8)}
          </div>
        </TableCell>
        <TableCell className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {getAction(bsv20)}
          </Badge>
        </TableCell>
        <TableCell className="text-right font-mono text-sm text-foreground">
          {bsv20 && amount}
        </TableCell>
        <TableCell className="text-right font-mono text-xs">
          <span
            className={`${bsv20.price ? (bsv20.owner === ordAddress.value ? "text-primary" : "text-destructive") : "text-muted-foreground"}`}
          >
            {bsv20.price && bsv20.price !== "0"
              ? `${toBitcoin(bsv20.price)} BSV`
              : "-"}
          </span>
        </TableCell>
        <TableCell className="w-10">
          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
            <Link href={`/outpoint/${bsv20.txid}_${bsv20.vout}/token`}>
              <FaChevronRight className="w-3 h-3 text-muted-foreground" />
            </Link>
          </Button>
        </TableCell>
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

  // Get current balances based on sidebar filter
  const currentBalances = useMemo(() => {
    switch (selectedBalanceFilter.value) {
      case BalanceFilter.Confirmed:
        return confirmedBalances.value;
      case BalanceFilter.Pending:
        return pendingBalances.value;
      case BalanceFilter.Listed:
        return listingBalances.value;
      case BalanceFilter.Unindexed:
        return null; // handled separately
      default:
        return confirmedBalances.value;
    }
  }, [selectedBalanceFilter.value, confirmedBalances.value, pendingBalances.value, listingBalances.value]);

  const locked = computed(() => !ordAddress.value && !!encryptedBackup);

  if (!addressProp && locked.value) {
    return <SAFU />;
  }

  const isUnindexed = selectedBalanceFilter.value === BalanceFilter.Unindexed;
  const isLoading = unspentStatus.value === FetchStatus.Loading;
  const hasError = unspentStatus.value === FetchStatus.Error;

  return (
    <div className="flex flex-col w-full h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-border">
        <h1 className="font-mono text-sm uppercase tracking-widest text-foreground">
          {type.toUpperCase()}_BALANCES
        </h1>
        <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">
          {selectedBalanceFilter.value.toUpperCase()}
        </span>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {/* Error State */}
        {hasError && (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-border rounded-lg bg-card">
            <h3 className="font-mono text-lg font-bold text-destructive mb-2">Failed to load balances</h3>
            <p className="text-muted-foreground text-sm mb-4">Unable to fetch balance data. Please check your connection and try again.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                unspentStatus.value = FetchStatus.Idle;
                bsv20s.value = null;
              }}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Unindexed Balances */}
        {!isLoading && !hasError && isUnindexed && type === WalletTab.BSV20 && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Ticker</TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bsv20s && bsv20s.value?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                      No unindexed tokens found
                    </TableCell>
                  </TableRow>
                )}
                {Object.entries(unindexBalances).map(([tick, amount], idx) => (
                  <TableRow key={`bal-unindexed-${tick}`} className="border-border hover:bg-muted/50">
                    <TableCell>
                      <Link
                        href={`/market/${type}/${tick}`}
                        className="cursor-pointer hover:text-primary transition-colors font-mono font-medium"
                      >
                        {tick}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="font-mono text-primary">
                              {amount}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>[ ! ] This balance does not consider decimals.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Regular Balances (Confirmed/Pending/Listed) */}
        {!isLoading && !hasError && !isUnindexed && (
          <>
            {/* Empty State */}
            {(!currentBalances || currentBalances.length === 0) ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border rounded-lg">
                <h3 className="font-mono text-lg font-bold text-muted-foreground mb-2">
                  No {selectedBalanceFilter.value} balances
                </h3>
                <p className="text-muted-foreground text-sm">
                  You don&apos;t have any {selectedBalanceFilter.value} token balances.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                {currentBalances.map(
                  ({ tick, all, sym, id, dec, listed, icon, price }, idx) => {
                    const deets = find(tickerDetails.value, (t) => t.tick === tick);
                    const balance = selectedBalanceFilter.value === BalanceFilter.Listed
                      ? listed.confirmed / 10 ** dec
                      : selectedBalanceFilter.value === BalanceFilter.Pending
                        ? all.pending / 10 ** dec
                        : (all.confirmed - listed.confirmed) / 10 ** dec;

                    const numDecimals = balance.toString().split(".")[1]?.length || 0;
                    const balanceText = getBalanceText(balance, numDecimals) || "0";
                    const tooltip =
                      balance.toString() !== balanceText.trim()
                        ? balance.toLocaleString()
                        : "";

                    const showAirdropIcon =
                      selectedBalanceFilter.value === BalanceFilter.Confirmed &&
                      (!addressProp || addressProp === ordAddress.value) &&
                      all.confirmed / 10 ** dec > 100;

                    const tokenPrice = price
                      ? `$${((price * balance) / usdRate.value).toFixed(2)}`
                      : "";

                    return (
                      <Card key={`bal-${selectedBalanceFilter.value}-${tick || id}`} className="border-border bg-card">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {WalletTab.BSV21 === type && (
                                <div className="w-10 h-10 rounded-full overflow-hidden bg-muted">
                                  <IconWithFallback
                                    icon={icon || null}
                                    alt={sym || ""}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div>
                                <div
                                  className="font-mono text-lg font-bold hover:text-primary cursor-pointer transition-colors"
                                  onClick={() =>
                                    router.push(
                                      `/market/${id ? `bsv21/${id}` : `bsv20/${tick}`}`,
                                    )
                                  }
                                >
                                  {tick || sym}
                                </div>
                                <div className="flex items-center text-xs text-muted-foreground font-mono">
                                  {type === WalletTab.BSV20 && (
                                    <FaHashtag className="w-3 h-3 mr-1" />
                                  )}
                                  {deets?.num || truncate(id) || ""}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-mono text-muted-foreground">{tokenPrice}</div>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="text-lg font-mono text-primary font-medium">
                                      {balanceText}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{tooltip}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>

                          {selectedBalanceFilter.value === BalanceFilter.Confirmed && (
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
                              {showAirdropIcon && (
                                <>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => setShowAirdrop(tick || id)}
                                        >
                                          <FaParachuteBox className="w-3 h-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Airdrop {sym || tick}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  {showAirdrop === (tick || id) && (
                                    <AirdropTokensModal
                                      onClose={() => setShowAirdrop(undefined)}
                                      type={id ? AssetType.BSV21 : AssetType.BSV20}
                                      dec={dec}
                                      id={(tick || id)!}
                                      sym={sym}
                                      open={true}
                                      balance={(all.confirmed - listed.confirmed) / 10 ** dec}
                                    />
                                  )}
                                </>
                              )}

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setShowBurnModal(tick || id)}
                                    >
                                      <FaFireFlameCurved className="w-3 h-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Burn {sym || tick}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              {(!addressProp || addressProp === ordAddress.value) && all.confirmed / 10 ** dec > 0 && (
                                <>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="icon"
                                          className="h-8 w-8"
                                          onClick={() => setShowSendModal(tick || id)}
                                        >
                                          <IoSend className="w-3 h-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Send {sym || tick}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  {(showSendModal === (tick || id) || showBurnModal === (tick || id)) && (
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
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  },
                )}
              </div>
            )}
          </>
        )}

        {/* History Section */}
        <div className="mt-8">
          <h2 className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-4">
            {type.toUpperCase()} HISTORY
          </h2>
          <div className="w-full border border-border rounded-lg bg-card overflow-hidden">
            <div
              ref={parentRef}
              className="overflow-auto"
              style={{ height: "400px", minHeight: "300px" }}
            >
              <Table>
                <TableHeader className="sticky top-0 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/60 z-10">
                  <TableRow className="hover:bg-transparent border-border">
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground w-24">Height</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Ticker</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Op</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground text-right">Amount</TableHead>
                    <TableHead className="font-mono text-xs uppercase tracking-wider text-muted-foreground text-right">Value</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const item = activityData[virtualRow.index];
                    return (
                      <TableRow
                        key={virtualRow.key}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        className="border-border hover:bg-muted/50 absolute w-full flex items-center"
                        style={{
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        {renderActivityRow(item)}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bsv20List;
