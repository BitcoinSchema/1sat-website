"use client";

import { API_HOST, AssetType, resultsPerPage } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { useInView } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";
import OrdinalListings from "../OrdinalListings";
import Tabs from "./tabs";

const WalletOrdinals = ({ address: addressProp }: { address?: string }) => {
  // get unspent ordAddress
  useSignals();
  const ordUtxos = useSignal<OrdUtxo[] | null>(null);
  const nextOffset = useSignal(0);
  const reachedEndOfListings = useSignal(false);
  const ref = useRef(null);
  const isInView = useInView(ref);

  const getOrdUtxos = useCallback(
    async (offset = 0) => {
      nextOffset.value = offset + resultsPerPage;
      const { promise } = http.customFetch<OrdUtxo[]>(
        `${API_HOST}/api/txos/address/${addressProp || ordAddress.value}/unspent?limit=${resultsPerPage}&offset=${offset}&dir=DESC&status=all&bsv20=false`
      );
      const u = await promise;
      if (u.length < resultsPerPage) {
        reachedEndOfListings.value = true;
      }
      ordUtxos.value = (ordUtxos.value || []).concat(...u);
    },
    [addressProp, nextOffset, ordUtxos, reachedEndOfListings]
  );

  useEffect(() => {
    if (
      !ordUtxos.value &&
      ordAddress.value &&
      isInView &&
      reachedEndOfListings.value === false
    ) {
      getOrdUtxos(nextOffset.value);
    }
  }, [isInView, ordUtxos, nextOffset, getOrdUtxos, reachedEndOfListings]);

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      <Tabs type={AssetType.Ordinals} address={addressProp} />
      <div  className="tab-content block bg-base-100 border-base-300 rounded-box p-2 md:p-6 w-[95vw] md:w-[64rem]">
      {ordUtxos.value && <OrdinalListings listings={ordUtxos.value} />}
      </div>
      <div ref={ref} className="w-full h-1" />
    </div>
  );
};

export default WalletOrdinals;
