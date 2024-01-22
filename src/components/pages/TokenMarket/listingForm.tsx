"use client";

import { bsv20Balances } from "@/signals/wallet";
import { computed, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useEffect } from "react";
import { MarketData } from "./list";

const ListingForm = ({
  marketData,
  dataset,
}: {
  marketData: MarketData;
  dataset: {
    height: number;
    price: number | null;
  }[];
}) => {
  useSignals();
  const listingPrice = useSignal<string | null>(null);
  const listingAmount = useSignal<string | null>(null);

  // set initial price
  useEffect(() => {
    if (dataset && !listingPrice.value) {
      // populate the form data
      listingPrice.value = "0";
      dataset.forEach((d) => {
        listingPrice.value = d.price?.toString() || "0";
      });
    }
  }, [dataset, listingPrice, marketData]);

  const confirmedBalance = computed(() => {
    return bsv20Balances.value?.find((b) => b.tick === marketData.tick)?.all.confirmed;
  });

  useEffect(() => {
    console.log({ amt: listingAmount.value });
  }, [listingAmount]);

  const listDisabled = computed(() => !listingAmount.value || !listingPrice.value || (parseInt(listingAmount.value || "0") === 0) || listingPrice.value === "0" || parseInt(listingAmount.value || "0") > (confirmedBalance.value || 0))
  return (
    <div className="h-60 w-full">
      <form>
        <div
          className="text-center text-xl font-semibold cursor-pointer"
          onClick={() => {
            listingAmount.value = confirmedBalance.value?.toString() || null;
          }}
        >
          Balance: {confirmedBalance.value}
        </div>
        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">Price per token</span>
          </label>
          <input
            type="text"
            placeholder="0.00"
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
              listingAmount.value = e.target.value;
            }}
            value={listingAmount.value || undefined}
            max={confirmedBalance.value}
          />
        </div>
        <div className="modal-action">
          <button
            className={`btn btn-sm btn-primary`}
            disabled={listDisabled.value}
            onClick={(e) => {
              e.preventDefault();
              console.log("Listing", e.target);
            }}
          >
            {`List ${listingAmount.value || 0} ${marketData.tick}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ListingForm;
