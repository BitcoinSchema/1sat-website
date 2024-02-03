import { toastErrorProps } from "@/constants";
import { payPk, pendingTxs } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { PendingTransaction } from "@/types/preview";
import { PrivateKey } from "bsv-wasm-web";
import { Payment, RemoteSigner, Utxo, createOrdinal } from "js-1sat-ord";
import toast from "react-hot-toast";
import { readFileAsBase64 } from "./file";

export const handleInscribing = async (
  payPk: string,
  fileAsBase64: string,
  fileContentType: string,
  ordAddress: string,
  changeAddress: string,
  fundingUtxo: Utxo,
  metadata?: any, // MAP,
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
      fundingUtxo,
      ordAddress,
      paymentPk,
      changeAddress,
      0.05,
      inscription,
      metadata, // optional metadata
      undefined,
      payments,
    );
    return tx;
  } catch (e) {
    throw e;
  }
};

export const inscribeFile = (
  async (utxo: Utxo, file: File, metadata?: any) => {
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
  }
);


export const inscribeUtf8 =  async (text: string, contentType: string, utxo: Utxo, iterations = 1, payments: Payment[] = []) => {
  const fileAsBase64 = Buffer.from(text).toString("base64");
  const tx = await handleInscribing(
    payPk.value!,
    fileAsBase64,
    contentType,
    ordAddress.value!,
    fundingAddress.value!,
    utxo,
    undefined,
    payments
  );

  const result = {
    rawTx: tx.to_hex(),
    size: tx.get_size(),
    fee: utxo!.satoshis - Number(tx.satoshis_out()),
    numInputs: tx.get_ninputs(),
    numOutputs: tx.get_noutputs(),
    txid: tx.get_id_hex(),
    inputTxid: tx.get_input(0)!.get_prev_tx_id_hex(),
    iterations,
  } as PendingTransaction;
  pendingTxs.value = [result];
  return result;
}

