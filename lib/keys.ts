"use client";

// SECURITY WARNING: This file contains key management logic.
// It should ONLY be imported and used in Client Components ("use client").
// Never handle raw private keys or mnemonics on the server side.

import { HD, Mnemonic, type PrivateKey } from "@bsv/sdk";
import type { Keys } from "@/lib/types";

export type { Keys };

export const YOURS_WALLET_PATH = "m/44'/236'/0'/1/0";
export const YOURS_ID_PATH = "m/0'/236'/0'/0/0";
export const YOURS_ORD_PATH = "m/44'/236'/1'/0/0";
export const RELAYX_ORD_PATH = "m/44'/236'/0'/2/0";
export const RELAYX_ID_PATH = YOURS_ID_PATH;
export const RELAYX_WALLET_PATH = YOURS_WALLET_PATH;
export const RELAYX_SWEEP_PATH = "m/44'/236'/0'/0/0";
export const TWETCH_WALLET_PATH = "m/0/0";
export const TWETCH_ORD_PATH = YOURS_ORD_PATH;
export const AYM_WALLET_PATH = "m/0/0";
export const AYM_ORD_PATH = "m";

export const derivePathFromMnemonic = (
  mnemonic: string,
  path: string,
): PrivateKey => {
  const seed = Mnemonic.fromString(mnemonic).toSeed();
  const masterNode = HD.fromSeed(seed);
  const privKey = masterNode.derive(path);
  return privKey.privKey;
};

export const getKeysFromMnemonicAndPaths = (
  mnemonic: string,
  paths: {
    changeAddressPath: string;
    ordAddressPath: string;
    identityAddressPath?: string;
  },
): Keys => {
  const seed = Mnemonic.fromString(mnemonic).toSeed();
  const masterNode = HD.fromSeed(seed);

  const changeAddressPath = paths.changeAddressPath.startsWith("m/")
    ? paths.changeAddressPath
    : `m/${paths.changeAddressPath}`;
  const payPrivKey = masterNode.derive(changeAddressPath);
  const payPk = payPrivKey.privKey.toWif();

  const ordAddressPath = paths.ordAddressPath.startsWith("m/")
    ? paths.ordAddressPath
    : `m/${paths.ordAddressPath}`;
  const ordPrivKey =
    paths.ordAddressPath === "m"
      ? masterNode
      : masterNode.derive(ordAddressPath);
  const ordPk = ordPrivKey.privKey.toWif();

  let identityPk: string | undefined;
  if (paths.identityAddressPath) {
    const identityPrivKey = paths.identityAddressPath
      ? masterNode.derive(`m/${paths.identityAddressPath}`)
      : null;
    identityPk = identityPrivKey ? identityPrivKey.privKey.toWif() : undefined;
  }

  const keys: Keys = {
    mnemonic,
    payPk,
    ordPk,
    changeAddressPath: paths.changeAddressPath,
    ordAddressPath: paths.ordAddressPath,
  };

  if (identityPk) {
    keys.identityPk = identityPk;
    keys.identityAddressPath = paths.identityAddressPath;
  }

  return keys;
};

export const findKeysFromMnemonic = async (mnemonic: string) => {
  return new Promise<Keys>((resolve, reject) => {
    const seed = Mnemonic.fromString(mnemonic).toSeed();
    const masterNode = HD.fromSeed(seed);

    const payPrivKey = masterNode.derive("m/0");
    const payPk = payPrivKey.privKey.toWif();

    let ordPk: string | undefined;
    let ordPrivKey: HD;
    let ordAddress: string | undefined;

    const timeoutMs = 100000;
    const ts = Date.now();
    let found = false;

    const searchForAddress = (i: number) => {
      // console.log(`Searching for ord address with child key ${i}.`);
      if (Date.now() - ts > timeoutMs && !found) {
        reject(
          new Error("Timeout while searching for the desired address prefix."),
        );
        return;
      }

      ordPrivKey = masterNode.derive(`m/${i}`);
      ordAddress = ordPrivKey.privKey.toAddress();

      if (ordAddress?.startsWith("1s")) {
        ordPk = ordPrivKey.privKey.toWif();
        found = true;
        console.log(`Ord address found! Using child key ${i} for ordinals.`);

        if (ordPk) {
          resolve({
            mnemonic,
            payPk,
            ordPk,
            changeAddressPath: 0,
            ordAddressPath: i,
          } as Keys);
        }

        return;
      }
      setTimeout(() => searchForAddress(i + 1), 0);
    };

    if (!found) {
      searchForAddress(1);
    }
  });
};
