"use client";

import { API_HOST, resultsPerPage } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { Signal, effect } from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import OrdinalListings from "../OrdinalListings";

const WalletOrdinals = () => {
  // get unspent ordAddress
  useSignals();
  const ordUtxos = useSignal<OrdUtxo[] | null>(null);
  effect(() => {
    if (!ordUtxos.value && ordAddress.value) {
      getOrdUtxos(ordUtxos);
    }
  });

  return (
    <div className="flex flex-col items-center justify-center w-full h-full">
      {ordUtxos.value && <OrdinalListings listings={ordUtxos.value} />}
    </div>
  );
};

export default WalletOrdinals;

export const getOrdUtxos = async (ordUtxos: Signal<OrdUtxo[] | null>) => {
  ordUtxos.value = [];
  const { promise } = http.customFetch<OrdUtxo[]>(
    `${API_HOST}/api/txos/address/${ordAddress.value}/unspent?limit=${resultsPerPage}&offset=0&dir=DESC&status=all&bsv20=true`
  );
  const u = await promise;
  ordUtxos.value = u;
};
