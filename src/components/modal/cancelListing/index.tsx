"use client";

import { API_HOST, indexerBuyFee, toastErrorProps, toastProps } from "@/constants";
import {
  bsvWasmReady,
  ordPk,
  payPk,
  pendingTxs,
  utxos,
} from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { Listing } from "@/types/bsv20";
import type { PendingTransaction } from "@/types/preview";
import { getUtxos } from "@/utils/address";
import * as http from "@/utils/httpClient";
import type { Utxo } from "@/utils/js-1sat-ord";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import {
  P2PKHAddress,
  PrivateKey,
  Script,
  SigHash,
  Transaction,
  TxIn,
  TxOut,
} from "bsv-wasm-web";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { calculateFee } from "../buyArtifact";
import { buildInscriptionSafe } from "../transferBsv20";
import { setPendingTxs } from "@/signals/wallet/client";

interface CancelListingModalProps {
  onClose: () => void;
  onCancelled: (newOutpoiint: string) => void;
  listing: Listing;
  indexerAddress?: string;
  className?: string;
}

const CancelListingModal: React.FC<CancelListingModalProps> = ({
  onClose,
  onCancelled,
  listing,
  indexerAddress,
  className,
}) => {
  useSignals();
  const cancelling = useSignal(false);

  const cancelBsv20Listing = useCallback(async (e: React.MouseEvent) => {
    if (!bsvWasmReady.value) {
      console.log("bsv wasm not ready");
      return;
    }

    if (!fundingAddress.value) {
      console.log("funding address not set");
      return;
    }
    cancelling.value = true;
    await getUtxos(fundingAddress.value);

    e.preventDefault();
    console.log("cancel bsv20 listing");
    if (!utxos.value || !payPk.value || !ordPk.value || !ordAddress.value || !indexerAddress) {
      cancelling.value = false;
      return;
    }

    const cancelTx = new Transaction(1, 0);
    const cancelInput = new TxIn(
      Buffer.from(listing.txid, "hex"),
      listing.vout,
      Script.from_asm_string("")
    );
    cancelTx.add_input(cancelInput);
    const ordinalsAddress = P2PKHAddress.from_string(ordAddress.value);

    // add inscription
    // output 0 - purchasing the ordinal
    const inscription = {
      p: "bsv-20",
      op: "transfer",
      amt: (listing as Listing).amt,
    } as {
      p: string;
      op: string;
      amt: string;
      tick?: string;
      id?: string;
    };

    if ((listing as Listing).tick) {
      inscription.tick = (listing as Listing).tick;
    } else if ((listing as Listing).id) {
      inscription.id = (listing as Listing).id;
    } else {
      cancelling.value = false;
      throw new Error("Invalid BSV20 listing");
    }
    const inscriptionB64 = Buffer.from(
      JSON.stringify(inscription)
    ).toString("base64");
    // build an inscription output for the token transfer
    const inscriptionScript = buildInscriptionSafe(
      ordinalsAddress,
      inscriptionB64,
      "application/bsv-20"
    );

    const transferOut = new TxOut(BigInt(1), inscriptionScript);

    cancelTx.add_output(transferOut);

    const changeAddress = P2PKHAddress.from_string(fundingAddress.value);

    // dummy outputs - change
    const dummyChangeOutput = new TxOut(
      BigInt(0),
      changeAddress.get_locking_script()
    );
    cancelTx.add_output(dummyChangeOutput);

    // output 1 indexer fee
    if (indexerAddress) {
      const indexerFeeOutput = new TxOut(
        BigInt(indexerBuyFee),
        P2PKHAddress.from_string(indexerAddress).get_locking_script()
      );
      cancelTx.add_output(indexerFeeOutput);
    }

    // Calculate the network fee
    // account for funding input and market output (not added to tx yet)
    const paymentUtxos: Utxo[] = [];
    let satsCollected = 0;
    // initialize fee and satsNeeded (updated with each added payment utxo)
    let fee = calculateFee(1, cancelTx);
    let satsNeeded = fee;
    // collect the required utxos
    const sortedFundingUtxos = utxos.value.sort((a, b) =>
      a.satoshis > b.satoshis ? -1 : 1
    );
    for (const utxo of sortedFundingUtxos) {
      if (satsCollected < satsNeeded) {
        satsCollected += utxo.satoshis;
        paymentUtxos.push(utxo);

        // if we had to add additional
        fee = calculateFee(paymentUtxos.length, cancelTx);
        satsNeeded = fee + BigInt(indexerBuyFee);
      }
    }

    // add payment utxos to the tx
    for (const u of paymentUtxos) {
      const inx = new TxIn(
        Buffer.from(u.txid, "hex"),
        u.vout,
        Script.from_asm_string("")
      );
      inx.set_satoshis(BigInt(u.satoshis));
      cancelTx.add_input(inx);
    }

    // Replace dummy change output
    const changeAmt = BigInt(satsCollected) - satsNeeded;

    const changeOutput = new TxOut(
      BigInt(changeAmt),
      changeAddress.get_locking_script()
    );

    cancelTx.set_output(1, changeOutput);

    // sign the cancel input
    const sig = cancelTx.sign(
      PrivateKey.from_wif(ordPk.value),
      SigHash.InputOutputs,
      0,
      Script.from_bytes(Buffer.from(listing.script, "base64")),
      BigInt(1)
    );

    cancelInput.set_unlocking_script(
      Script.from_asm_string(
        `${sig.to_hex()} ${PrivateKey.from_wif(ordPk.value)
          .to_public_key()
          .to_hex()} OP_1`
      )
    );

    cancelTx.set_input(0, cancelInput);

    // sign the funding inputs
    let idx = 1;
    for (const u of paymentUtxos) {

      const inx = cancelTx.get_input(idx);
      if (!inx) {
        cancelling.value = false;
        return;
      }

      const sig = cancelTx.sign(
        PrivateKey.from_wif(payPk.value),
        SigHash.InputOutputs,
        idx,
        Script.from_asm_string(u.script),
        BigInt(u.satoshis)
      );

      inx.set_unlocking_script(
        Script.from_asm_string(
          `${sig.to_hex()} ${PrivateKey.from_wif(payPk.value)
            .to_public_key()
            .to_hex()}`
        )
      );

      cancelTx.set_input(idx, inx);
      idx++;
    }

    const pendingTx = {
      rawTx: cancelTx.to_hex(),
      txid: cancelTx.get_id_hex(),
    } as PendingTransaction;
    setPendingTxs([pendingTx]);

    console.log("pending tx", pendingTx);
    await broadcast(pendingTx);
    cancelling.value = false;
    const newOutpoint = `${pendingTx.txid}_0`;
    onCancelled(newOutpoint);
  }, [bsvWasmReady.value, fundingAddress.value, cancelling, utxos.value, payPk.value, ordPk.value, ordAddress.value, indexerAddress, listing, onCancelled]);

  const cancelListing = useCallback(async (e: React.MouseEvent) => {
    if (!bsvWasmReady.value) {
      console.log("bsv wasm not ready");
      return;
    }

    if (!fundingAddress.value) {
      console.log("funding address not set");
      return;
    }
    cancelling.value = true;

    await getUtxos(fundingAddress.value);

    e.preventDefault();
    console.log("cancel listing");
    if (!utxos.value || !payPk.value || !ordPk.value || !ordAddress.value) {
      cancelling.value = false;
      return;
    }

    const cancelTx = new Transaction(1, 0);

    if (listing.id || listing.tick) {
      cancelling.value = false;
      throw new Error("BSV20 listing!");
    }

    const cancelInput = new TxIn(
      Buffer.from(listing.txid, "hex"),
      listing.vout,
      Script.from_asm_string("")
    );
    cancelTx.add_input(cancelInput);
    const ordinalsAddress = P2PKHAddress.from_string(ordAddress.value);

    const satOutScript = ordinalsAddress.get_locking_script();
    const transferOut = new TxOut(BigInt(1), satOutScript);

    cancelTx.add_output(transferOut);

    const changeAddress = P2PKHAddress.from_string(fundingAddress.value);

    // dummy outputs - change
    const dummyChangeOutput = new TxOut(
      BigInt(0),
      changeAddress.get_locking_script()
    );
    cancelTx.add_output(dummyChangeOutput);

    // Calculate the network fee
    // account for funding input and market output (not added to tx yet)
    const paymentUtxos: Utxo[] = [];
    let satsCollected = 0;
    // initialize fee and satsNeeded (updated with each added payment utxo)
    let fee = calculateFee(1, cancelTx);
    let satsNeeded = fee;
    // collect the required utxos
    const sortedFundingUtxos = utxos.value.sort((a, b) =>
      a.satoshis > b.satoshis ? -1 : 1
    );
    for (const utxo of sortedFundingUtxos) {
      if (satsCollected < satsNeeded) {
        satsCollected += utxo.satoshis;
        paymentUtxos.push(utxo);

        // if we had to add additional
        fee = calculateFee(paymentUtxos.length, cancelTx);
        satsNeeded = fee + BigInt(indexerBuyFee);
      }
    }

    // add payment utxos to the tx
    for (const u of paymentUtxos) {
      const inx = new TxIn(
        Buffer.from(u.txid, "hex"),
        u.vout,
        Script.from_asm_string("")
      );
      inx.set_satoshis(BigInt(u.satoshis));
      cancelTx.add_input(inx);
    }

    // Replace dummy change output
    const changeAmt = BigInt(satsCollected) - satsNeeded;

    const changeOutput = new TxOut(
      BigInt(changeAmt),
      changeAddress.get_locking_script()
    );

    cancelTx.set_output(1, changeOutput);

    // sign the cancel input
    const sig = cancelTx.sign(
      PrivateKey.from_wif(ordPk.value),
      SigHash.InputOutputs,
      0,
      Script.from_bytes(Buffer.from(listing.script, "base64")),
      BigInt(1)
    );

    cancelInput.set_unlocking_script(
      Script.from_asm_string(
        `${sig.to_hex()} ${PrivateKey.from_wif(ordPk.value)
          .to_public_key()
          .to_hex()} OP_1`
      )
    );

    cancelTx.set_input(0, cancelInput);

    // sign the funding inputs
    let idx = 1;
    for (const u of paymentUtxos) {
      const inx = cancelTx.get_input(idx);

      if (!inx) {
        cancelling.value = false;
        return;
      }

      const sig = cancelTx.sign(
        PrivateKey.from_wif(payPk.value),
        SigHash.InputOutputs,
        idx,
        Script.from_asm_string(u.script),
        BigInt(u.satoshis)
      );

      inx.set_unlocking_script(
        Script.from_asm_string(
          `${sig.to_hex()} ${PrivateKey.from_wif(payPk.value)
            .to_public_key()
            .to_hex()}`
        )
      );

      cancelTx.set_input(idx, inx);
      idx++;
    }

    const pendingTx = {
      rawTx: cancelTx.to_hex(),
      txid: cancelTx.get_id_hex(),
    } as PendingTransaction;

    setPendingTxs([pendingTx]);
    console.log("pending tx", pendingTx);
    await broadcast(pendingTx);
    setPendingTxs(pendingTxs.value?.filter((t) => t.txid !== listing.txid) || []);
    toast.success("Listing canceled.", toastProps);
    cancelling.value = false;
    const newOutpoint = `${pendingTx.txid}_0`;
    onCancelled(newOutpoint);
  }, [bsvWasmReady.value, fundingAddress.value, cancelling, utxos.value, payPk.value, ordPk.value, ordAddress.value, listing, pendingTxs.value, onCancelled]);

  return (
    <dialog
      id={`cancel-listing-modal-${listing.tick}`}
      className="modal"
      open
    >
      <div className="modal-box">
        <h3 className="font-bold text-lg">Cancel Listing</h3>
        <p className="py-4">
          Are you sure you want to cancel the listing for{" "}
          {listing.tick || listing.sym || "this ordinal"}?
        </p>
        <form method="dialog">
          <div className="modal-action">
            {/* if there is a button in form, it will close the modal */}
            <button type="button" className="btn" onClick={onClose}>
              Close
            </button>
            {listing && <button
              type="button"
              disabled={cancelling.value}
              className="btn btn-error disabled:btn-disabled"
              onClick={async (e) => {
                if (listing.tick || listing.id) {
                  console.log("Cancel BSV20", { listing });
                  await cancelBsv20Listing(e);
                } else if (!listing.data?.bsv20 && !listing.origin?.data?.bsv20) {
                  console.log("Cancel Non BSV20 Listing", { listing });
                  await cancelListing(e);
                } else {
                  console.log("invalid listing", listing);
                  toast.error(`Something went wrong ${listing.outpoint}`, toastErrorProps);
                }
              }}
            >
              Cancel Listing
            </button>}
          </div>
        </form>
      </div>
    </dialog>
  );
};

export default CancelListingModal;

export const broadcast = async ({
  rawTx,
  txid,
}: Partial<PendingTransaction>) => {
  if (!rawTx || !txid) {
    return;
  }
  const rawtx = Buffer.from(rawTx, "hex").toString("base64");
  try {

    const { promise } = http.customFetch(`${API_HOST}/api/tx`, {
      method: "POST",
      body: JSON.stringify({
        rawtx,
      }),
    });
    await promise;
    
    toast.success("Transaction broadcasted.", toastProps);
    setPendingTxs(pendingTxs.value?.filter((t) => t.txid !== txid) || []);
   } catch (e) {
    console.error(e);
    toast.error("Error broadcasting transaction.", toastErrorProps);
  } 
};
