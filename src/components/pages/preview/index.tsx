"use client";

import { API_HOST, toastProps } from "@/constants";
import { pendingTxs, usdRate } from "@/signals/wallet";
import { fundingAddress } from "@/signals/wallet/address";
import { PendingTransaction } from "@/types/preview";
import { formatBytes } from "@/utils/bytes";
import * as http from "@/utils/httpClient";
import { computed, effect } from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { P2PKHAddress, Transaction } from "bsv-wasm";
import { head } from "lodash";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { toBitcoin } from "satoshi-bitcoin-ts";

const PreviewPage = () => {
  useSignals();
  const router = useRouter();
  const txs = useSignal<PendingTransaction[] | null>(pendingTxs.value);
  const pendingTx = useSignal<PendingTransaction | null>(
    head(txs.value) || null
  );

  effect(() => {
    txs.value = pendingTxs.value;
    pendingTx.value = head(txs.value) || null;
  });

  const feeUsd = computed(() => {
    if (!pendingTx.value?.fee) {
      return null;
    }
    const fee = pendingTx.value.fee;
    const feeUsd = fee / 100000000 / 100000000;
    return feeUsd.toFixed(2);
  });

  const broadcast = async () => {
    const tx = pendingTx.value;
    if (!tx) {
      return;
    }
    const rawtx = Buffer.from(tx.rawTx, "hex").toString("base64");
    const { promise } = http.customFetch<any>(`${API_HOST}/api/tx`, {
      method: "POST",
      body: JSON.stringify({
        rawtx,
      }),
    });
    await promise;

    toast.success("Transaction broadcasted.", toastProps);
    pendingTxs.value =
      pendingTxs.value?.filter((t) => t.txid !== tx.txid) || [];

    router.back();
  };

  const change = computed(() => {
    if (!pendingTx.value?.numOutputs) {
      return 0n;
    }
    const tx = Transaction.from_hex(pendingTx.value?.rawTx);
    // find the output going back to the fundingAddress
    // iterate pendingTx.value?.numOutputs times
    let totalChange = 0n;
    for (let i = 0; i < pendingTx.value?.numOutputs; i++) {
      const out = tx.get_output(i);
      const pubKeyHash = out
        ?.get_script_pub_key()
        .to_asm_string()
        .split(" ")[2]!;

        if (pubKeyHash.length !== 40) {
          continue
        }
     
      const address = P2PKHAddress.from_pubkey_hash(
        Buffer.from(pubKeyHash, "hex")
      ).to_string();
      if (address === fundingAddress.value) {
        totalChange += out?.get_satoshis()!;
      }
    }
    return totalChange;
  });

  const usdPrice = computed(() => {
    if (!pendingTx.value?.rawTx || !usdRate.value) {
      return null;
    }

    const tx = Transaction.from_hex(pendingTx.value.rawTx);
    const numOutputs = pendingTx.value.numOutputs;
    let totalOut = 0n;
    for (let i = 0; i < numOutputs; i++) {
      const out = tx.get_output(i)!;
      totalOut += out.get_satoshis()!;
    }
    const cost = Number(totalOut - change.value);
    return (cost / usdRate.value).toFixed(2);
  });

  useEffect(() => {
    console.log({ usdPrice: usdPrice.value, change: change.value });
  }, [usdPrice.value, change.value]);

  const content = computed(() => (
    <>
      <h1 className="text-center text-2xl">
        {`${
          pendingTx.value?.numOutputs === 1
            ? "Refund"
            : pendingTx.value?.numOutputs === 2 &&
                pendingTx.value?.numInputs === 2
              ? "Transfer"
              : "Inscription"
        }
Preview`}
      </h1>
      <div className="text-center text-[#aaa] mt-2">Broadcast to finalize.</div>
      <div className="w-full max-w-lg mx-auto h-[260px] whitespace-pre-wrap break-all font-mono rounded bg-[#111] text-xs text-ellipsis overflow-hidden p-2 text-teal-700 mt-4 mb-8 relative">
        <span className="opacity-50 select-none">
          {pendingTx.value?.rawTx?.slice(0, 888)}
        </span>
        <div className="p-2 md:p-6 absolute w-full text-white bg-transparent bottom-0 left-0 bg-gradient-to-t from-black from-60% to-transparent">
          <div className="font-semibold text-center text-sm text-[#aaa] mb-2 py-2">
            Transaction ID
          </div>
          <div className="rounded-full bg-[#222] border flex items-center justify-center text-center text-[9px] md:text-[11px] text-[#aaa] border-[#333] my-2 py-2">
            {pendingTx.value?.txid}
          </div>
          <div className="px-2">
            <div className="flex justify-between mt-4">
              <div>{pendingTx.value?.numInputs} Inputs</div>
              <div>{pendingTx.value?.numOutputs} Outputs</div>
            </div>
            <div className="flex justify-between">
              <div>Size</div>
              <div>{formatBytes(pendingTx.value?.rawTx.length! / 2)}</div>
            </div>
            {(pendingTx.value?.price || 0) > 0 && (
              <div className="flex justify-between">
                <div>Market Price</div>
                <div>{toBitcoin(pendingTx.value?.price || 0)} BSV</div>
              </div>
            )}
            {pendingTx.value?.marketFee ? (
              <div className="flex justify-between">
                <div>Market Fee (4%)</div>
                <div>
                  {pendingTx.value.marketFee <= 50000
                    ? `${pendingTx.value.marketFee.toLocaleString()} Satoshis`
                    : `${toBitcoin(pendingTx.value.marketFee)} BSV`}
                </div>
              </div>
            ) : null}
            <div className="flex justify-between">
              <div>Network Fee</div>
              <div>{pendingTx.value?.fee.toLocaleString()} Satoshis</div>
            </div>
            <div className="flex justify-between">
              <div>Network Fee USD</div>
              <div>{feeUsd}</div>
            </div>
            {pendingTx.value?.fee && (
              <div className="flex justify-between">
                <div>Fee Rate</div>
                <div>
                  {(
                    pendingTx.value.fee /
                    (pendingTx.value.rawTx?.length / 2)
                  ).toFixed(5)}{" "}
                  sat/B
                </div>
              </div>
            )}
            {pendingTx.value?.metadata && (
              <div className="flex justify-between">
                <div>Metadata</div>
                <div>
                  {Object.keys(pendingTx.value?.metadata).map((k) => {
                    const v =
                      pendingTx.value?.metadata && pendingTx.value.metadata[k];
                    return (
                      <div key={k} className="flex justify-between">
                        <div className="mr-2 text-[#555]">{k}</div>
                        <div className="ml-2">{v}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {pendingTx.value?.iterations && pendingTx.value?.iterations > 1 && (
              <div className="flex justify-between">
                <div>Iterations</div> <div>{pendingTx.value.iterations}</div>
              </div>
            )}
          </div>
          <div className="p-2 items-center justify-center gap-2">
            <div className="btn btn-warning w-full" onClick={broadcast}>
              Broadcast ${usdPrice}
            </div>
            <div className=""></div>
          </div>
        </div>
      </div>
    </>
  ));

  return content;
};

export default PreviewPage;
