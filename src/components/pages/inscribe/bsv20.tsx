"use client";

import { API_HOST, FetchStatus } from "@/constants";
import {
  bsv20Balances,
  chainInfo,
  indexers,
  payPk,
  usdRate,
  utxos,
} from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { BSV20, Ticker } from "@/types/bsv20";
import { PendingTransaction } from "@/types/preview";
import { getUtxos } from "@/utils/address";
import { calculateIndexingFee } from "@/utils/bsv20";
import { inscribeUtf8 } from "@/utils/inscribe";
import { computed } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { Utxo } from "js-1sat-ord";
import { debounce, head } from "lodash";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckmarkIcon, ErrorIcon } from "react-hot-toast";
import { IoMdWarning } from "react-icons/io";
import { RiMagicFill, RiSettings2Fill } from "react-icons/ri";
import { InscriptionTab } from "./tabs";

enum ActionType {
  Mint = "mint",
  Deploy = "deploy",
}

const top10 = ["FREN", "LOVE", "TRMP", "GOLD", "TOPG", "CAAL"]

interface InscribeBsv20Props {
  inscribedCallback: (pendingTx: PendingTransaction) => void;
}

const InscribeBsv20: React.FC<InscribeBsv20Props> = ({ inscribedCallback }) => {
  useSignals();
  const router = useRouter();
  const params = useSearchParams();
  // const { tab, tick, op } = params.query as { tab: string; tick: string; op: string };
  const tab = params.get("tab") as InscriptionTab;
  const tick = params.get("tick");
  const op = params.get("op");

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
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);
  const [iterations, setIterations] = useState<number>(1);

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
      setTicker(e.target.value);
      if (mintError) setMintError(undefined);
    },
    [setTicker, mintError]
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
              parseInt(bsv20.supply!) < parseInt(bsv20.max!)
            );
            setSelectedBsv20(bsv20);
            if (
              !!bsv20 &&
              bsv20.max !== undefined &&
              bsv20.supply !== undefined &&
              parseInt(bsv20.supply) < parseInt(bsv20.max) &&
              bsv20.pendingOps === 0
            ) {
              setTickerAvailable(true);
            } else if (bsv20.pendingOps > 0) {
              setTickerAvailable(true);
              setMintError("May be minted out");
            } else {
              setTickerAvailable(false);
              setMintError("Minted Out");
            }
          }
        } else if (resp.status === 404) {
          console.log("ticker not found", tick, "expectExist", expectExist);
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

  const changeMaxSupply = useCallback(
    (e: any) => {
      setMaxSupply(e.target.value);
    },
    [setMaxSupply]
  );

  const changeSelectedActionType = useCallback(
    async (e: any) => {
      console.log({ val: e.target.value });
      const actionType = e.target.value.toLowerCase() as ActionType;
      setSelectedActionType(actionType);
      if (ticker) {
        await checkTicker(ticker, actionType === ActionType.Mint);
      }
    },
    [setSelectedActionType, ticker, checkTicker]
  );

  const changeIterations = useCallback(
    (e: any) => {
      console.log("changing iterations to", e.target.value);
      setIterations(parseInt(e.target.value));
    },
    [setIterations]
  );

  const inSync = computed(() => {
    if (!indexers.value || !chainInfo.value) {
      return false;
    }

    console.log({ indexers: indexers.value, chainInfo: chainInfo.value });
    return (
      indexers.value["bsv20-deploy"] >= chainInfo.value?.blocks &&
      indexers.value["bsv20"] >= chainInfo.value?.blocks
    );
  });

  const tickerNote = useMemo(() => {
    return tickerAvailable === false
      ? selectedActionType === ActionType.Deploy
        ? ticker === ""
          ? `¯\\_(ツ)_/¯`
          : "Ticker Unavailable"
        : mintError
      : inSync.value
        ? "1-4 Characters"
        : selectedActionType === ActionType.Deploy
          ? "Syncing. May already be deployed."
          : "Syncing. May be minted out.";
  }, [ticker, mintError, selectedActionType, tickerAvailable]);

  const totalTokens = useMemo(() => {
    return iterations * parseInt(amount || "0");
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
      setDecimals(e.target.valuye ? parseInt(e.target.value) : undefined);
    },
    [setDecimals]
  );

  const changeAmount = useCallback(
    (e: any) => {
      if (selectedActionType === ActionType.Mint && selectedBsv20?.lim) {
        if (parseInt(e.target.value) <= parseInt(selectedBsv20.lim)) {
          setAmount(e.target.value);
        }
        return;
      }
      // exclude 0
      if (parseInt(e.target.value) !== 0) {
        setAmount(e.target.value);
      }
    },
    [selectedBsv20, selectedActionType, setAmount]
  );

  const inscribeBsv20 = useCallback(
    async (utxo: Utxo) => {
      if (!ticker || ticker?.length === 0) {
        return;
      }

      setInscribeStatus(FetchStatus.Loading);

      try {
        let inscription = {
          p: "bsv-20",
          op: selectedActionType,
        } as BSV20;

        switch (selectedActionType) {
          case ActionType.Deploy:
            if (parseInt(maxSupply) == 0 || BigInt(maxSupply) > maxMaxSupply) {
              alert(
                `Invalid input: please enter a number less than or equal to ${
                  maxMaxSupply - BigInt(1)
                }`
              );
              return;
            }

            inscription.tick = ticker;
            inscription.max = maxSupply;

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
              parseInt(amount) == 0 ||
              BigInt(amount) > maxMaxSupply ||
              !selectedBsv20
            ) {
              alert(
                `Max supply must be a positive integer less than or equal to ${
                  maxMaxSupply - BigInt(1)
                }`
              );
              return;
            }
            inscription.tick = selectedBsv20.tick;
            inscription.amt = amount;
          default:
            break;
        }

        const text = JSON.stringify(inscription);
        const payments = [
          {
            to: selectedBsv20?.fundAddress!,
            amount: 1000n,
          },
        ];
        const pendingTx = await inscribeUtf8(
          text,
          "application/bsv-20",
          utxo,
          undefined,
          payments
        );

        setInscribeStatus(FetchStatus.Success);

        if (pendingTx) {
          inscribedCallback(pendingTx);
        }
      } catch (error) {
        setInscribeStatus(FetchStatus.Error);

        alert("Invalid max supply: please enter a number. " + error);
        return;
      }
    },
    [
      inscribedCallback,
      amount,
      decimals,
      limit,
      maxSupply,
      selectedActionType,
      selectedBsv20,
      ticker,
    ]
  );

  const bulkInscribe = useCallback(async () => {
    if (!payPk || !ordAddress || !fundingAddress.value) {
      return;
    }

    for (let i = 0; i < iterations; i++) {
      await getUtxos(fundingAddress.value);
      const sortedUtxos = utxos.value?.sort((a, b) =>
        a.satoshis > b.satoshis ? -1 : 1
      );
      const u = head(sortedUtxos);
      if (!u) {
        console.log("no utxo");
        return;
      }

      return await inscribeBsv20(u);
    }
  }, [iterations, inscribeBsv20]);

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

    return await inscribeBsv20(u);
  }, [inscribeBsv20]);

  const submitDisabled = useMemo(() => {
    return (
      !tickerAvailable ||
      !ticker?.length ||
      inscribeStatus === FetchStatus.Loading ||
      fetchTickerStatus === FetchStatus.Loading ||
      (!!limit && maxSupply < limit)
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
      return minFee;
    }
    return selectedBsv20
      ? calculateIndexingFee(usdRate.value)
      : calculateIndexingFee(usdRate.value);
  }, [maxSupply, limit, selectedBsv20]);

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
            Ticker <span className="text-[#555]">{tickerNote}</span>
          </div>
          <div className="relative">
            <input
              className="text-white w-full rounded p-2 uppercase"
              maxLength={4}
              pattern="^\S+$"
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") {
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

            {tickerAvailable === true && !inSync && (
              <div className="absolute right-0 bottom-0 mb-2 mr-2">
                <IoMdWarning />
              </div>
            )}

            {tickerAvailable === true && inSync && (
              <div className="absolute right-0 bottom-0 mb-2 mr-2">
                <CheckmarkIcon />
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
            <div className="my-2">Max Supply</div>
            <input
              pattern="\d+"
              type="text"
              className="text-white w-full rounded p-2 uppercase"
              onChange={changeMaxSupply}
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
                  <span
                    className="text-[#555] cursor-pointer transition hover:text-[#777]"
                    onClick={() => {
                      setAmount(
                        selectedBsv20?.lim && selectedBsv20.lim !== "0"
                          ? selectedBsv20.lim
                          : selectedBsv20.max
                      );
                    }}
                  >
                    Max:{" "}
                    {selectedBsv20?.lim && selectedBsv20.lim !== "0"
                      ? selectedBsv20.lim
                      : selectedBsv20?.max}
                  </span>
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
          {bulkEnabled && (
            <div>
              {bsv20Balances.value &&
                !Object.keys(bsv20Balances.value)?.some(
                  (b) => b.toUpperCase() === "BULK"
                ) && (
                  <div className="p-2 bg-[#111] my-2 rounded">
                    Acquire{" "}
                    <span
                      className="font-mono text-blue-400 hover:text-blue-500 cursor-pointer"
                      onClick={() => {
                        router.push("/inscribe?tab=bsv20&tick=BULK&op=mint");
                      }}
                    >
                      BULK
                    </span>{" "}
                    to enable bulk minting.
                  </div>
                )}
              {bulkEnabled && (
                <label className="block mb-4">
                  <div className="my-2 flex justify-between items-center">
                    <div>Iterations</div>
                    <div className="opacity-75 text-purple-400 font-mono flex items-center">
                      <RiMagicFill className="mr-2" />
                      BULK
                    </div>
                  </div>
                  <input
                    className="text-white w-full rounded p-2"
                    type="text"
                    onChange={changeIterations}
                    value={iterations}
                    max={30}
                  />
                </label>
              )}
              {/* TODO: Display accurately at end of supply */}
              {bulkEnabled && amount && ticker && (
                <div className="bg-[#111] text-[#555] rounded p-2">
                  You will recieve {totalTokens} {ticker.toUpperCase()}
                </div>
              )}
            </div>
          )}
        </React.Fragment>
      )}

      {selectedActionType === ActionType.Deploy && (
        <div className="my-2">
          <label className="block mb-4">
            <div className="flex items-center justify-between my-2">
              Limit Per Mint <span className="text-[#555]">Optional</span>
            </div>
            <input
              className="text-white w-full rounded p-2"
              type="string"
              value={limit}
              pattern="^\S+$"
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                }
              }}
              onChange={changeLimit}
            />
          </label>
        </div>
      )}

      {selectedActionType === ActionType.Deploy && !showOptionalFields && (
        <div
          className="my-2 flex items-center justify-end cursor-pointer text-blue-500 hover:text-blue-400 transition"
          onClick={toggleOptionalFields}
        >
          <RiSettings2Fill className="mr-2" /> More Options
        </div>
      )}

      {selectedActionType === ActionType.Deploy && showOptionalFields && (
        <>
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
        </>
      )}
      {selectedActionType === ActionType.Deploy && (
        <div className="my-2 flex items-center justify-between mb-4 rounded p-2 text-info-content bg-info">
          <label className="block w-full">
            While BSV20 deployements themselves are indexed immediately, mints
            against them are indexed once an initial listing fee is paid. This
            helps bring minting incentives in line with BSVs insanely low
            network fees, and keeps this survice running reliably. The Listing
            Fee for this deployent will be ${`${listingFee}`}. This can be paid
            later.
          </label>
        </div>
      )}
      {preview && <hr className="my-2 h-2 border-0 bg-[#222]" />}
      <button
        disabled={submitDisabled}
        type="submit"
        onClick={bulkEnabled && iterations > 1 ? bulkInscribe : clickInscribe}
        className="w-full disabled:bg-[#222] disabled:text-[#555] hover:bg-yellow-500 transition bg-yellow-600 enabled:cursor-pointer p-3 text-xl rounded my-4 text-white"
      >
        Preview
      </button>
    </div>
  );
};

export default InscribeBsv20;

const maxMaxSupply = BigInt("18446744073709551615");
const bulkEnabled = false;

export const minFee = 100000000; // 1BSV
export const baseFee = 50;

const defaultDec = 8