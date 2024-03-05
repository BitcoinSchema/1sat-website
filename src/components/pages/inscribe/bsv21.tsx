"use client";

import { FetchStatus, toastErrorProps } from "@/constants";
import { chainInfo, indexers, payPk, pendingTxs, usdRate, utxos } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { BSV20 } from "@/types/bsv20";
import { getUtxos } from "@/utils/address";
import { calculateIndexingFee } from "@/utils/bsv20";
import { inscribeUtf8 } from "@/utils/inscribe";
import { Utxo } from "@/utils/js-1sat-ord";
import { computed } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { head } from "lodash";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { IoMdWarning } from "react-icons/io";
import { RiSettings2Fill } from "react-icons/ri";
import { InscriptionTab } from "./tabs";

const top10 = ["FREN", "LOVE", "TRMP", "GOLD", "TOPG", "CAAL"];

interface InscribeBsv21Props {
  inscribedCallback: () => void;
}

const InscribeBsv21: React.FC<InscribeBsv21Props> = ({ inscribedCallback }) => {
  useSignals();
  const router = useRouter();
  const params = useSearchParams();
  // const { tab, tick, op } = params.query as { tab: string; tick: string; op: string };
  const tab = params.get("tab") as InscriptionTab;
  const tick = params.get("tick");
  const op = params.get("op");

  const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);

  const [fetchTickerStatus, setFetchTickerStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [inscribeStatus, setInscribeStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [limit, setLimit] = useState<string | undefined>("1337");
  const [maxSupply, setMaxSupply] = useState<string>("21000000");
  const [decimals, setDecimals] = useState<number | undefined>();
  const [amount, setAmount] = useState<string>();
  const [mintError, setMintError] = useState<string>();
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);
  const [iterations, setIterations] = useState<number>(1);

  const [ticker, setTicker] = useState<string | null>(tick);

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

  const changeMaxSupply = useCallback(
    (e: any) => {
      setMaxSupply(e.target.value);
    },
    [setMaxSupply]
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

  

  const totalTokens = useMemo(() => {
    return iterations * parseInt(amount || "0");
  }, [amount, iterations]);

  const changeLimit = useCallback(
    (e: any) => {
      setLimit(e.target.value);
    },
    [setLimit]
  );

  const changeDecimals = useCallback(
    (e: any) => {
      setDecimals(e.target.value ? parseInt(e.target.value) : undefined);
    },
    [setDecimals]
  );

  const changeAmount = useCallback(
    (e: any) => {
      // exclude 0
      if (parseInt(e.target.value) !== 0) {
        setAmount(e.target.value);
      }
    },
    [setAmount]
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
          op: "deploy+mint",
        } as BSV20;

        if (parseInt(maxSupply) == 0 || BigInt(maxSupply) > maxMaxSupply) {
          alert(
            `Invalid input: please enter a number less than or equal to ${
              maxMaxSupply - BigInt(1)
            }`
          );
          return;
        }

        inscription.sym = ticker;
        inscription.amt = maxSupply;

        // optional fields
        if (decimals !== undefined) {
          inscription.dec = decimals;
        }
       
        const text = JSON.stringify(inscription);
        const payments = [
          // {
          //   to: selectedBsv20.fundAddress,
          //   amount: 1000n,
          // },
        ] as { to: string; amount: bigint }[];

        const pendingTx = await inscribeUtf8(
          text,
          "application/bsv-20",
          utxo,
          undefined,
          payments
        );

        setInscribeStatus(FetchStatus.Success);

        if (pendingTx) {
          pendingTxs.value = [pendingTx];
          inscribedCallback();
        }
      } catch (error) {
        setInscribeStatus(FetchStatus.Error);

        toast.error(`Failed to inscribe ${error}`, toastErrorProps);
        return;
      }
    },
    [inscribedCallback, decimals, maxSupply, ticker]
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
      !ticker?.length ||
      inscribeStatus === FetchStatus.Loading ||
      fetchTickerStatus === FetchStatus.Loading ||
      !maxSupply
    );
  }, [inscribeStatus, ticker?.length, fetchTickerStatus, maxSupply]);

  const listingFee = useMemo(() => {
    if (!usdRate.value) {
      return minFee;
    }
    return  calculateIndexingFee(usdRate.value);
  }, [usdRate]);

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-white w-full p-2 rounded my-2 cursor-pointer">
        Deploy New Token
      </div>
      <div className="my-2">
        <label className="block mb-4">
          {/* TODO: Autofill */}
          <div className="flex items-center justify-between my-2">
            Symbol <span className="text-[#555]">{`Not required to be unique`}</span>
          </div>
          <div className="relative">
            <input
              className="text-white w-full rounded p-2"
              maxLength={255}
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  return;
                }
              }}
              value={ticker || ""}
              onChange={(event) => {
                changeTicker(event);
              }}
            />

            {!inSync && (
              <div className="absolute right-0 bottom-0 mb-2 mr-2">
                <IoMdWarning />
              </div>
            )}
          </div>
        </label>
      </div>

<div>
<input type="file" className="file-input w-full max-w-xs" />
</div>
      <div className="my-2">
        <label className="block mb-4">
          <div className="my-2">Max Supply</div>
          <input
            pattern="\d+"
            type="text"
            className="text-white w-full rounded p-2"
            onChange={changeMaxSupply}
            value={maxSupply}
          />
        </label>
      </div>

      {!showOptionalFields && (
        <div
          className="my-2 flex items-center justify-end cursor-pointer text-blue-500 hover:text-blue-400 transition"
          onClick={toggleOptionalFields}
        >
          <RiSettings2Fill className="mr-2" /> More Options
        </div>
      )}

      {showOptionalFields && (
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
      <div className="my-2 flex items-center justify-between mb-4 rounded p-2 text-info-content bg-info">
        <label className="block w-full">
          BSV21 deployements are indexed immediately. A listing fee of ${`${listingFee}`} will be required before it shows up in some areas on the website. This can be paid later.
        </label>
      </div>
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

export default InscribeBsv21;

const maxMaxSupply = BigInt("18446744073709551615");
const bulkEnabled = false;

export const minFee = 100000000; // 1BSV
export const baseFee = 50;

const defaultDec = 8