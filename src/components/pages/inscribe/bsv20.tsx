"use client";

import { API_HOST, FetchStatus, feeRate, toastErrorProps } from "@/constants";
import {
  bsv20Balances,
  chainInfo,
  indexers,
  payPk,
  usdRate,
  utxos,
} from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { BSV20, Ticker } from "@/types/bsv20";
import type { PendingTransaction } from "@/types/preview";
import { getUtxos } from "@/utils/address";
import { calculateIndexingFee } from "@/utils/bsv20";
import { inscribeUtf8 } from "@/utils/inscribe";
import { useIDBStorage } from "@/utils/storage";
import { computed } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import "buffer";
import type {
  Payment,
  Utxo,
} from "js-1sat-ord";
import { debounce, head } from "lodash";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast, { ErrorIcon } from "react-hot-toast";
import {
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";
import { RiMagicFill, RiSettings2Fill } from "react-icons/ri";
import { useLocalStorage } from "usehooks-ts";
import type { InscriptionTab } from "./tabs";

enum ActionType {
  Mint = "mint",
  Deploy = "deploy",
}
interface InscribeBsv20Props {
  inscribedCallback: () => void;
}

const InscribeBsv20: React.FC<InscribeBsv20Props> = ({ inscribedCallback }) => {
  useSignals();
  const router = useRouter();
  const params = useSearchParams();
  // const { tab, tick, op } = params.query as { tab: string; tick: string; op: string };
  const tab = params.get("tab") as InscriptionTab;
  const tick = params.get("tick");
  const op = params.get("op");


  const [pendingTxs, setPendingTxs] = useIDBStorage<PendingTransaction[]>(
    "1sat-pts",
    [],
  );

  const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);
  const [selectedActionType, setSelectedActionType] = useState<ActionType>(
    ActionType.Mint
  );
  const [tickerAvailable, setTickerAvailable] = useState<boolean | undefined>(
    undefined
  );
  const [fetchTickerStatus, setFetchTickerStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [inscribeStatus, setInscribeStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [selectedBsv20, setSelectedBsv20] = useState<Ticker>();
  const [limit, setLimit] = useState<string | undefined>("1337");
  const [maxSupply, setMaxSupply] = useState<string>("21000000");
  const [decimals, setDecimals] = useState<number | undefined>();
  const [amount, setAmount] = useState<string>();
  const [mintError, setMintError] = useState<string>();
  const [showOptionalFields, setShowOptionalFields] =
    useState<boolean>(false);
  const [iterations, setIterations] = useState<number>(1);
  const [bulkEnabled, setBulkEnabled] = useLocalStorage("bulkEnabled", false);
  const [ticker, setTicker] = useState<string | null>(tick);

  useEffect(() => {
    if (op) {
      setSelectedActionType(op as ActionType);
    }
  }, [selectedActionType, op]);

  useEffect(() => {
    if (tick) {
      setTicker(tick);
    }
  }, [setTicker, tick]);

  const toggleOptionalFields = useCallback(() => {
    setShowOptionalFields(!showOptionalFields);
  }, [showOptionalFields]);

  const changeTicker = useCallback(
    (e: any) => {
      setAmount(undefined);
      setTicker(e.target.value);
      if (mintError) setMintError(undefined);
    },
    [setTicker, mintError, setAmount]
  );

  const checkTicker = useCallback(
    async (tick: string, expectExist: boolean, event?: any) => {
      if (!tick || tick.length === 0) {
        setTickerAvailable(false);
        return;
      }
      try {
        setFetchTickerStatus(FetchStatus.Loading);
        const resp = await fetch(`${API_HOST}/api/bsv20/tick/${tick}`);

        if (resp.status === 200) {
          if (!expectExist) {
            // prevent form from submitting
            event.preventDefault();
            setTickerAvailable(false);
          } else if (expectExist) {
            const bsv20 = (await resp.json()) as Ticker;

            console.log(
              "selected BSV20",
              { bsv20 },
              Number.parseInt(bsv20.supply!) <
              Number.parseInt(bsv20.max!)
            );
            setSelectedBsv20(bsv20);
            if (
              !!bsv20 &&
              bsv20.max !== undefined &&
              bsv20.supply !== undefined &&
              Number.parseInt(bsv20.supply) <
              Number.parseInt(bsv20.max) &&
              bsv20.pendingOps === 0
            ) {
              setTickerAvailable(true);
              setAmount(bsv20.lim);
            } else if (bsv20.pendingOps > 0) {
              setTickerAvailable(true);
              setAmount(bsv20.lim);
              setMintError("May be minted out");
            } else {
              setTickerAvailable(false);
              setMintError("Minted Out");
            }
          }
        } else if (resp.status === 404) {
          console.log(
            "ticker not found",
            tick,
            "expectExist",
            expectExist
          );
          if (expectExist) {
            setTickerAvailable(false);
            setSelectedBsv20(undefined);
          } else {
            setTickerAvailable(true);
          }
        }
        setFetchTickerStatus(FetchStatus.Success);
      } catch (e) {
        console.error({ e });
        setFetchTickerStatus(FetchStatus.Error);
      }
    },
    [setSelectedBsv20, setTickerAvailable, setFetchTickerStatus]
  );


  const changeSelectedActionType = useCallback(
    async (e: any) => {
      // console.log({ val: e.target.value });
      const actionType = e.target.value.toLowerCase() as ActionType;
      setSelectedActionType(actionType);
      if (ticker) {
        await checkTicker(ticker, actionType === ActionType.Mint);
      }
    },
    [setSelectedActionType, ticker, checkTicker]
  );

  const changeIterations: React.ChangeEventHandler<HTMLInputElement> =
    useCallback((e) => {
      // check the value is not more than the max
      if (
        Number.parseInt(e.target.value) > Number.parseInt(e.target.max)
      ) {
        toast.error(`Max iterations is ${e.target.max}`);
        return;
      }
      setIterations(Number.parseInt(e.target.value));
    }, []);

  const inSync = computed(() => {
    if (!indexers.value || !chainInfo.value) {
      return false;
    }
    return (
      indexers.value["bsv20-deploy"] >= chainInfo.value?.blocks &&
      indexers.value.bsv20 + 6 >= chainInfo.value?.blocks
    );
  });

  const tickerNote = useMemo(() => {
    return tickerAvailable === false
      ? selectedActionType === ActionType.Deploy
        ? ticker === ""
          ? "¯\\_(ツ)_/¯"
          : "Ticker Unavailable"
        : mintError
      : inSync.value
        ? selectedBsv20?.pendingOps && selectedBsv20?.pendingOps > 0
          ? `${selectedBsv20?.pendingOps} Pending Ops`
          : selectedBsv20?.pending
            ? `Pending Supply ${selectedBsv20.pending}`
            : "1-4 Characters"
        : selectedActionType === ActionType.Deploy
          ? "Syncing. May already be deployed."
          : "Syncing. May be minted out.";
  }, [
    tickerAvailable,
    selectedActionType,
    ticker,
    mintError,
    inSync.value,
    selectedBsv20,
  ]);

  const totalTokens = useMemo(() => {
    return iterations * Number.parseInt(amount || "0");
  }, [amount, iterations]);

  // Define the debounced function outside of the render method
  const debouncedCheckTicker = debounce(async (event, expectExist) => {
    await checkTicker(event.target.value, expectExist, event);
  }, 300); // This is a common debounce time. Adjust as needed.

  const changeLimit = useCallback(
    (e: any) => {
      setLimit(e.target.value);
    },
    [setLimit]
  );

  const changeDecimals = useCallback(
    (e: any) => {
      setDecimals(e.target.valuye ? Number.parseInt(e.target.value) : undefined);
    },
    [setDecimals]
  );

  const changeAmount = useCallback(
    (e: any) => {
      if (selectedActionType === ActionType.Mint && selectedBsv20?.lim) {
        if (Number.parseInt(e.target.value) <= Number.parseInt(selectedBsv20.lim)) {
          setAmount(e.target.value);
        }
        return;
      }
      // exclude 0
      if (Number.parseInt(e.target.value) !== 0) {
        setAmount(e.target.value);
      }
    },
    [selectedBsv20, selectedActionType, setAmount]
  );

  const inscribeBsv20 = useCallback(
    async (sortedUtxos: Utxo[]) => {
      if (!ticker || ticker?.length === 0) {
        return;
      }
      setInscribeStatus(FetchStatus.Loading);

      try {
        const inscription = {
          p: "bsv-20",
          op: selectedActionType,
        } as BSV20;

        switch (selectedActionType) {
          case ActionType.Deploy:
            if (
              Number.parseInt(maxSupply) === 0 ||
              BigInt(maxSupply) > maxMaxSupply
            ) {
              toast.error(
                `Invalid input: please enter a number less than or equal to ${maxMaxSupply - BigInt(1)
                }`,
                toastErrorProps
              );
              return;
            }

            inscription.tick = ticker;
            inscription.max = (BigInt(maxSupply) * 10n ** BigInt(decimals || 0)).toString();

            // optional fields
            if (decimals !== undefined) {
              inscription.dec = decimals;
            }
            if (limit) inscription.lim = limit;
            else if (
              !confirm(
                "Warning: Token will have no mint limit. This means all tokens can be minted at once. Are you sure this is what you want?"
              )
            ) {
              setInscribeStatus(FetchStatus.Idle);
              return;
            }

            break;
          case ActionType.Mint:
            if (
              !amount ||
              Number.parseInt(amount) === 0 ||
              BigInt(amount) > maxMaxSupply ||
              !selectedBsv20
            ) {
              toast.error(
                `Max supply must be a positive integer less than or equal to ${maxMaxSupply - BigInt(1)
                }`,
                toastErrorProps
              );
              return;
            }
            inscription.tick = selectedBsv20.tick;
            inscription.amt = amount;

          default:
            break;
        }

        const text = JSON.stringify(inscription);
        const address = selectedBsv20?.fundAddress;
        const payments: Payment[] = [];
        if (address) {
          payments.push({
            to: address,
            amount: iterationFee * iterations,
          });
        }
        const pendingTx = await inscribeUtf8(
          text,
          "application/bsv-20",
          sortedUtxos,
          iterations,
          selectedActionType === ActionType.Deploy
            ? ([] as Payment[])
            : payments
        );

        setPendingTxs([pendingTx]);
        setInscribeStatus(FetchStatus.Success);
        inscribedCallback();
      } catch (error) {
        setInscribeStatus(FetchStatus.Error);

        toast.error(`Failed to inscribe: ${error}`, toastErrorProps);
        return;
      }
    },
    [ticker, selectedActionType, selectedBsv20, iterations, setPendingTxs, inscribedCallback, maxSupply, decimals, limit, amount]
  );

  const bulkInscribe = useCallback(async () => {
    if (!payPk || !ordAddress || !fundingAddress.value) {
      return;
    }

    toast.success("Bulk inscribing...");

    // while (iterations > 0) {
    await getUtxos(fundingAddress.value);
    const sortedUtxos = utxos.value?.sort((a, b) =>
      a.satoshis > b.satoshis ? -1 : 1
    );
    if (!sortedUtxos) {
      console.log("no utxos");
      return;
    }
    // const u = head(sortedUtxos);
    // if (!u) {
    //   console.log("no utxos");
    //   return;
    // }

    await inscribeBsv20(sortedUtxos);
    // setIterations(iterations - 1);
    // sleep for a second
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // }
  }, [inscribeBsv20]);

  const clickInscribe = useCallback(async () => {
    if (!payPk.value || !ordAddress.value || !fundingAddress.value) {
      return;
    }

    const utxos = await getUtxos(fundingAddress.value);
    const sortedUtxos = utxos.sort((a, b) =>
      a.satoshis > b.satoshis ? -1 : 1
    );
    const u = head(sortedUtxos);
    if (!u) {
      console.log("no utxo");
      return;
    }

    return await inscribeBsv20([u]);
  }, [fundingAddress.value, inscribeBsv20, ordAddress.value, payPk.value]);

  // useEffect(() => {
  // 	console.log({
  // 		tickerAvailable,
  // 		len: ticker?.length,
  // 		inscribeStatus,
  // 		fetchTickerStatus,
  // 		limit,
  // 		maxSupply,
  // 	});
  // }, [
  // 	fetchTickerStatus,
  // 	inscribeStatus,
  // 	limit,
  // 	maxSupply,
  // 	ticker?.length,
  // 	tickerAvailable,
  // ]);

  const submitDisabled = useMemo(() => {
    return (
      !tickerAvailable ||
      !ticker?.length ||
      inscribeStatus === FetchStatus.Loading ||
      fetchTickerStatus === FetchStatus.Loading ||
      (!!limit && !!maxSupply && Number.parseInt(maxSupply) < Number.parseInt(limit))
    );
  }, [
    inscribeStatus,
    tickerAvailable,
    ticker?.length,
    fetchTickerStatus,
    limit,
    maxSupply,
  ]);

  const listingFee = useMemo(() => {
    if (!usdRate.value) {
      return minFee * usdRate.value;
    }
    return selectedBsv20
      ? calculateIndexingFee(usdRate.value)
      : calculateIndexingFee(usdRate.value);
  }, [selectedBsv20, usdRate.value]);

  const confirmedOplBalance = useMemo(
    () =>
      bsv20Balances.value?.find(
        (b) => b.tick?.toUpperCase() === bulkMintingTicker
      )?.all.confirmed,
    [bsv20Balances.value]
  );

  // maxIterations is based on the amount of confirmed OPL the user holds
  const maxIterations = useMemo(() => {
    if (!selectedBsv20 || !selectedBsv20.max || !selectedBsv20.available) {
      console.log("What", selectedBsv20);
      return 0;
    }
    if (!amount || amount === "0") {
      return 0;
    }
    if (bulkEnabled && !confirmedOplBalance) {
      toast.error(`You need ${bulkMintingTicker} to bulk mint ${ticker}`);
      return 0;
    }
    const displayOplBalance = confirmedOplBalance
      ? selectedBsv20.dec
        ? confirmedOplBalance / 10 ** selectedBsv20.dec
        : confirmedOplBalance
      : 0;

    let max = Number.parseInt(selectedBsv20.max || "0");
    if (selectedBsv20.available) {
      max =
        Number.parseInt(selectedBsv20.available) -
        Number.parseInt(selectedBsv20.pending || "0");
    }

    const organicMax = Math.ceil(max / Number.parseInt(amount));

    // console.log({ organicMax, displayOplBalance });

    return tierMax(displayOplBalance, organicMax);
  }, [selectedBsv20, bulkEnabled, confirmedOplBalance, amount, ticker]);

  const remainder = useMemo(() => maxIterations % 10, [maxIterations]);
  const step = useMemo(() => {
    if (!confirmedOplBalance) {
      return 1;
    }
    return (maxIterations - remainder) / 10;
  }, [maxIterations, confirmedOplBalance, remainder]);

  const spacers = useMemo(
    () => calculateSpacers(maxIterations, step),
    [maxIterations, step]
  );

  const newSupply = useMemo(() => {
    if (
      !totalTokens ||
      selectedBsv20?.supply === undefined ||
      selectedBsv20?.max === undefined ||
      selectedBsv20?.dec === undefined
    ) {
      return 0;
    }

    const supply = Number.parseInt(selectedBsv20.supply);
    const max = Number.parseInt(selectedBsv20.max);
    const newTokens = supply / 10 ** selectedBsv20.dec + totalTokens;
    if (newTokens > max) {
      return max;
    }
    const pending = selectedBsv20.pending
      ? Number.parseInt(selectedBsv20.pending)
      : 0;
    const pendingAdjusted = pending * 10 ** selectedBsv20.dec;
    return newTokens + pendingAdjusted;
  }, [selectedBsv20, totalTokens]);

  const iterationFeeUsd = useMemo(() => {
    if (!usdRate.value) {
      return 0;
    }
    return ((iterationFee * iterations) / usdRate.value).toFixed(2);
  }, [iterations, usdRate.value]);

  const networkFeeUsd = useMemo(() => {
    if (!usdRate.value) {
      return 0;
    }
    return (
      (bytesPerIteration * iterations * feeRate +
        P2PKH_FULL_INPUT_SIZE * 4) /
      usdRate.value
    ).toFixed(2);
  }, [iterations, usdRate.value]);

  // confirmedOplBalance && tierMaxNum(confirmedOplBalance) > 0

  const canEnableBulk = useMemo(
    () => (confirmedOplBalance ? confirmedOplBalance > 0 : false),
    [confirmedOplBalance]
  );

  const currentTier = useMemo(() => {
    if (!bsv20Balances.value) {
      return 0;
    }
    const balance = bsv20Balances.value?.find(
      (b) => b.tick?.toUpperCase() === bulkMintingTicker
    )?.all.confirmed;
    if (!balance) {
      return 0;
    }
    return tierMaxNum(balance);
  }, [bsv20Balances.value]);

  // return the icons depending on tier num
  const stars = useMemo(() => {
    return Array.from({ length: currentTier }, (_, index) => (
      <RiMagicFill key={`balance-star-${index + 1}`} />
    ));
  }, [currentTier]);

  const acquireText = useMemo(() => {
    // return Acquire{" "}
    // {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
    // {<span
    //   data-tip={`Tier ${currentTier}/5`}
    //   className="tooltip font-mono text-blue-400 hover:text-blue-500 cursor-pointer"
    //   onClick={() => {
    //     router.push(
    //       `/inscribe?tab=bsv20&tick=${bulkMintingTicker}&op=mint`,
    //     );
    //   }}
    // >
    //   {bulkMintingTicker}
    // </span>}{" "}
    // to enable bulk minting.

    return confirmedOplBalance && tierMaxNum(confirmedOplBalance) > 0
      ? `${confirmedOplBalance} ${bulkMintingTicker} available`
      : `Acquire ${bulkMintingTicker} to enable bulk minting`;
  }, [confirmedOplBalance]);

  return (
    <div className="w-full max-w-lg mx-auto">
      <select
        className="text-white w-full p-2 rounded my-2 cursor-pointer"
        value={selectedActionType}
        onChange={changeSelectedActionType}
      >
        <option value={ActionType.Deploy}>Deploy New Ticker</option>
        <option value={ActionType.Mint}>Mint Existing Ticker</option>
      </select>
      <div className="my-2">
        <label className="block mb-4">
          {/* TODO: Autofill */}
          <div className="flex items-center justify-between my-2">
            Ticker{" "}
            {chainInfo.value && indexers.value && (
              <span
                className="text-[#555] hover:text-warning text-sm tooltip transition"
                data-tip={`Latest block: ${chainInfo.value.blocks
                  } BSV20 Deploy: ${indexers.value["bsv20-deploy"]
                  } BSV20 Mint: ${indexers.value.bsv20} ${selectedBsv20 ? selectedBsv20.tick : ""
                  } Pending Ops: ${selectedBsv20?.pendingOps || "0"
                  }`}
              >
                {tickerNote}
              </span>
            )}
          </div>
          <div className="relative">
            <input
              className="text-white w-full rounded p-2 uppercase"
              maxLength={4}
              pattern="^\S+$"
              onKeyDown={(event) => {
                if (
                  event.key === " " ||
                  event.key === "Enter"
                ) {
                  event.preventDefault();
                  return;
                }
              }}
              value={ticker || ""}
              onChange={(event) => {
                changeTicker(event);
                debouncedCheckTicker(
                  event,
                  selectedActionType === ActionType.Mint
                );
              }}
            />

            {tickerAvailable === true && !inSync.value && (
              <div className="absolute right-0 bottom-0 mb-2 mr-2">
                <FaExclamationTriangle className="w-5 h-5 text-warning" />
              </div>
            )}

            {tickerAvailable === true && inSync.value && (
              <div className="absolute right-0 bottom-0 mb-2 mr-2">
                {selectedBsv20?.included ? (
                  <FaCheckCircle className="w-5 h-5 text-success" />
                ) : selectedBsv20?.pendingOps &&
                  selectedBsv20?.pendingOps > 0 ? (
                  <FaClock className="w-5 h-5 text-warning" />
                ) : (
                  <FaCheckCircle className="w-5 h-5 text-warning" />
                )}
              </div>
            )}
            {tickerAvailable === false && (
              <div className="absolute right-0 bottom-0 mb-2 mr-2">
                <ErrorIcon />
              </div>
            )}
          </div>
        </label>
      </div>

      {selectedActionType === ActionType.Deploy && (
        <div className="my-2">
          <label className="block mb-4">
            <div className="my-2 flex justify-between text-sm">Max Supply <span className="text-[#555]">Whole coins</span></div>
            <input
              pattern="\d+"
              type="text"
              className="text-white w-full rounded p-2 uppercase"
              onChange={(e) => setMaxSupply(e.target.value)}
              value={maxSupply}
            />
          </label>
        </div>
      )}

      {selectedActionType === ActionType.Mint && (
        <React.Fragment>
          <div className="my-2">
            <label className="block mb-4">
              <div className="my-2 flex justify-between items-center">
                Amount{" "}
                {selectedBsv20 && (
                  <button
                    type="button"
                    className="btn btn-sm"
                  >
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                    <span
                      className="text-[#555] cursor-pointer transition hover:text-[#777] text-sm"
                      onClick={() => {
                        setAmount(
                          selectedBsv20?.lim &&
                            selectedBsv20.lim !==
                            "0"
                            ? selectedBsv20.lim
                            : selectedBsv20.max
                        );
                      }}
                    >
                      Max:{" "}
                      {selectedBsv20?.lim &&
                        selectedBsv20.lim !== "0"
                        ? selectedBsv20.lim
                        : selectedBsv20?.max}
                    </span>
                  </button>
                )}
              </div>

              <input
                disabled={!!mintError}
                className="text-white w-full rounded p-2"
                type="number"
                min={1}
                max={selectedBsv20?.lim}
                onChange={changeAmount}
                value={amount}
                step={step + parseInt(amount || "0") - 1}
                onFocus={(event) =>
                  checkTicker(
                    ticker || "",
                    selectedActionType === ActionType.Mint,
                    event
                  )
                }
              />
            </label>
          </div>
          <div className="divider">Bulk Minting</div>

          <div>
            <div className="p-2 bg-[#111] my-2 rounded flex items-center justify-between">
              <div>{acquireText}</div>
              <input
                type="checkbox"
                className="toggle"
                checked={bulkEnabled}
                disabled={!canEnableBulk}
                onClick={() => {
                  if (bulkEnabled) {
                    setIterations(1);
                  }
                  setBulkEnabled(!bulkEnabled);
                }}
              />
            </div>

            {bulkEnabled && (
              <label className="block mb-4">
                <div className="my-2 flex justify-between items-center">
                  <div className="font-mono text-primary/50">
                    {iterations}𝒙
                  </div>
                  <div
                    className="tooltip opacity-75 text-purple-400 font-mono flex items-center"
                    data-tip={`Tier ${currentTier}/5`}
                  >
                    {stars}
                    <div className="mx-1" />
                    <Link
                      href={`/market/bsv20/${bulkMintingTicker}`}
                    >
                      {bulkMintingTicker}
                    </Link>
                  </div>
                </div>
                <input
                  onChange={changeIterations}
                  value={iterations}
                  max={maxIterations}
                  type="range"
                  min={1}
                  className="range"
                  step={step}
                />
                <div className="w-full flex justify-between text-xs px-2 text-primary/25">
                  {spacers}
                </div>
              </label>
            )}
            {bulkEnabled && amount && ticker && (
              <div className="bg-[#111] text-[#555] rounded p-2 font-mono text-sm">
                <div className="flex items-center justify-between">
                  <div className="w-1/2">
                    Indexing Fee:
                  </div>
                  <div className="w-1/2 text-right">
                    ${iterationFeeUsd}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="w-1/2">
                    Est Network Fee:
                  </div>
                  <div className="w-1/2 text-right">
                    ${networkFeeUsd}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="w-1/2">
                    You will recieve
                    <span
                      className="tooltip text-warning"
                      data-tip={
                        !tickerAvailable
                          ? "Minted Out"
                          : !inSync.value &&
                            indexers.value &&
                            chainInfo.value
                            ? "The index is not caught up. These tokens may have already been minted."
                            : selectedBsv20?.included
                              ? "Mints will be processed in the order they are assembled into blocks. We cannot gaurantee all tokens will be credited."
                              : `This ticker is not included in the index${selectedBsv20?.pendingOps &&
                                selectedBsv20.pendingOps >
                                0
                                ? ` and has ${selectedBsv20.pendingOps} operations in line ahead of this mint`
                                : ""
                              }. These tokens may have already been minted.`
                      }
                    >
                      <FaInfoCircle className="ml-2" />
                    </span>
                  </div>
                  <div className="w-1/2 text-right">
                    {(totalTokens > newSupply
                      ? newSupply
                      : totalTokens
                    ).toLocaleString()}{" "}
                    {ticker.toUpperCase()}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="w-1/2">
                    Pending Supply
                  </div>
                  <div className="w-1/2 text-right">
                    {selectedBsv20?.pending
                      ? selectedBsv20.pending
                      : 0}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="w-1/2">New Supply</div>
                  <div className="w-1/2 text-right">
                    {newSupply} / {selectedBsv20?.max}
                  </div>
                </div>
              </div>
            )}
            {selectedBsv20 && !selectedBsv20?.included && (
              <>
                <div className="divider">Ticker Status</div>
                <div className="p-2 bg-[#111] my-2 rounded text-warning font-mono">
                  <Link
                    href={`/market/bsv20/${selectedBsv20?.tick}`}
                  >
                    <FaExclamationCircle className="w-5 h-5 mr-2 inline-flex opacity-50 mb-1" />
                    {selectedBsv20?.tick} is not live.
                    Minted supply may be inaccurate. Fund{" "}
                    {selectedBsv20?.tick} first to be sure
                    you aren&apos;t over-minting. There is
                    no gaurentee you will recieve valid
                    tokens in this state!
                  </Link>
                </div>
              </>
            )}
          </div>
        </React.Fragment>
      )}

      {selectedActionType === ActionType.Deploy && (
        <div className="my-2">
          <label className="block mb-4">
            <div className="flex items-center justify-between my-2">
              Limit Per Mint{" "}
              <span className="text-[#555] text-sm">Optional</span>
            </div>
            <input
              className="text-white w-full rounded p-2"
              type="string"
              value={limit}
              pattern="^\S+$"
              onKeyDown={(event) => {
                if (
                  event.key === " " ||
                  event.key === "Enter"
                ) {
                  event.preventDefault();
                }
              }}
              onChange={changeLimit}
            />
          </label>
        </div>
      )}

      {selectedActionType === ActionType.Deploy &&
        !showOptionalFields && (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <div
            className="my-2 flex items-center justify-end cursor-pointer text-blue-500 hover:text-blue-400 transition"
            onClick={toggleOptionalFields}
          >
            <RiSettings2Fill className="mr-2" /> More Options
          </div>
        )}

      {selectedActionType === ActionType.Deploy && showOptionalFields && (
        <div className="my-2">
          <label className="block mb-4">
            <div className="my-2 flex items-center justify-between">
              Decimal Precision
            </div>
            <input
              className="text-white w-full rounded p-2"
              type="number"
              min={0}
              max={18}
              value={decimals}
              placeholder={defaultDec.toString()}
              onChange={changeDecimals}
            />
          </label>
        </div>
      )}
      {selectedActionType === ActionType.Deploy && (
        <div className="my-2 flex items-center justify-between mb-4 rounded p-2 text-info-content bg-info">
          <label className="block w-full">
            While BSV20 deployements themselves are indexed
            immediately, mints against them are indexed once an
            initial listing fee is paid. This helps bring minting
            incentives in line with BSVs insanely low network fees,
            and keeps this survice running reliably. The Listing Fee
            for this deployent will be ${`${listingFee}`}. This can
            be paid later.
          </label>
        </div>
      )}
      {preview && <hr className="my-2 h-2 border-0 bg-[#222]" />}
      <button
        disabled={submitDisabled}
        type="submit"
        onClick={
          bulkEnabled && iterations > 1 ? bulkInscribe : clickInscribe
        }
        className="w-full disabled:bg-[#222] disabled:text-[#555] hover:bg-yellow-500 transition bg-yellow-600 enabled:cursor-pointer p-3 text-xl rounded my-4 text-white"
      >
        Preview{" "}
        {selectedActionType === ActionType.Deploy
          ? "Deployment"
          : "Mint"}
      </button>
    </div>
  );
};

export default InscribeBsv20;

const maxMaxSupply = BigInt("18446744073709551615");

export const minFee = 10000000; // .1BSV
export const baseFee = 50;

const defaultDec = 8;
const bulkMintingTicker = "EGG";
const bulkMintingTickerMaxSupply = 21000000;
export const iterationFee = 1000;

const calculateTier = (balance: number, bulkMintingTickerMaxSupply: number) => {
  if (balance <= 0) return 0;

  // Calculate balance as a percentage of max supply
  const balancePct = (balance * 100) / bulkMintingTickerMaxSupply; // As percentage

  // Define tier thresholds as percentages of max supply
  // Assuming tiers are at 0.05%, 0.1%, 0.5%, 1%, 5% of max supply

  // console.log({ balancePct, tierThresholds });

  // Find the tier based on the percentage thresholds
  for (let tier = 5; tier > 0; tier--) {
    if (balancePct >= tierThresholds[tier - 1]) return tier;
  }
  // if no tiers met, return base tier 1
  return 1;
};

// Returns the tier number 1-5
const tierMaxNum = (balance: number) => {
  return calculateTier(balance, bulkMintingTickerMaxSupply);
};

const calculateSpacers = (maxIterations: number, steps: number) => {
  // console.log({ maxIterations, steps });
  // Calculate the number of spacers
  // const numSpacers = Math.floor(maxIterations / step);

  // Create an array of spacers
  return Array.from({ length: steps }, (_, index) => {
    return (
      <span key={`spacer-${index + 1}`} className="pointer-events-none">
        |
      </span>
    );
  }).slice(0, 10); // max out at 10 marks for display purposes
};

const bytesPerIteration = 40;

const tierThresholds = [
  0.001, // Tier 1
  0.01, // Tier 2
  0.025, // Tier 3
  0.05, // Tier 4
  0.1, // Tier 5
];

// hard maximum number of iterations per mint
const hardMax = 10000;
const hardMin = 2;

// Returns the capped max iterations for a given feature token balance
const tierMax = (balance: number, organicMax: number) => {
  const tierNum = calculateTier(balance, bulkMintingTickerMaxSupply);
  if (tierNum === 0) return 0; // Handle case where balance <= 0

  const tierThresholds = [0.01, 0.1, 0.25, 0.5, 1];
  const tier = Math.floor(organicMax * tierThresholds[tierNum - 1]);

  // max - supply / amount
  return Math.max(Math.min(Math.min(organicMax, tier), hardMax), hardMin);
};


export const P2PKH_INPUT_SCRIPT_SIZE = 107;
export const P2PKH_FULL_INPUT_SIZE = 148;
export const P2PKH_OUTPUT_SIZE = 34;