"use client";

import { payPk, utxos } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { setPendingTxs } from "@/signals/wallet/client";
import { Listing } from "@/types/bsv20";
import { OrdUtxo } from "@/types/ordinals";
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
import { Utxo, buildInscription } from "js-1sat-ord";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { IoMdWarning } from "react-icons/io";
import { toBitcoin } from "satoshi-bitcoin-ts";
interface BuyArtifactModalProps {
  onClose: () => void;
  listing: Listing | OrdUtxo;
  price: number;
  content: React.ReactNode;
  showLicense: boolean;
  indexerAddress?: string;
}

const BuyArtifactModal: React.FC<BuyArtifactModalProps> = ({
  onClose,
  listing,
  price,
  content,
  showLicense,
  indexerAddress,
}: BuyArtifactModalProps) => {
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

    // output 0 - purchasing the ordinal
    const buyerOutput = new TxOut(
      BigInt(1),
      P2PKHAddress.from_string(ordAddress.value!).get_locking_script()
    );
    purchaseTx.add_output(buyerOutput);

    const ordPayout = (listing as OrdUtxo).data?.list?.payout;
    const listingPayout = (listing as Listing).payout;
    const listingScript = (listing as Listing).script;

    // output 1
    const payOutput = TxOut.from_hex(
      Buffer.from(listingPayout || ordPayout!, "base64").toString("hex")
    );
    purchaseTx.add_output(payOutput);

    const changeAddress = P2PKHAddress.from_string(fundingAddress.value!);
    const ordinalsAddress = P2PKHAddress.from_string(ordAddress.value!);

    const isBsv20Listing = (listing as Listing).tick !== undefined;

    // dummy outputs - change
    const dummyChangeOutput = new TxOut(
      BigInt(0),
      changeAddress.get_locking_script()
    );
    purchaseTx.add_output(dummyChangeOutput);

    // output 3 - marketFee
    const dummyMarketFeeOutput = new TxOut(
      BigInt(0),
      P2PKHAddress.from_string(marketAddress).get_locking_script()
    );
    purchaseTx.add_output(dummyMarketFeeOutput);

    // OMFG this has to be "InputOutput" and then second time is InputOutputs
    let preimage = purchaseTx.sighash_preimage(
      SigHash.InputOutput,
      0,
      Script.from_bytes(Buffer.from(listingScript, "base64")),
      BigInt(1) //TODO: use amount from listing
    );

    listingInput.set_unlocking_script(
      Script.from_asm_string(
        `${purchaseTx.get_output(0)!.to_hex()} ${purchaseTx
          .get_output(2)!
          .to_hex()}${purchaseTx.get_output(3)!.to_hex()} ${Buffer.from(
          preimage
        ).toString("hex")} OP_0`
      )
    );
    purchaseTx.set_input(0, listingInput);

    // calculate market fee
    let marketFee = price * marketRate;
    if (marketFee === 0) {
      marketFee = minimumMarketFee;
    }

    // Calculate the network fee
    // account for funding input and market output (not added to tx yet)
    let paymentUtxos: Utxo[] = [];
    let satsCollected = 0;
    // initialize fee and satsNeeded (updated with each added payment utxo)
    let fee = calculateFee(1, purchaseTx);
    let satsNeeded = fee + price + marketFee;
    // collect the required utxos
    const sortedFundingUtxos = utxos.value!.sort((a, b) =>
      a.satoshis > b.satoshis ? -1 : 1
    );
    for (let utxo of sortedFundingUtxos) {
      if (satsCollected < satsNeeded) {
        satsCollected += utxo.satoshis;
        paymentUtxos.push(utxo);

        // if we had to add additional
        fee = calculateFee(paymentUtxos.length, purchaseTx);
        satsNeeded = fee + price + marketFee;
      }
    }

    // Replace dummy change output
    const changeAmt = satsCollected - satsNeeded;

    const changeOutput = new TxOut(
      BigInt(changeAmt),
      changeAddress.get_locking_script()
    );

    purchaseTx.set_output(2, changeOutput);

    setPendingTxs([
      {
        rawTx: purchaseTx.to_hex(),
        txid: purchaseTx.get_id_hex(),
        size: purchaseTx.get_size(),
        fee: 100,
        numInputs: purchaseTx.get_ninputs(),
        numOutputs: purchaseTx.get_noutputs(),
        inputTxid: listing.txid,
      },
    ]);

    // TODO: Finish porting this

    onClose();
    router.push("/preview");
  }, [listing, onClose, price, router]);

  const buyBsv20 = useCallback(() => {
    // create a transaction that will purchase the artifact, once funded
    const purchaseTx = new Transaction(1, 0);

    const listingInput = new TxIn(
      Buffer.from(listing.txid, "hex"),
      listing.vout,
      Script.from_asm_string("")
    );
    purchaseTx.add_input(listingInput);
    const ordinalsAddress = P2PKHAddress.from_string(ordAddress.value!);

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

    const buyerOutput = new TxOut(BigInt(1), inscriptionScript);

    purchaseTx.add_output(buyerOutput);

    const ordPayout = (listing as OrdUtxo).data?.list?.payout;
    const listingPayout = (listing as Listing).payout;
    const listingScript = (listing as Listing).script;

    // output 1
    const payOutput = TxOut.from_hex(
      Buffer.from(listingPayout || ordPayout!, "base64").toString("hex")
    );
    purchaseTx.add_output(payOutput);

    const changeAddress = P2PKHAddress.from_string(fundingAddress.value!);

    // dummy outputs - change
    const dummyChangeOutput = new TxOut(
      BigInt(0),
      changeAddress.get_locking_script()
    );
    purchaseTx.add_output(dummyChangeOutput);

    // output 3 - marketFee
    // calculate market fee
    let marketFee = price * marketRate;
    if (marketFee === 0) {
      marketFee = minimumMarketFee;
    }
    const marketFeeOutput = new TxOut(
      BigInt(marketFee),
      P2PKHAddress.from_string(marketAddress).get_locking_script()
    );
    purchaseTx.add_output(marketFeeOutput);

    // output 4 indexer fee
    if (indexerAddress) {
      const indexerFeeOutput = new TxOut(
        BigInt(indexerBuyFee),
        P2PKHAddress.from_string(indexerAddress).get_locking_script()
      );
      purchaseTx.add_output(indexerFeeOutput);
    }

    // this has to be "InputOutput" and then second time is InputOutputs
    let preimage = purchaseTx.sighash_preimage(
      SigHash.InputOutput,
      0,
      Script.from_bytes(Buffer.from(listingScript, "base64")),
      BigInt(1) //TODO: use amount from listing
    );

    listingInput.set_unlocking_script(
      Script.from_asm_string(
        `${purchaseTx.get_output(0)!.to_hex()} ${purchaseTx
          .get_output(2)!
          .to_hex()}${purchaseTx.get_output(3)!.to_hex()}${purchaseTx
          .get_output(4)!
          .to_hex()} ${Buffer.from(preimage).toString("hex")} OP_0`
      )
    );
    purchaseTx.set_input(0, listingInput);

    // Calculate the network fee
    // account for funding input and market output (not added to tx yet)
    let paymentUtxos: Utxo[] = [];
    let satsCollected = 0;
    // initialize fee and satsNeeded (updated with each added payment utxo)
    let fee = calculateFee(1, purchaseTx);
    let satsNeeded = fee + price + marketFee;
    // collect the required utxos
    const sortedFundingUtxos = utxos.value!.sort((a, b) =>
      a.satoshis > b.satoshis ? -1 : 1
    );
    for (let utxo of sortedFundingUtxos) {
      if (satsCollected < satsNeeded) {
        satsCollected += utxo.satoshis;
        paymentUtxos.push(utxo);

        // if we had to add additional
        fee = calculateFee(paymentUtxos.length, purchaseTx);
        satsNeeded = fee + price + marketFee + indexerBuyFee;
      }
    }

    // Replace dummy change output
    const changeAmt = satsCollected - satsNeeded;

    const changeOutput = new TxOut(
      BigInt(changeAmt),
      changeAddress.get_locking_script()
    );

    purchaseTx.set_output(2, changeOutput);

    // add output 3 - market fee
    // const marketFeeOutput = new TxOut(
    //   BigInt(marketFee),
    //   P2PKHAddress.from_string(marketAddress).get_locking_script()
    // );
    // purchaseTx.set_output(3, marketFeeOutput);

    preimage = purchaseTx.sighash_preimage(
      SigHash.InputOutputs,
      0,
      Script.from_bytes(Buffer.from(listingScript, "base64")),
      BigInt(1)
    );

    listingInput.set_unlocking_script(
      Script.from_asm_string(
        `${purchaseTx.get_output(0)!.to_hex()} ${purchaseTx
          .get_output(2)!
          .to_hex()}${purchaseTx.get_output(3)!.to_hex()}${purchaseTx
          .get_output(4)!
          .to_hex()} ${Buffer.from(preimage).toString("hex")} OP_0`
      )
    );
    purchaseTx.set_input(0, listingInput);

    // create and sign inputs (payment)
    const paymentPk = PrivateKey.from_wif(payPk.value!);

    paymentUtxos.forEach((utxo, idx) => {
      const fundingInput = new TxIn(
        Buffer.from(utxo.txid, "hex"),
        utxo.vout,
        Script.from_asm_string(utxo.script)
      );
      purchaseTx.add_input(fundingInput);

      const sig = purchaseTx.sign(
        paymentPk,
        SigHash.InputsOutputs,
        1 + idx,
        Script.from_asm_string(utxo.script),
        BigInt(utxo.satoshis)
      );

      fundingInput.set_unlocking_script(
        Script.from_asm_string(
          `${sig.to_hex()} ${paymentPk.to_public_key().to_hex()}`
        )
      );

      purchaseTx.set_input(1 + idx, fundingInput);
    });

    setPendingTxs([
      {
        rawTx: purchaseTx.to_hex(),
        txid: purchaseTx.get_id_hex(),
        size: purchaseTx.get_size(),
        fee: 100,
        numInputs: purchaseTx.get_ninputs(),
        numOutputs: purchaseTx.get_noutputs(),
        inputTxid: listing.txid,
      },
    ]);

    onClose();
    router.push("/preview");
  }, [indexerAddress, listing, onClose, price, router]);

  const isBsv20Listing = (listing as Listing).tick !== undefined;
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
        {showLicense && (
          <div className="rounded mb-4 p-2 text-xs text-[#777]">
            <h1>License</h1>
            <IoMdWarning className="inline-block mr-2" />
            You are about to purchase this inscription, granting you ownership
            and control of the associated token. This purchase does not include
            a license to any artwork or IP that may be depicted here and no
            rights are transferred to the purchaser unless specified explicitly
            within the transaction itself.
          </div>
        )}
        <form
          onSubmit={isBsv20Listing ? buyBsv20 : buyArtifact}
          className="modal-action"
        >
          <button className="bg-[#222] p-2 rounded cusros-pointer hover:bg-emerald-600 text-white">
            Buy - {price && price > 0 ? toBitcoin(price) : 0} BSV
          </button>
        </form>
      </div>
    </div>
  );
};

export default BuyArtifactModal;

const calculateFee = (numPaymentUtxos: number, purchaseTx: Transaction) => {
  const byteSize = Math.ceil(
    P2PKHInputSize * numPaymentUtxos + purchaseTx.to_bytes().byteLength
  );
  return Math.ceil(byteSize * 0.05);
};

const marketAddress = `15q8YQSqUa9uTh6gh4AVixxq29xkpBBP9z`;
const minimumMarketFee = 10000;
const marketRate = 0.04;
const P2PKHInputSize = 148;
const indexerBuyFee = 1000; // 1000 sats for a purchase
