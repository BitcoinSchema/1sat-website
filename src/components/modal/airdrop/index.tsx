"use client";

import type { Holder, TickHolder } from "@/components/pages/TokenMarket/list";
import { Meteors } from "@/components/ui/meteors";
import { API_HOST, AssetType, FetchStatus, MARKET_API_HOST, toastErrorProps } from "@/constants";
import {
  bsvWasmReady,
  ordPk,
  payPk,
  pendingTxs,
  utxos,
} from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { Ticker } from "@/types/bsv20";
import type { BSV20TXO } from "@/types/ordinals";
import type { PendingTransaction } from "@/types/preview";
import * as http from "@/utils/httpClient";
import type { Utxo } from "@/utils/js-1sat-ord";
import { createChangeOutput, signPayment } from "@/utils/transaction";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { toBitcoin } from "satoshi-bitcoin-ts"
import {
  P2PKHAddress,
  PrivateKey,
  Script,
  SigHash,
  Transaction,
  TxIn,
  TxOut,
} from "bsv-wasm-web";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaQuestion } from "react-icons/fa";

interface TransferModalProps {
  onClose: () => void;
  amount?: number;
  address?: string;
  type: AssetType;
  dec: number;
  id: string;
  balance: number;
  sym?: string;
  open: boolean;
}

type Destination = {
  address: string;
  amt?: number | string;
  pct?: number;
  receiveAmt: number;
};

enum Allocation {
  Equal = "equal",
  Weighted = "weighted",
}

type AllocationOption = {
  value: Allocation;
  label: string;
};

const ALLOCATION_OPTIONS: AllocationOption[] = [
  {
    value: Allocation.Equal,
    label: "Equal",
  },
  {
    value: Allocation.Weighted,
    label: "Weighted",
  },
];

const AirdropTokensModal: React.FC<TransferModalProps> = ({
  type,
  balance,
  sym,
  id,
  amount: amt,
  dec,
  address: addr,
  onClose,
  open = false,
}) => {
  useSignals();
  const router = useRouter();
  const airdroppingStatus = useSignal<FetchStatus>(FetchStatus.Idle);
  const amount = useSignal(amt?.toString() || "0");
  const addresses = useSignal<string>(addr || "");
  const destinationTickers = useSignal("");
  const destinationBsv21Ids = useSignal("");
  const numOfHolders = useSignal("25");
  const allocation = useSignal<Allocation>(Allocation.Equal);
  const isEqualAllocation = allocation.value === Allocation.Equal;
  const reviewMode = useSignal(false);
  const destinations = useSignal<Destination[]>([]);
  const changeTokenAmount = useSignal(0);
  const indexingFees = useSignal(0);

  const setAmountToBalance = useCallback(() => {
    amount.value = balance.toString();
    console.log(amount.value);
  }, [amount, balance]);

  const handleReview = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    reviewMode.value = true;
  }, [reviewMode]);


  const airdropBsv20 = useCallback(
    async (
      sendAmount: number,
      paymentUtxos: Utxo[],
      inputTokens: BSV20TXO[], //
      paymentPk: PrivateKey,
      changeAddress: string,
      ordPk: PrivateKey,
      ordAddress: string,
      ticker: Ticker
    ): Promise<PendingTransaction> => {
      if (!bsvWasmReady.value) {
        throw new Error("bsv wasm not ready");
      }
      let tx = new Transaction(1, 0);

      // totals for airdrop review
      indexingFees.value = 0;
      changeTokenAmount.value = 0;

      // add token inputs
      let amounts = 0;
      let i = 0;
      for (const utxo of inputTokens) {
        const txBuf = Buffer.from(utxo.txid, "hex");
        let utxoIn = new TxIn(
          txBuf,
          utxo.vout,
          Script.from_asm_string("")
        );
        amounts += Number.parseInt(utxo.amt);
        tx.add_input(utxoIn);

        // sign ordinal
        const sig = tx.sign(
          ordPk,
          SigHash.NONE | SigHash.ANYONECANPAY | SigHash.FORKID,
          i,
          Script.from_bytes(Buffer.from(utxo.script, "base64")),
          BigInt(1)
        );

        utxoIn.set_unlocking_script(
          Script.from_asm_string(
            `${sig.to_hex()} ${ordPk.to_public_key().to_hex()}`
          )
        );

        tx.set_input(i, utxoIn);
        i++;
        if (sendAmount <= amounts) {
          break;
        }
      }

      // if allocation is "Equal", destination can include addresses
      destinations.value =
        isEqualAllocation && addresses.value.length > 0
          ? addresses.value
            .split(",")
            .map((a) => ({ address: a.trim(), receiveAmt: 0 })) // receiveAmt will be calculated later
          : [];
      const tickerDestinations = destinationTickers.value
        ? destinationTickers.value.split(",").map((a) => a.trim())
        : [];

      const bsv21Destinations = destinationBsv21Ids.value
        ? destinationBsv21Ids.value.split(",").map((a) => a.trim())
        : [];

      // resolve ticker holders
      let receivers: Destination[] = [];
      let remainder = 0;

      for (const t of tickerDestinations.concat(bsv21Destinations)) {
        const url = `${API_HOST}/api/bsv20/${t[t.length - 2] === "_" ? "id" : "tick"}/${t}`;
        const tickerHoldersUrl = `${url}/holders?limit=${numOfHolders.value}`;
        const holdersRes = await fetch(tickerHoldersUrl);
        const holders = ((await holdersRes.json()) || []) as Holder[];

        if (!isEqualAllocation) {
          // calculations for weighted allocation
          const detailsRes = await fetch(url);
          const details = await detailsRes.json();

          // calculate pct held for each receiver
          const tickHolders = holders
            ?.sort(
              (a, b) =>
                Number.parseInt(b.amt) - Number.parseInt(a.amt)
            )
            .map((h) => ({
              ...h,
              amt:
                Number.parseInt(h.amt) /
                10 ** (details?.dec || 0),
              pct:
                Number.parseInt(h.amt) /
                Number.parseInt(details!.supply!),
            })) as TickHolder[];

          // calculate total percentage owned by all receivers
          const totalPctHeldByHolders = tickHolders.reduce(
            (acc, h) => (acc += h.pct),
            0
          );

          // calculate amount to receive for each holder based on pct owned scaled
          // to total pct owned by all receivers (totalPctOfHolders = 100%)
          for (const holder of tickHolders) {
            const weightedAmt =
              (sendAmount * holder.pct) / totalPctHeldByHolders;
            const receiveAmt = Math.floor(weightedAmt);
            remainder += Math.round(weightedAmt - receiveAmt); // round to integer to avoid js pitfalls with numbers

            receivers.push({ ...holder, receiveAmt });
          }
        } else {
          receivers = receivers.concat(
            holders.map(({ address }) => ({
              address,
              receiveAmt: 0,
            }))
          );
        }
      }

      if (receivers.length > 0) {
        destinations.value.push(...receivers);
      }

      if (destinations.value.length === 0) {
        throw new Error("No destinations found");
      }

      if (isEqualAllocation) {
        const amountEach = Math.floor(sendAmount / destinations.value.length);
        if (Number.isNaN(amountEach) || amountEach <= 0) {
          toast.error(
            "Amount must be greater than 0",
            toastErrorProps
          );
          throw new Error("unexpected error");
        }
        remainder = sendAmount % destinations.value.length;
        destinations.value = destinations.value.map((dest) => ({
          ...dest,
          receiveAmt: amountEach,
        }));
      }

      // make sure we have enough to cover the send amount
      if (amounts < sendAmount) {
        toast.error(
          `Not enough ${ticker.tick || ticker.sym}`,
          toastErrorProps
        );
        debugger
        throw new Error("insufficient funds");
      }

      if (amounts > sendAmount) {

        changeTokenAmount.value = amounts - sendAmount + remainder;

        // build change inscription
        const changeInscription = {
          p: "bsv-20",
          op: "transfer",
          amt: (amounts - sendAmount + remainder).toString(),
        } as any;
        if (ticker.tick) {
          changeInscription.tick = ticker.tick;
        } else if (ticker.id) {
          changeInscription.id = ticker.id;
        } else {
          throw new Error("unexpected error");
        }
        const changeFileB64 = Buffer.from(
          JSON.stringify(changeInscription)
        ).toString("base64");
        const changeInsc = buildInscriptionSafe(
          P2PKHAddress.from_string(ordAddress),
          changeFileB64,
          "application/bsv-20"
        );
        const changeInscOut = new TxOut(BigInt(1), changeInsc);
        tx.add_output(changeInscOut);

        // indexing fee for the change inscription
        indexingFees.value += 1000;
      }

      let totalSatsIn = 0;
      const sortedUtxos = paymentUtxos.sort((a, b) => {
        return a.satoshis > b.satoshis ? -1 : 1;
      });

      // payment Inputs
      for (const utxo of sortedUtxos) {
        let utxoIn = new TxIn(
          Buffer.from(utxo.txid, "hex"),
          utxo.vout,
          Script.from_asm_string("")
        );

        tx.add_input(utxoIn);

        utxoIn = signPayment(tx, paymentPk, i, utxo, utxoIn);
        tx.set_input(i, utxoIn);
        totalSatsIn += utxo.satoshis;
        i++;
        break;
      }

      // build up the transfers
      for (const dest of destinations.value) {
        const inscription = {
          p: "bsv-20",
          op: "transfer",
          amt: dest.receiveAmt?.toString(),
        } as any;
        if (ticker.tick) {
          inscription.tick = ticker.tick;
        } else if (ticker.id) {
          inscription.id = ticker.id;
        }

        const fileB64 = Buffer.from(
          JSON.stringify(inscription)
        ).toString("base64");
        const insc = buildInscriptionSafe(
          P2PKHAddress.from_string(dest.address),
          fileB64,
          "application/bsv-20"
        );

        let satOut = new TxOut(BigInt(1), insc);
        tx.add_output(satOut);
      }

      const indexerAddress = ticker.fundAddress;
      // output 4 indexer fee
      if (indexerAddress) {
        const nOutputs = tx.get_noutputs();
        const indexerFeeOutput = new TxOut(
          BigInt(1000 * (nOutputs + 1)), // 1000 * number of transfer inscriptions
          P2PKHAddress.from_string(
            indexerAddress
          ).get_locking_script()
        );
        tx.add_output(indexerFeeOutput);
        // update the review variable
        indexingFees.value = 1000 * (nOutputs);
    
      }

      const changeOut = createChangeOutput(
        tx,
        changeAddress,
        totalSatsIn,
      );
      tx.add_output(changeOut);

      return {
        rawTx: tx.to_hex(),
        size: tx.get_size(),
        fee: paymentUtxos[0]!.satoshis - Number(tx.satoshis_out()),
        numInputs: tx.get_ninputs(),
        numOutputs: tx.get_noutputs(),
        txid: tx.get_id_hex(),
        inputTxid: paymentUtxos[0].txid,
        marketFee: 0,
      }
    },
    [
      addresses.value,
      destinationTickers.value,
      isEqualAllocation,
      numOfHolders.value,
      destinations.value,
    ]
  );

  const submit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (reviewMode.value) {
        router.push("/preview");
        return;
      }

      const isDestinationMissing =
        !destinationTickers.value &&
        !destinationBsv21Ids.value &&
        !(isEqualAllocation && addresses.value?.length);

      if (!amount.value || isDestinationMissing) {
        return;
      }

      if (Number.parseFloat(amount.value) > balance) {
        toast.error("Not enough Bitcoin!", toastErrorProps);
        return;
      }

      airdroppingStatus.value = FetchStatus.Loading;

      console.log(amount.value, addresses.value);
      const amt = Math.floor(Number.parseFloat(amount.value) * 10 ** dec);
      if (amt <= 0) {
        toast.error("Amount must be greater than 0", toastErrorProps);
        airdroppingStatus.value = FetchStatus.Error;
        return;
      }

      try {
        const { promise: promiseTickerDetails } = http.customFetch<Ticker>(
          `${API_HOST}/api/bsv20/${type === AssetType.BSV20 ? "tick" : "id"}/${id}`
        );
        const ticker = await promiseTickerDetails;
      
        const bsv20TxoUrl = `${API_HOST}/api/bsv20/${ordAddress.value}/${type === AssetType.BSV20 ? "tick" : "id"}/${id}?listing=false`;
        const { promise } = http.customFetch<BSV20TXO[]>(bsv20TxoUrl);

        const tokenUtxos = ((await promise) || []);

        const transferTx = await airdropBsv20(
          amt,
          utxos.value!,
          tokenUtxos,
          PrivateKey.from_wif(payPk.value!),
          fundingAddress.value!,
          PrivateKey.from_wif(ordPk.value!),
          ordAddress.value!,
          ticker
        );
        airdroppingStatus.value = FetchStatus.Success;

        // Get only the PendingTransaction fields from the ReviewPendingTransaction which extends it with extra stuff we dont need right now
        pendingTxs.value = [transferTx];

        if (!reviewMode.value) {
          // If not in review mode, call handleReview instead
          await handleReview(e);
          return;
        }

      } catch (e) {
        console.error(e);
        toast.error("Failed to create airdrop", toastErrorProps);
        airdroppingStatus.value = FetchStatus.Error;
      }
    },
    [
      destinationTickers.value,
      destinationBsv21Ids.value,
      isEqualAllocation,
      addresses.value,
      amount.value,
      balance,
      airdroppingStatus,
      dec,
      type,
      id,
      airdropBsv20,
      router,
      reviewMode.value,
      destinations.value,
    ]
  );

  const loadTemplate = useCallback(async () => {
    // ${MARKET_API_HOST}/airdrop/3
    const url = `${MARKET_API_HOST}/airdrop/3`;
    const { promise } = http.customFetch<string[]>(url);
    const template = await promise;
    addresses.value = template.join(",");
  }, [addresses]);

  // placeholder should show the number of decimals as zeroes
  const amtPlaceholder = useMemo(() => {
    return dec > 0 ? `0.${"0".repeat(dec)}` : "0";
  }, [dec]);

  const [clickedInside, setClickedInside] = useState(false);

  const handleModalClick = () => {
    if (!clickedInside) {
      onClose();
    }
    setClickedInside(false);
  };

  const handleModalContentMouseDown = () => {
    setClickedInside(true);
  };
  
  return (
    <dialog
      id="airdrop_modal"
      className={`modal backdrop-blur overflow-y-auto ${open ? "modal-open" : ""}`}
      onClick={handleModalClick}
    >
      <div
        className="modal-box max-h-[90vh] m-auto w-full max-w-lg m-auto p-4 bg-[#111] text-[#aaa] rounded flex flex-col border border-yellow-200/5"
        onMouseDown={handleModalContentMouseDown}
      >
        <div className="relative w-full min-h-64 md:h-full mb-4">
          <div className="flex justify-between">
            <div className="text-lg font-semibold">
              {reviewMode.value ? "Review Airdrop" : `Airdrop ${sym || id}`}
            </div>
            <div
              className="text-xs cursor-pointer text-[#aaa]"
              onClick={setAmountToBalance}
            >
              Balance: {balance}{" "}
              {type === AssetType.BSV21 ? sym : id}
            </div>
          </div>
          <form onSubmit={submit}>
            {!reviewMode.value && <div>
              <div className="flex flex-col w-full">
                <label className="text-sm font-semibold text-[#aaa] mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  placeholder={amtPlaceholder}
                  max={balance}
                  className="z-20 input input-bordered w-full placeholder:text-[#333]"
                  value={amount.value === "0" ? "" : amount.value}
                  onChange={(e) => {
                    if (
                      e.target.value === "" ||
                      Number.parseFloat(e.target.value) <=
                      balance
                    ) {
                      amount.value = e.target.value;
                    }
                  }}
                />
              </div>
              <div className="flex flex-col w-full mt-4">
                <label className="text-sm font-semibold text-[#aaa] mb-2 flex items-center">
                  <span className="text-nowrap">
                    {allocation.value} allocation
                  </span>{" "}
                  <div className="text-[#555] pl-2">
                    {allocation.value === Allocation.Equal
                      ? "distribute tokens equally to all addresses."
                      : "based on % of total supply held by each address."}
                  </div>
                </label>

                <select
                  className="z-20 input input-bordered w-full"
                  value={allocation.value}
                  onChange={(e) => {
                    allocation.value = e.target
                      .value as Allocation;
                  }}
                >
                  {ALLOCATION_OPTIONS.map(
                    (opt: {
                      value: Allocation;
                      label: string;
                    }) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                      >
                        {opt.label}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div className="flex flex-col mt-4">
                <label className="text-sm font-semibold text-[#aaa] mb-2">
                  BSV20 Destination Tickers (comma separated list)
                </label>
                <input
                  type="text"
                  placeholder="RUG, PEPE, EGG, LOVE, SHGR"
                  className="z-20 input input-bordered w-full placeholder:text-[#333]"
                  value={destinationTickers.value}
                  onChange={(e) => {
                    destinationTickers.value = e.target.value;
                  }}
                />
              </div>

              <div className="flex flex-col mt-4">
                <label className="text-sm font-semibold text-[#aaa] mb-2">
                  BSV21 Destination Token IDs (comma separated list)
                </label>
                <input
                  type="text"
                  placeholder="e6d40ba206340aa94ed40fe1a8adcd722c08c9438b2c1dd16b4527d561e848a2_0"
                  className="z-20 input input-bordered w-full placeholder:text-[#333]"
                  value={destinationBsv21Ids.value}
                  onChange={(e) => {
                    destinationBsv21Ids.value = e.target.value;
                  }}
                />
              </div>

              {(destinationTickers.value.length > 0 || destinationBsv21Ids.value.length > 0) && (
                <div className="flex flex-col w-full mt-4">
                  <label className="text-sm font-semibold text-[#aaa] mb-2 flex items-center text-right justify-end">
                    <div
                      className="tooltip tooltip-left"
                      data-tip="Holders per ticker, largest first."
                    >
                      <FaQuestion className="text-[#aaa] cursor-pointer mr-2" />
                    </div>
                    Number of holders
                  </label>
                  <input
                    type="number"
                    placeholder="25"
                    className="z-20 input input-bordered w-full placeholder:text-[#333]"
                    value={numOfHolders.value === "0" ? "" : numOfHolders.value}
                    max={"1000"}
                    onChange={(e) => {
                      numOfHolders.value = e.target.value;
                    }}
                  />
                </div>
              )}

              <div className="divider" />
              {isEqualAllocation && (
                <div className="flex flex-col mt-4">
                  <label className="text-sm font-semibold text-[#aaa] mb-2">
                    Addresses (comma separated list){" "}
                    <div
                      className="cursor-pointer text-blue-400 hover:text-blue-500"
                      onClick={loadTemplate}
                    >
                      All Registered Users
                    </div>
                  </label>
                  <input
                    type="text"
                    placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                    className="z-20 input input-bordered w-full placeholder:text-[#333]"
                    value={addresses.value}
                    onChange={(e) => {
                      addresses.value = e.target.value;
                    }}
                  />
                </div>
              )}
            </div>}

            {reviewMode.value && <div className="flex flex-col">
              <div className="flex justify-between">
                <div className="text-sm font-semibold text-[#aaa] mb-2">Destination ({destinations.value.length})</div>
                <div className="text-sm font-semibold text-[#aaa] mb-2">Amount</div>
              </div>
              {destinations.value.map((dest, index) => (
                <div key={index} className="flex justify-between mb-2">
                  <span>{dest.address}</span>
                  <span>{dest.receiveAmt / 10 ** dec} {sym || id}</span>
                </div>
              ))}
              <div className="mt-4 flex justify-between">
                <div className="text-sm font-semibold text-[#aaa] mb-2">Indexing Fees</div>
                <div>{toBitcoin(indexingFees.value || 0)} BSV</div>
              </div>
              {changeTokenAmount.value > 0 && <div className="mt-4 flex justify-between">
                <div className="text-sm font-semibold text-[#aaa] mb-2">Change Tokens</div>
                <div>{changeTokenAmount.value / 10 ** dec} {sym || id}</div>
              </div>}
            </div>}

            <div className="modal-action">
              <button
                type="button"
                onClick={() => reviewMode.value = false}
                className="bg-[#222] p-2 rounded cursor-pointer hover:bg-yellow-600 text-white">
                Back
              </button>
              <button
                type="submit"
                disabled={airdroppingStatus.value === FetchStatus.Loading}
                className="bg-[#222] p-2 rounded cursor-pointer hover:bg-emerald-600 text-white disabled:bg-[#555] disabled:cursor-not-allowed"
              >
                {reviewMode.value ? (
                  airdroppingStatus.value === FetchStatus.Loading ? "Raining" : "Confirm"
                ) : (
                  "Review"
                )}
              </button>
            </div>
          </form>
          <Meteors number={20} />
        </div>
      </div >
    </dialog >
  );
};

export default AirdropTokensModal;

export const buildInscriptionSafe = (
  destinationAddress: P2PKHAddress | string,
  b64File?: string | undefined,
  mediaType?: string | undefined
): Script => {
  let ordAsm = "";
  // This can be omitted for reinscriptions that just update metadata
  if (b64File !== undefined && mediaType !== undefined) {
    const ordHex = toHex("ord");
    const fsBuffer = Buffer.from(b64File, "base64");
    const fireShardHex = fsBuffer.toString("hex");
    const fireShardMediaType = toHex(mediaType);
    ordAsm = `OP_0 OP_IF ${ordHex} OP_1 ${fireShardMediaType} OP_0 ${fireShardHex} OP_ENDIF`;
  }

  let address: P2PKHAddress;
  // normalize destinationAddress
  if (typeof destinationAddress === "string") {
    address = P2PKHAddress.from_string(destinationAddress);
  } else {
    address = destinationAddress;
  }
  // Create ordinal output and inscription in a single output
  const inscriptionAsm = `${address.get_locking_script().to_asm_string()}${ordAsm ? ` ${ordAsm}` : ""
    }`;

  return Script.from_asm_string(inscriptionAsm);
};

const toHex = (str: string): string => {
  return Buffer.from(str, "utf8").toString("hex");
};
