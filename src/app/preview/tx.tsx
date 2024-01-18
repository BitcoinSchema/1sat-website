"use client";

import { pendingTxs } from "@/signals/wallet";
import { PendingTransaction } from "@/types/preview";
import { formatBytes } from "@/utils/bytes";
import { computed, effect } from "@preact/signals-react";
import { useSignal } from "@preact/signals-react/runtime";
import { head } from "lodash";
import { toBitcoin } from "satoshi-bitcoin-ts";

const TxPreview = () => {
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
        </div>
      </div>
    </>
  ));

  return content;
};

export default TxPreview;
