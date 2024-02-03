import { computed } from "@preact/signals-react";
import { P2PKHAddress, PrivateKey } from "bsv-wasm-web";
import { bsvWasmReady, ordPk, payPk } from ".";

export const fundingAddress = computed(() => {
  const wif = payPk.value;
  const ready = bsvWasmReady.value;
  if (!wif || !ready) {
    return null;
  }
  
  const pubkey = PrivateKey.from_wif(wif).to_public_key();
  return P2PKHAddress.from_pubkey(pubkey).to_string();
});

export const ordAddress = computed(() => {
  const wif = ordPk.value;
  const ready = bsvWasmReady.value;
  if (!wif || !ready) {
    return null;
  }
  const pubkey = PrivateKey.from_wif(wif).to_public_key();
  return P2PKHAddress.from_pubkey(pubkey).to_string();
});
