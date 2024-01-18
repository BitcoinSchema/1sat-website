import { P2PKHAddress, PrivateKey, PublicKey } from "bsv-wasm-web";

export const addressFromWif = (payPk: string) => {
  const wif = PrivateKey.from_wif(payPk);
  const pk = PublicKey.from_private_key(wif);
  return wif && pk && payPk && P2PKHAddress.from_pubkey(pk).to_string();
};
