
import {
  ExtendedPrivateKey,
  P2PKHAddress,
  PrivateKey,
  PublicKey,
} from "bsv-wasm";
import { generateMnemonic } from "./mnemonic";

export type WalletKeys = {
  ordPk: string;
  payPk: string;
  mnemonic?: string;
  changeAddressPath?: number;
  ordAddressPath?: number;
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

export const randomMnemonic: () => Promise<WalletKeys> = () => {
  return new Promise<WalletKeys>((resolve, reject) => {
    const mnemonic = generateMnemonic(128);

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
    let found = false;

    const searchForAddress = (i: number) => {
      if (new Date().getTime() - ts > timeoutMs && !found) {
        reject(
          new Error("Timeout while searching for the desired address prefix.")
        );
        return;
      }

      ordPrivKey = xprivWasm.derive(i);
      ordAddress = P2PKHAddress.from_pubkey(
        ordPrivKey.get_private_key().to_public_key()
      );

      if (ordAddress.to_string().startsWith("1s")) {
        ordPk = ordPrivKey.get_private_key().to_wif();
        found = true;
        console.log(`Ord address found! Using child key ${i} for ordinals.`);
        // toast.success(
        //   `Ord address found! Using child key ${i} for ordinals.`,
        //   toastProps
        // );
        resolve({
          mnemonic,
          payPk,
          ordPk,
          changeAddressPath: 0,
          ordAddressPath: i,
        } as WalletKeys);
      } else {
        setTimeout(() => searchForAddress(i + 1), 0);
      }
    };

    searchForAddress(1);
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

  // TODO: Update this function to work like the one above
  return { mnemonic, payPk, ordPk, changeAddressPath: 0, ordAddressPath: 1 };
}

export const addressForPrivakeKey = (ordPk: PrivateKey) =>
  P2PKHAddress.from_pubkey(PublicKey.from_private_key(ordPk)).to_string();
