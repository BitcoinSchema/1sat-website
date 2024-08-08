"use client";

import { usdRate } from "@/signals/wallet";
import { calculateIndexingFee, minFee } from "@/utils/bsv20";
import { computed } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { FaQuestionCircle } from "react-icons/fa";
import { toBitcoin } from "satoshi-bitcoin-ts";

const Fund = ({ ticker }: { ticker: any }) => {
  useSignals();
  const indexingFeeUsd = computed(() =>
    calculateIndexingFee(usdRate.value || 0)
  );

  const usdRecieved = computed(() => {
    return (ticker.fundTotal / usdRate.value).toFixed(2);
  });

  const bsvNeeded = computed(() => {
    const satoshis = Math.max(
      minFee - Number(ticker.fundTotal),
      parseInt(ticker.pendingOps || "0") * 1000
    );
    return toBitcoin(satoshis);
  });

  return (
    <div className="my-2 bg-[#111] p-4">
      <h3 className="text-lg text-center my-2 font-semibold">Indexing Fund</h3>
      <div className="text-info my-2">{`Minimum indexing fee is 0.1 BSV, and a 1000 sat per operation is needed to maintain listing status.`}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div>Indexing Fund Address</div>
        <div className="text-right text-xs">{ticker.fundAddress}</div>
        {!ticker.included && indexingFeeUsd.value.length > 0 && (
          <>
            <div>
              Pending Operations{" "}
              <div
                className="tooltip"
                data-tip="Number of actions not yet indexed. Pending actions must be processed before balances can be fully determined. "
              >
                <FaQuestionCircle className="inline" />
              </div>
            </div>
            <div className="text-right">
              {(ticker.pendingOps || "0").toLocaleString()}
            </div>
            <div>Fee Rate <div className="tooltip" data-tip="Payment required per action">
              <FaQuestionCircle className="inline" />
            </div></div>
            <div className="text-right">1000 sat</div>
            <div>
              Listing Price{" "}
              <div
                className="tooltip"
                data-tip={`This fee covers including ${ticker.tick || ticker.sym
                  } on 1sat.market. Listing fee will be used to process pending actions.`}
              >
                <FaQuestionCircle className="inline" />
              </div>
            </div>
            <div className="text-right">
              ${usdRecieved} / ${indexingFeeUsd}
            </div>
          </>
        )}
        {bsvNeeded.value > 0 && (
          <>
            <div className="text-warning">Unpaid Fee</div>
            <div className="text-right text-warning">{bsvNeeded.value} BSV</div>
          </>
        )}
      </div>
    </div>
  );
};

export default Fund;
