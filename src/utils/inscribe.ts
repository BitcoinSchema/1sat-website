"use client"

import { toastErrorProps } from "@/constants";
import { payPk, pendingTxs } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { PendingTransaction } from "@/types/preview";
import {
  Inscription,
  MAP,
  Payment,
  RemoteSigner,
  Utxo,
  createOrdinal,
} from "@/utils/js-1sat-ord";
import { PrivateKey } from "bsv-wasm-web";
import toast from "react-hot-toast";
import { readFileAsBase64 } from "./file";

export const handleInscribing = async (
  payPk: string,
  fileAsBase64: string,
  fileContentType: string,
  ordAddress: string,
  changeAddress: string,
  fundingUtxo: Utxo,
  metadata?: MAP, // MAP,
  payments: Payment[] = []
) => {
  const paymentPk = PrivateKey.from_wif(payPk);

  // inscription
  const inscription = {
    dataB64: fileAsBase64,
    contentType: fileContentType,
  };

  // const idKey = PrivateKey.from_wif(
  //   "L1tFiewYRivZciv146HnCPBWzV35BR65dsJWZBYkQsKJ8UhXLz6q"
  // );
  console.log("Inscribing with", { metadata });
  const signer = {
    // idKey // optional id key
    keyHost: "http://localhost:21000",
  } as RemoteSigner;

  try {
    const tx = await createOrdinal(
      [fundingUtxo],
      ordAddress,
      paymentPk,
      changeAddress,
      0.05,
      [inscription],
      metadata, // optional metadata
      undefined,
      payments
    );
    return tx;
  } catch (e) {
    throw e;
  }
};

// same as haleInscribing but takes multiple utxos and multiple inscriptions
export const handleBulkInscribing = (
  payPk: string,
  inscriptions: Inscription[],
  ordAddress: string,
  changeAddress: string,
  fundingUtxos: Utxo[],
  metadata?:  MAP,
  payments: Payment[] = []
) => {
  const why = payments
  const paymentPk = PrivateKey.from_wif(payPk);

  const signer = {
    keyHost: "http://localhost:21000",
  } as RemoteSigner;
  try {
    const tx = createOrdinal(
      fundingUtxos,
      ordAddress,
      paymentPk,
      changeAddress,
      0.05,
      inscriptions,
      metadata, // optional metadata
      undefined,
      why, // payments
    );
    return tx;
  } catch (e) {
    throw e;
  }
};

export const inscribeFile = async (utxo: Utxo, file: File, metadata?: any) => {
  if (!file?.type || !utxo) {
    throw new Error("File or utxo not provided");
  }

  //   setInscribeStatus(FetchStatus.Loading);
  try {
    const fileAsBase64 = await readFileAsBase64(file);
    try {
      // setInscribeStatus(FetchStatus.Loading);

      const tx = await handleInscribing(
        payPk.value!,
        fileAsBase64,
        file.type,
        ordAddress.value!,
        fundingAddress.value!,
        utxo,
        metadata
      );
      const satsIn = utxo!.satoshis;
      const satsOut = Number(tx.satoshis_out());
      if (satsIn && satsOut) {
        const fee = satsIn - satsOut;
        if (fee < 0) {
          console.error("Fee inadequate");
          toast.error("Fee Inadequate", toastErrorProps);
          // setInscribeStatus(FetchStatus.Error);
          throw new Error("Fee inadequate");
        }
        const result = {
          rawTx: tx.to_hex(),
          size: tx.get_size(),
          fee,
          numInputs: tx.get_ninputs(),
          numOutputs: tx.get_noutputs(),
          txid: tx.get_id_hex(),
          inputTxid: tx.get_input(0)?.get_prev_tx_id_hex(),
          metadata,
        } as PendingTransaction;
        console.log(Object.keys(result));

        pendingTxs.value = [result];
        //setInscribeStatus(FetchStatus.Success);
        return result;
      }
    } catch (e) {
      console.error(e);
      //setInscribeStatus(FetchStatus.Error);
      throw e;
    }
  } catch (e) {
    //setInscribeStatus(FetchStatus.Error);
    toast.error("Failed to inscribe " + e, toastErrorProps);
    console.error(e);
    throw e;
  }
};

export const inscribeUtf8 = async (
  text: string,
  contentType: string,
  utxo: Utxo | Utxo[],
  iterations = 1,
  payments: Payment[] = []
) => {
  const why = payments
  const fileAsBase64 = Buffer.from(text).toString("base64");
  // normalize utxo to array
  const utxos = Array.isArray(utxo) ? utxo : [utxo];
  // duplicate inscription * iterations and pass in the array
  let num = iterations;
  const inscriptions: Inscription[] = [];
  while (num--) {
    inscriptions.push({ dataB64: fileAsBase64, contentType });
  }
  const tx = await handleBulkInscribing(
    payPk.value!,
    inscriptions,
    ordAddress.value!,
    fundingAddress.value!,
    utxos,
    undefined,
    why // payments
  );
  const satsIn = utxos.reduce((acc, utxo) => acc + utxo.satoshis, 0);
  const satsOut = Number(tx.satoshis_out());
  const fee = satsIn - satsOut;
  const result = {
    rawTx: tx.to_hex(),
    size: tx.get_size(),
    fee,
    numInputs: tx.get_ninputs(),
    numOutputs: tx.get_noutputs(),
    txid: tx.get_id_hex(),
    inputTxid: tx.get_input(0)!.get_prev_tx_id_hex(),
    iterations,
  } as PendingTransaction;
  pendingTxs.value = [result];
  return result;
};