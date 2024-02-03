import { WocUtxo } from "@/types/common";
import { P2PKHAddress, PrivateKey, PublicKey } from "bsv-wasm-web";
import * as http from "./httpClient";

export const addressFromWif = (payPk: string) => {
  const wif = PrivateKey.from_wif(payPk);
  const pk = PublicKey.from_private_key(wif);
  return wif && pk && payPk && P2PKHAddress.from_pubkey(pk).to_string();
};

export const getUtxos = async (address: string) => {
  const { promise } = http.customFetch<WocUtxo[]>(
    `https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent`
  );
  const u = await promise;

  return u.map((u: WocUtxo) => {
    return {
      satoshis: u.value,
      txid: u.tx_hash,
      vout: u.tx_pos,
      script: P2PKHAddress.from_string(address)
        .get_locking_script()
        .to_asm_string(),
    };
  });
};
