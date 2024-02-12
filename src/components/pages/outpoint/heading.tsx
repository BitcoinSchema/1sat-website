"use client"

import { Signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import Link from "next/link";
import { FaChevronDown, FaChevronRight } from "react-icons/fa6";

export const showDetails = new Signal<boolean>(true);

const OutpointHeading = ({ outpoint }: { outpoint: string }) => {
  useSignals();
  const toggleDetails = () => {
    showDetails.value = !showDetails.value;
  };
  const txid = outpoint.split("_")[0];
  return (
    <>
      <div className="mb-4 w-full">
        <h1 className="text-[#aaa] text-xl">Transaction</h1>
        <Link
          className="text-xs font-mono text-[#555]"
          href={`https://whatsonchain.com/tx/${txid}`}
          target="_blank"
        >
          {txid}
        </Link>
      </div>
      <div className=" cursor-pointer hover:text-blue-400 flex justify-end w-full text-sm text-blue-500">
        <div className="flex items-center w-24" onClick={toggleDetails}>
          {!showDetails.value ? (
            <FaChevronRight className="mr-2" />
          ) : (
            <FaChevronDown className="mr-2" />
          )}
          Tx Details
        </div>
      </div>
    </>
  );
};

export default OutpointHeading;
