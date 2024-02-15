"use client";

import { buildInscriptionSafe } from "@/components/modal/airdrop";
import { API_HOST, oLockPrefix, oLockSuffix } from "@/constants";
import {
  bsv20Balances,
  bsvWasmReady,
  ordPk,
  payPk,
  pendingTxs,
  utxos,
} from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { BSV20TXO } from "@/types/ordinals";
import { PendingTransaction } from "@/types/preview";
import * as http from "@/utils/httpClient";
import { Utxo } from "@/utils/js-1sat-ord";
import { createChangeOutput, signPayment } from "@/utils/transaction";
import { computed, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
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
import { useCallback, useEffect } from "react";
import { MarketData } from "./list";

const ListingForm = ({
  dataset,
  onClose,
  ticker,
}: {
  ticker: Partial<MarketData>;
  dataset: {
    height: number;
    price: number | null;
  }[];
  onClose: () => void;
}) => {
  useSignals();
  const router = useRouter();
  const listingPrice = useSignal<string | null>(null);
  const listingAmount = useSignal<string | null>(null);

  // set initial price
  useEffect(() => {
    if (dataset && !listingPrice.value) {
      // populate the form data
      listingPrice.value = "0";
      for (const d of dataset) {
        listingPrice.value = d.price?.toString() || "0";
      }
    }
  }, [dataset, listingPrice]);

  const confirmedBalance = computed(() => {
    return (
      bsv20Balances.value?.find((b) => b.tick === ticker.tick)?.all.confirmed ||
      0
    );
  });

  const pendingBalance = computed(() => {
    return (
      bsv20Balances.value?.find((b) => b.tick === ticker.tick)?.all.pending || 0
    );
  });

  const listedBalance = computed(() => {
    return (
      bsv20Balances.value?.find((b) => b.tick === ticker.tick)?.listed
        .confirmed || 0
    );
  });

  const pendingListedBalance = computed(() => {
    return (
      bsv20Balances.value?.find((b) => b.tick === ticker.tick)?.listed
        .pending || 0
    );
  });

  const dec = computed(() => {
    return bsv20Balances.value?.find((b) => b.tick === ticker.tick)?.dec || 0;
  });

  useEffect(() => {
    console.log({ amt: listingAmount.value });
  }, [listingAmount]);

  const listBsv20 = useCallback(
    async (
      sendAmount: number,
      paymentUtxos: Utxo[],
      inputTokens: BSV20TXO[], //
      paymentPk: PrivateKey,
      changeAddress: string,
      ordPk: PrivateKey,
      ordAddress: string,
      payoutAddress: string,
      satoshisPayout: number,
      indexerAddress: string
    ): Promise<PendingTransaction> => {
      if (!bsvWasmReady.value) {
        throw new Error("bsv wasm not ready");
      }
      let tx = new Transaction(1, 0);

      // add token inputs
      let amounts = 0;
      let i = 0;
      for (const utxo of inputTokens) {
        const txBuf = Buffer.from(utxo.txid, "hex");
        let utxoIn = new TxIn(txBuf, utxo.vout, Script.from_asm_string(""));
        amounts += parseInt(utxo.amt);
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
      if (amounts > sendAmount) {
        // build change inscription
        const changeInscription = {
          p: "bsv-20",
          op: "transfer",
          amt: (amounts - sendAmount).toString(),
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
      }

      let totalSatsIn = 0;
      // payment Inputs
      for (const utxo of paymentUtxos.sort((a, b) => {
        return a.satoshis > b.satoshis ? -1 : 1;
      })) {
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

      const payoutDestinationAddress = P2PKHAddress.from_string(payoutAddress);
      const payOutput = new TxOut(
        BigInt(satoshisPayout),
        payoutDestinationAddress.get_locking_script()
      );

      const destinationAddress = P2PKHAddress.from_string(ordAddress);
      const addressHex = destinationAddress
        .get_locking_script()
        .to_asm_string()
        .split(" ")[2];

      const inscription = {
        p: "bsv-20",
        op: "transfer",
        amt: sendAmount.toString(),
      } as any;
      if (ticker.tick) {
        inscription.tick = ticker.tick;
      } else if (ticker.id) {
        inscription.id = ticker.id;
      }

      const fileB64 = Buffer.from(JSON.stringify(inscription)).toString(
        "base64"
      );
      const insc = buildInscriptionSafe(
        destinationAddress.to_string(),
        fileB64,
        "application/bsv-20"
      );
      const transferInscription = insc
        .to_asm_string()
        .split(" ")
        .slice(5) // remove the p2pkh added by buildInscription
        .join(" ");

      const ordLockScript = `${transferInscription} ${Script.from_hex(
        oLockPrefix
      ).to_asm_string()} ${addressHex} ${payOutput.to_hex()} ${Script.from_hex(
        oLockSuffix
      ).to_asm_string()}`;

      let satOut = new TxOut(BigInt(1), Script.from_asm_string(ordLockScript));
      tx.add_output(satOut);

      // output 4 indexer fee
      if (indexerAddress) {
        const indexerFeeOutput = new TxOut(
          BigInt(2000), // 1000 * 2 inscriptions
          P2PKHAddress.from_string(indexerAddress).get_locking_script()
        );
        tx.add_output(indexerFeeOutput);
      }

      const changeOut = createChangeOutput(tx, changeAddress, totalSatsIn);
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
      };
    },
    [ticker]
  );

  const submit = useCallback(
    async (e: any) => {
      if (!bsvWasmReady.value) {
        console.log("bsv wasm not ready");
        return;
      }
      e.preventDefault();
      console.log(
        "create listing",
        ticker,
        { price: listingPrice.value },
        { amount: listingAmount.value }
      );
      if (!utxos || !payPk || !ordPk || !fundingAddress || !ordAddress) {
        return;
      }
      const paymentPk = PrivateKey.from_wif(payPk.value!);
      const ordinalPk = PrivateKey.from_wif(ordPk.value!);

      // [{"txid":"69a5956ee1cad8056f0c4d6ca4f87766080b36a75f2192d2cf75f1f668f446d6","vout":2,"outpoint":"69a5956ee1cad8056f0c4d6ca4f87766080b36a75f2192d2cf75f1f668f446d6_2","height":828275,"idx":1162,"op":"transfer","amt":"10000","status":1,"reason":null,"listing":false,"owner":"139xRf73Vw3W8cMNoXW9amqZfXMrEuM9XQ","spend":"","spendHeight":null,"spendIdx":null,"tick":"PEPE","id":null,"price":"0","pricePer":"0","payout":null,"script":"dqkUF6HYh83S8XxpORgFL3VFy4fwqDSIrABjA29yZFESYXBwbGljYXRpb24vYnN2LTIwADp7InAiOiJic3YtMjAiLCJvcCI6InRyYW5zZmVyIiwidGljayI6IlBFUEUiLCJhbXQiOiIxMDAwMCJ9aA==","sale":false}]

      // setPendingTransaction(pendingTx);

      try {
        let url = `${API_HOST}/api/bsv20/${ordAddress.value}/tick/${ticker.tick}`;
        if (!!ticker.id) {
          url = `${API_HOST}/api/bsv20/${ordAddress.value}/id/${ticker.id}`;
        }
        console.log({ url });
        const { promise } = http.customFetch<BSV20TXO[]>(url);

        const u = (await promise).filter((u) => u.listing === false);
        const satoshisPayout = Math.ceil(
          parseFloat(listingPrice.value!) * parseFloat(listingAmount.value!)
        );
        const indexerAddress = ticker.fundAddress!;
        const pendingTx = await listBsv20(
          Math.ceil(parseFloat(listingAmount.value!) * 10 ** dec.value),
          utxos.value!,
          u,
          paymentPk,
          fundingAddress.value!,
          ordinalPk,
          ordAddress.value!,
          fundingAddress.value!,
          satoshisPayout,
          indexerAddress
        );
        pendingTxs.value = [pendingTx];
        router.push("/preview");
      } catch (e) {
        console.log({ e });
      }
      // const ordUtxo = await getUtxoByOutpoint(selectedItem.origin.outpoint);
      // if (!ordUtxo) {
      //   // TODO: show error
      //   return;
      // }
    },
    [ticker, listingPrice.value, listingAmount.value, listBsv20, dec, router]
  );

  const listDisabled = computed(
    () =>
      !listingAmount.value ||
      !listingPrice.value ||
      parseInt(listingAmount.value || "0") === 0 ||
      listingPrice.value === "0" ||
      parseInt(listingAmount.value || "0") > (confirmedBalance.value || 0)
  );
  return (
    <div className="h-60 w-full">
      <form>
        <div
          className="text-center text-xl font-semibold cursor-pointer"
          onClick={() => {
            const convertedValue = confirmedBalance.value / 10 ** dec.value;
            listingAmount.value = convertedValue.toString() || null;
          }}
        >
          Balance:{" "}
          {(confirmedBalance.value - listedBalance.value) / 10 ** dec.value}{" "}
          {pendingBalance.value > 0
            ? `(${pendingBalance.value / 10 ** dec.value} pending)`
            : ""}
          {pendingListedBalance.value > 0
            ? `(-${pendingListedBalance.value / 10 ** dec.value} pending)`
            : ""}
        </div>

        <div className="form-control w-full">
          <label className="label flex items-center justify-between">
            <span className="label-text">Price per token</span>
            <span className="text-[#555]">Sats</span>
          </label>
          <input
            type="text"
            placeholder="1000"
            className="input input-sm input-bordered"
            onChange={(e) => {
              listingPrice.value = e.target.value;
            }}
          />
        </div>
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Amount</span>
          </label>
          <input
            type="number"
            placeholder="0"
            className="input input-sm input-bordered"
            onChange={(e) => {
              // make sure amount respects decimals
              const dec = ticker.dec || 0;
              if (e.target.value.includes(".")) {
                const parts = e.target.value.split(".");
                if (parts.length > 2) {
                  return;
                }
                if (parts[1].length > dec) {
                  return;
                }
              }
              listingAmount.value = e.target.value;
            }}
            value={listingAmount.value || undefined}
            max={confirmedBalance.value}
          />
        </div>
        <div className="modal-action">
          <button
            type="button"
            className={"btn btn-sm btn-primary"}
            disabled={listDisabled.value}
            onClick={submit}
          >
            {`List ${listingAmount.value || 0} ${ticker.tick || ticker.sym}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ListingForm;
