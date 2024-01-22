"use client";

import { ordAddress } from "@/signals/wallet/address";
import { setPendingTxs } from "@/signals/wallet/client";
import { Listing } from "@/types/bsv20";
import { OrdUtxo } from "@/types/ordinals";
// import { useOrdinals } from "@/context/ordinals";
import { useSignals } from "@preact/signals-react/runtime";
import { P2PKHAddress, Script, Transaction, TxIn, TxOut } from "bsv-wasm-web";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { IoMdWarning } from "react-icons/io";
import { toBitcoin } from "satoshi-bitcoin-ts";

interface BuyArtifactModalProps {
  onClose: () => void;
  listing: OrdUtxo | Listing;
  price: number;
  content: React.ReactNode;
  showLicense: boolean;
}

const BuyArtifactModal: React.FC<BuyArtifactModalProps> = ({
  onClose,
  listing,
  price,
  content,
  showLicense,
}) => {
  // const { buyArtifact } = useOrdinals();
  useSignals();
  const router = useRouter();

  const buyArtifact = useCallback(() => {

    // create a transaction that will purchase the artifact, once funded
    const purchaseTx = new Transaction(1, 0);

    const listingInput = new TxIn(
      Buffer.from(listing.txid, "hex"),
      listing.vout,
      Script.from_asm_string("")
    );
    purchaseTx.add_input(listingInput);

     // output 0
     const buyerOutput = new TxOut(
      BigInt(1),
      P2PKHAddress.from_string(ordAddress.value!).get_locking_script()
    );
    purchaseTx.add_output(buyerOutput);

    const ordPayout = (listing as OrdUtxo).data?.list?.payout;
    const listingPayout = (listing as Listing).payout;
    
    // output 1
    const payOutput = TxOut.from_hex(
      Buffer.from(listingPayout || ordPayout!, "base64").toString("hex")
    );
    purchaseTx.add_output(payOutput);
  
    setPendingTxs([{ 
      rawTx: purchaseTx.to_hex(),
      txid: purchaseTx.get_id_hex(),
      size: purchaseTx.get_size(),
      fee: 100,
      numInputs: purchaseTx.get_ninputs(),
      numOutputs: purchaseTx.get_noutputs(),
      inputTxid: listing.txid,
    }]);

    // TODO: Finish porting this

    onClose();
    router.push("/preview");
  }, [listing, onClose, router]);

  return (
    <div
      className="z-10 flex items-center justify-center fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 overflow-hidden"
      onClick={() => onClose()}
    >
      <div
        className="w-full max-w-lg m-auto p-4 bg-[#111] text-[#aaa] rounded flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-64 md:h-96 overflow-hidden modal-content">
          {content}
        </div>
        {showLicense && <div className="rounded mb-4 p-2 text-xs text-[#777]">
          <h1>License</h1>
          <IoMdWarning className="inline-block mr-2" />
          You are about to purchase this inscription, granting you ownership and
          control of the associated token. This purchase does not include a
          license to any artwork or IP that may be depicted here and no rights
          are transferred to the purchaser unless specified explicitly within
          the transaction itself.
        </div>}
        <form onSubmit={buyArtifact} className="modal-action">
          <button className="bg-[#222] p-2 rounded cusros-pointer hover:bg-emerald-600 text-white">
            Buy - {price && price > 0 ? toBitcoin(price) : 0} BSV
          </button>
        </form>
      </div>
    </div>
  );
};

export default BuyArtifactModal;
