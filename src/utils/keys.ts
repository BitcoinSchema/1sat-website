import { PrivateKey } from "bsv-wasm-web";

export const randomKeys = () => {
  const payPk = PrivateKey.from_random().to_wif();
  const ordPk = PrivateKey.from_random().to_wif();
  return { payPk, ordPk };
};
