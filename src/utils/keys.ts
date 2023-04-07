import { P2PKHAddress, PrivateKey, PublicKey } from "bsv-wasm-web";

export type WalletKeys = {
  ordPk: string;
  payPk: string;
};
export const randomKeys: () => Promise<WalletKeys> = () => {
  return new Promise<WalletKeys>((resolve, reject) => {
    const payPk = PrivateKey.from_random().to_wif();
    let ordPk = PrivateKey.from_random();
    const timeoutMs = 100000;
    // TODO: This needs to be done in the backend
    // and transmitted securely to do 1sat addresses
    // TODO: Estimate remaining time
    // TODO: cancel
    // TODO: gpu acceleration?
    // TODO: 1sat is too slow
    // TODO: escape w timeout
    const ts = new Date().getTime();
    while (!addressForPrivakeKey(ordPk).startsWith("1s")) {
      ordPk = PrivateKey.from_random();
      if (new Date().getTime() - ts > timeoutMs) {
        reject({});
      }
    }
    resolve({ payPk, ordPk: ordPk.to_wif() } as WalletKeys);
  });
};

export const addressForPrivakeKey = (ordPk: PrivateKey) =>
  P2PKHAddress.from_pubkey(PublicKey.from_private_key(ordPk)).to_string();
