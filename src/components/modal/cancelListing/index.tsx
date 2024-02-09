import { API_HOST, indexerBuyFee, toastProps } from "@/constants";
import {
  bsvWasmReady,
  ordPk,
  payPk,
  pendingTxs,
  utxos,
} from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { Listing } from "@/types/bsv20";
import { PendingTransaction } from "@/types/preview";
import * as http from "@/utils/httpClient";
import {
  P2PKHAddress,
  PrivateKey,
  Script,
  SigHash,
  Transaction,
  TxIn,
  TxOut,
} from "bsv-wasm-web";
import { Utxo, buildInscription } from "js-1sat-ord";
import toast from "react-hot-toast";
import { calculateFee } from "../buyArtifact";

interface CancelListingModalProps {
  onClose: () => void;
  listing: Listing;
  indexerAddress: string;
  className?: string;
}

const CancelListingModal: React.FC<CancelListingModalProps> = ({
  onClose,
  listing,
  indexerAddress,
  className,
}) => {
  const cancelListing = async (e: any) => {
    if (!bsvWasmReady.value) {
      console.log("bsv wasm not ready");
      return;
    }
    e.preventDefault();
    console.log("cancel listing");
    if (!utxos || !payPk || !ordPk || !fundingAddress || !ordAddress) {
      return;
    }

    const cancelTx = new Transaction(1, 0);

    const cancelInput = new TxIn(
      Buffer.from(listing.txid, "hex"),
      listing.vout,
      Script.from_asm_string("")
    );
    cancelTx.add_input(cancelInput);
    const ordinalsAddress = P2PKHAddress.from_string(ordAddress.value!);

    // add inscription
    // output 0 - purchasing the ordinal
    const inscription = {
      p: "bsv-20",
      op: "transfer",
      amt: (listing as Listing).amt,
    } as any;

    if ((listing as Listing).tick) {
      inscription.tick = (listing as Listing).tick;
    } else if ((listing as Listing).id) {
      inscription.id = (listing as Listing).id;
    } else {
      throw new Error("Invalid BSV20 listing");
    }
    const inscriptionB64 = Buffer.from(JSON.stringify(inscription)).toString(
      "base64"
    );
    // build an inscription output for the token transfer
    const inscriptionScript = buildInscription(
      ordinalsAddress,
      inscriptionB64,
      "application/bsv-20"
    );

    const transferOut = new TxOut(BigInt(1), inscriptionScript);

    cancelTx.add_output(transferOut);

    const changeAddress = P2PKHAddress.from_string(fundingAddress.value!);

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
    let paymentUtxos: Utxo[] = [];
    let satsCollected = 0;
    // initialize fee and satsNeeded (updated with each added payment utxo)
    let fee = calculateFee(1, cancelTx);
    let satsNeeded = fee;
    // collect the required utxos
    const sortedFundingUtxos = utxos.value!.sort((a, b) =>
      a.satoshis > b.satoshis ? -1 : 1
    );
    for (let utxo of sortedFundingUtxos) {
      if (satsCollected < satsNeeded) {
        satsCollected += utxo.satoshis;
        paymentUtxos.push(utxo);

        // if we had to add additional
        fee = calculateFee(paymentUtxos.length, cancelTx);
        satsNeeded = fee + indexerBuyFee;
      }
    }

    // add payment utxos to the tx
    for (let u of paymentUtxos) {
      const inx = new TxIn(
        Buffer.from(u.txid, "hex"),
        u.vout,
        Script.from_asm_string("")
      );
      inx.set_satoshis(BigInt(u.satoshis));
      cancelTx.add_input(inx);
    }

    // Replace dummy change output
    const changeAmt = satsCollected - satsNeeded;

    const changeOutput = new TxOut(
      BigInt(changeAmt),
      changeAddress.get_locking_script()
    );

    cancelTx.set_output(1, changeOutput);

    // sign the cancel input
    const sig = cancelTx.sign(
      PrivateKey.from_wif(ordPk.value!),
      SigHash.InputOutputs,
      0,
      Script.from_bytes(Buffer.from(listing.script, "base64")),
      BigInt(1)
    );

    cancelInput.set_unlocking_script(
      Script.from_asm_string(
        `${sig.to_hex()} ${PrivateKey.from_wif(ordPk.value!).to_public_key().to_hex()} OP_1`
      )
    );

    cancelTx.set_input(0, cancelInput);

    // sign the funding inputs
    let idx = 1;
    for (let u of paymentUtxos) {
      const inx = cancelTx.get_input(idx)!;
      const sig = cancelTx.sign(
        PrivateKey.from_wif(payPk.value!),
        SigHash.InputOutputs,
        idx,
        Script.from_asm_string(u.script),
        BigInt(u.satoshis)
      );

      inx.set_unlocking_script(
        Script.from_asm_string(
          `${sig.to_hex()} ${PrivateKey.from_wif(payPk.value!).to_public_key().to_hex()!}`
        )
      );

      cancelTx.set_input(idx, inx);
      idx++;
    }

    const pendingTx = {
      rawTx: cancelTx.to_hex(),
      txid: cancelTx.get_id_hex(),
    } as PendingTransaction;
    pendingTxs.value = [pendingTx];
    console.log("pending tx", pendingTx);
    await broadcast(pendingTx);
    onClose();
  };

  

  return (
    // <div className={`w-full max-w-3xl mx-auto ${className ? className : ""}`}>
    //   <div className="text-3xl font-bold mb-4">Cancel Listing</div>
    //   <div className="text-lg mb-4">
    //     Are you sure you want to cancel the listing for {listing.tick}?
    //   </div>
    //   <div className="flex justify-end">
    //     <button
    //       onClick={onClose}
    //       className="rounded-md bg-gray-200 text-gray-800 px-4 py-2 mr-2"
    //     >
    //       Cancel
    //     </button>
    //     <button
    //       onClick={() => {
    //         console.log("cancel listing");
    //       }}
    //       className="rounded-md bg-red-500 text-white px-4 py-2"
    //     >
    //       Cancel Listing
    //     </button>
    //   </div>
    // </div>
    <dialog id={`cancel-listing-modal-${listing.tick}`} className="modal" open>
      <div className="modal-box">
        <h3 className="font-bold text-lg">Cancel Listing</h3>
        <p className="py-4">
          Are you sure you want to cancel the listing for{" "}
          {listing.tick || listing.sym}?
        </p>
        <form method="dialog">
          <div className="modal-action">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn">Close</button>
            <button className="btn btn-error" onClick={cancelListing}>
              Cancel Listing
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};

export default CancelListingModal;

export const broadcast = async ({ rawTx, txid }: Partial<PendingTransaction>) => {
  if (!rawTx || !txid) {
    return;
  }
  const rawtx = Buffer.from(rawTx, "hex").toString("base64");
  const { promise } = http.customFetch<any>(`${API_HOST}/api/tx`, {
    method: "POST",
    body: JSON.stringify({
      rawtx,
    }),
  });
  await promise;

  toast.success("Transaction broadcasted.", toastProps);
  pendingTxs.value = pendingTxs.value?.filter((t) => t.txid !== txid) || [];
};