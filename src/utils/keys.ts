import {
  ExtendedPrivateKey,
  P2PKHAddress,
  PrivateKey,
  PublicKey,
} from "bsv-wasm-web";
import { generateMnemonic } from "./mnemonic";

export type WalletKeys = {
  ordPk: string;
  payPk: string;
  mnemonic: string;
};
export const randomKeys: () => Promise<WalletKeys> = () => {
  return new Promise<WalletKeys>((resolve, reject) => {
    const mnemonic = generateMnemonic(128);
    console.log({ mnemonic });
    const xprivWasm = ExtendedPrivateKey.from_mnemonic(
      Buffer.from(mnemonic, "utf8")
    );

    const payPrivKey = xprivWasm.derive(0);
    const payPk = payPrivKey.get_private_key().to_wif();

    let ordPk;
    let ordPrivKey;
    let ordAddress;

    const timeoutMs = 100000;
    const ts = new Date().getTime();

    for (let i = 1; ; i++) {
      ordPrivKey = xprivWasm.derive(i);
      ordAddress = P2PKHAddress.from_pubkey(
        ordPrivKey.get_private_key().to_public_key()
      );

      if (ordAddress.to_string().startsWith("1s")) {
        ordPk = ordPrivKey.get_private_key().to_wif();
        break;
      }

      if (new Date().getTime() - ts > timeoutMs) {
        reject(
          new Error("Timeout while searching for the desired address prefix.")
        );
      }
    }

    resolve({ mnemonic, payPk, ordPk } as WalletKeys);
  });
};

export async function restoreKeysFromMnemonic(
  mnemonic: string
): Promise<WalletKeys> {
  const xprivWasm = ExtendedPrivateKey.from_mnemonic(
    Buffer.from(mnemonic, "utf8")
  );

  const payPrivKey = xprivWasm.derive(0);
  const payPk = payPrivKey.get_private_key().to_wif();

  let ordPk;
  let ordPrivKey;
  let ordAddress;

  const timeoutMs = 100000;
  const ts = new Date().getTime();

  for (let i = 1; ; i++) {
    ordPrivKey = xprivWasm.derive(i);
    ordAddress = P2PKHAddress.from_pubkey(
      ordPrivKey.get_private_key().to_public_key()
    );

    if (ordAddress.to_string().startsWith("1s")) {
      ordPk = ordPrivKey.get_private_key().to_wif();
      break;
    }

    if (new Date().getTime() - ts > timeoutMs) {
      throw new Error(
        "Timeout while searching for the desired address prefix."
      );
    }
  }

  return { mnemonic, payPk, ordPk };
}

export const addressForPrivakeKey = (ordPk: PrivateKey) =>
  P2PKHAddress.from_pubkey(PublicKey.from_private_key(ordPk)).to_string();
// TODO: This needs to be done in the backend
// and transmitted securely to do 1sat addresses
// TODO: Estimate remaining time
// TODO: cancel
// TODO: gpu acceleration?
// TODO: 1sat is too slow
// TODO: escape w timeout
