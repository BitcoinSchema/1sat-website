import Artifact from "@/components/artifact";
import Tabs, { Tab } from "@/components/tabs";
import { ORDFS, OrdUtxo } from "@/context/ordinals";
import { PendingTransaction, useWallet } from "@/context/wallet";
import {
  createChangeOutput,
  fetchOrdinal,
  signPayment,
} from "@/utils/transaction";
import {
  P2PKHAddress,
  PrivateKey,
  Script,
  SigHash,
  Transaction,
  TxIn,
  TxOut,
} from "bsv-wasm-web";
import { Buffer } from "buffer";
import { Utxo } from "js-1sat-ord";
import { WithRouterProps } from "next/dist/client/with-router";
import { useSearchParams } from "next/navigation";
import Router from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeft } from "react-icons/fi";
import { IoMdInformationCircle } from "react-icons/io";
import { TbClick } from "react-icons/tb";
import { toSatoshi } from "satoshi-bitcoin-ts";
import { toastErrorProps } from "..";
import Ordinals from "../ordinals/list";
import MarketTabs, { MarketTab } from "./tabs";

interface PageProps extends WithRouterProps {}

const NewListingPage: React.FC<PageProps> = ({}) => {
  const searchParams = useSearchParams();
  const outPoint = searchParams.get("outPoint");
  const [outpoint, setOutpoint] = useState<string | undefined>(
    outPoint as string | undefined
  );
  const [price, setPrice] = useState<number>(0);
  const {
    usdRate,
    ordUtxos,
    fundingUtxos,
    changeAddress,
    ordAddress,
    payPk,
    ordPk,
    getRawTxById,
    getUtxoByOutpoint,
    setPendingTransaction,
  } = useWallet();
  const [showSelectItem, setShowSelectItem] = useState<boolean>();
  const [selectedItem, setSelectedItem] = useState<any>();

  const listOrdinal = useCallback(
    async (
      paymentUtxo: Utxo,
      ordinal: OrdUtxo,
      paymentPk: PrivateKey,
      changeAddress: string,
      ordPk: PrivateKey,
      ordAddress: string,
      payoutAddress: string,
      satoshisPayout: number
    ): Promise<PendingTransaction> => {
      let tx = new Transaction(1, 0);
      const t = ordinal.txid;
      const txBuf = Buffer.from(t, "hex");
      let ordIn = new TxIn(txBuf, ordinal.vout, Script.from_asm_string(""));
      tx.add_input(ordIn);

      // Inputs
      let utxoIn = new TxIn(
        Buffer.from(paymentUtxo.txid, "hex"),
        paymentUtxo.vout,
        Script.from_asm_string("")
      );

      tx.add_input(utxoIn);

      const payoutDestinationAddress = P2PKHAddress.from_string(payoutAddress);
      const payOutput = new TxOut(
        BigInt(satoshisPayout),
        payoutDestinationAddress.get_locking_script()
      );

      const destinationAddress = P2PKHAddress.from_string(ordAddress);
      const addressHex = destinationAddress
        .get_locking_script()
        .to_asm_string()
        .split(" ")[2];

      const ordLockScript = `${Script.from_hex(
        oLockPrefix
      ).to_asm_string()} ${addressHex} ${payOutput.to_hex()} ${Script.from_hex(
        oLockSuffix
      ).to_asm_string()}`;

      let satOut = new TxOut(BigInt(1), Script.from_asm_string(ordLockScript));
      tx.add_output(satOut);

      const changeOut = createChangeOutput(
        tx,
        changeAddress,
        paymentUtxo.satoshis
      );
      tx.add_output(changeOut);

      if (!ordinal.script) {
        const ordRawTx = await getRawTxById(ordinal.txid);
        const tx = Transaction.from_hex(ordRawTx);
        console.log({ num: tx.get_noutputs() });
        const out = tx.get_output(ordinal.vout);
        ordinal.satoshis = Number(out?.get_satoshis());

        const script = out?.get_script_pub_key();
        if (script) {
          ordinal.script = script.to_asm_string();
        }
      }

      // sign ordinal
      const sig = tx.sign(
        ordPk,
        SigHash.ALL | SigHash.FORKID,
        0,
        Script.from_asm_string(ordinal.script),
        BigInt(ordinal.satoshis)
      );

      ordIn.set_unlocking_script(
        Script.from_asm_string(
          `${sig.to_hex()} ${ordPk.to_public_key().to_hex()}`
        )
      );

      tx.set_input(0, ordIn);

      utxoIn = signPayment(tx, paymentPk, 1, paymentUtxo, utxoIn);
      tx.set_input(1, utxoIn);

      return {
        rawTx: tx.to_hex(),
        size: tx.get_size(),
        fee: paymentUtxo!.satoshis - Number(tx.satoshis_out()),
        numInputs: tx.get_ninputs(),
        numOutputs: tx.get_noutputs(),
        txid: tx.get_id_hex(),
        inputTxid: paymentUtxo.txid,
        marketFee: 0,
      };
    },
    [getRawTxById]
  );

  useEffect(() => {
    const fire = async () => {
      if (outpoint) {
        const item = await fetchOrdinal(outpoint);
        setSelectedItem(item);
      }
    };
    if (outpoint && !selectedItem) {
      fire();
    }
  }, [outpoint, selectedItem]);

  const submit = useCallback(async () => {
    console.log("create listing", selectedItem, price);
    if (!fundingUtxos || !payPk || !ordPk || !changeAddress || !ordAddress) {
      return;
    }
    const paymentPk = PrivateKey.from_wif(payPk);
    const ordinalPk = PrivateKey.from_wif(ordPk);

    const ordUtxo = await getUtxoByOutpoint(selectedItem.origin.outpoint);
    if (!ordUtxo) {
      // TODO: show error
      return;
    }
    const pendingTx = await listOrdinal(
      fundingUtxos[0],
      ordUtxo,
      paymentPk,
      changeAddress,
      ordinalPk,
      ordAddress,
      changeAddress,
      price
    );

    setPendingTransaction(pendingTx);

    Router.push("/preview");
  }, [
    setPendingTransaction,
    listOrdinal,
    changeAddress,
    fundingUtxos,
    selectedItem,
    price,
    payPk,
    ordPk,
    ordAddress,
    getUtxoByOutpoint,
  ]);

  const clickSelectItem = useCallback(() => {
    setShowSelectItem(true);
  }, []);

  const clickOrdinal = useCallback(
    async (outpoint: string) => {
      console.log("Clicked", outpoint);
      //     const items = await fetchOrdinal(outpoint);
      const ordUtxo = await getUtxoByOutpoint(outpoint);

      console.log({ ordUtxo });
      // do not set the item if it is a listing
      if (ordUtxo) {
        if (!ordUtxo.data?.list) {
          setSelectedItem(ordUtxo);
        } else {
          toast.error("This item is already listed", toastErrorProps);
          return;
        }
      }

      setShowSelectItem(false);
      setOutpoint(outpoint);
    },
    [setOutpoint, getUtxoByOutpoint, setShowSelectItem]
  );

  const artifact = useMemo(() => {
    return ordUtxos?.find((utxo) => utxo.outpoint === outpoint);
  }, [ordUtxos, outpoint]);

  // Artifact component params:
  // outPoint,
  // origin,
  // contentType,
  // classNames,
  // num,
  // to,
  // src = `/content/${origin}`,
  // onClick,
  // txid,
  // price,
  // height,

  return (
    <div className="flex flex-col">
      <Tabs currentTab={Tab.Market} />

      <MarketTabs currentTab={MarketTab.New} />

      <div className="w-full text-xl px-4 md:px-0 mb-4 flex items-center justify-between">
        <div
          className="flex items-center text-[#555] hover:text-blue-500 transition cursor-pointer"
          onClick={() => {
            Router.push("/market/listings");
          }}
        >
          <FiArrowLeft className="mr-2" />
          Back
        </div>
        <div>Create Listing</div>
      </div>

      <div className="flex flex-col md:flex-row px-4 md:px-0 w-full">
        <div className="md:w-2/3 md:mr-2">
          <div className="my-2 md:my-0 p-2 rounded bg-[#111]">
            {!outpoint && (
              <div
                onClick={clickSelectItem}
                className="text-blue-400 hover:text-blue-500 font-semibold cursor-pointer p-2 flex items-center justify-center w-full h-64 border rounded-lg border-[#333] border-dashed hover:bg-[#1a1a1a] transition mx-auto"
              >
                <TbClick className="text-2xl mr-2" /> Select an Item
              </div>
            )}

            {outpoint && (
              <div className="px-4 md:px-unset">
                <div className="rounded p-2 md:p-4 max-w-4xl text-[#777] flex mb-2 items-start justify-start">
                  <IoMdInformationCircle className="-mt-6 md:w-24 md:h-24 md:mr-2 opacity-25 text-emerald-200" />
                  <div className="md:text-xl">
                    {`Listings are can be purchased on the market page, or on other platforms. Listings can be cancelled at any time.`}
                  </div>
                </div>
              </div>
            )}

            <div className="my-2 w-full md:px-4">
              <label className="flex items-center justify-between text-white">
                Price (BSV)
                <input
                  className="p-2 rounded"
                  type="number"
                  onChange={(e) => {
                    if (e.target.value === "") {
                      setPrice(0);
                      return;
                    }
                    setPrice(
                      toSatoshi(
                        e.target.value.includes(".")
                          ? parseFloat(e.target.value)
                          : parseInt(e.target.value)
                      )
                    );
                  }}
                />
              </label>
            </div>

            <div className="my-2 flex justify-end  md:px-4">
              {
                <button
                  disabled={!outpoint || !usdRate || !price}
                  onClick={() => {
                    if (!outpoint) {
                      setShowSelectItem(true);
                      return;
                    }
                    submit();
                  }}
                  className={`${
                    !outpoint ? `` : `cursor-pointer`
                  } w-full bg-teal-500 hover:bg-teal-600 transition text-white p-2 rounded disabled:bg-[#111] disabled:text-[#555]`}
                >
                  {` ${
                    !outpoint ? "Select an Item" : !price ? "Set a Price" : ""
                  }`}
                  {!!outpoint && !!usdRate && !!price
                    ? `List for $${(price / usdRate)
                        .toFixed(2)
                        .toLocaleString()}`
                    : ""}
                </button>
              }
            </div>
          </div>
        </div>
        <div className="md:w-1/3 md:ml-2">
          {!outpoint && (
            <div className="border border-[#222] text-[#555] rounded flex items-center justify-center text-center w-full h-full h-32">
              Listing Preview Will Display Here
            </div>
          )}
          {outpoint && (
            <Artifact
              protocol={artifact?.data?.insc?.json?.p}
              outPoint={outpoint as string}
              origin={artifact?.origin?.outpoint}
              contentType="image/png"
              num={artifact?.origin?.num}
              src={`${ORDFS}/${artifact?.origin?.outpoint}`}
              onClick={() => {}}
              txid={artifact?.txid as string}
              price={price}
              height={1}
            />
          )}
        </div>
      </div>

      {showSelectItem && (
        <div className="fixed top-0 left-0 bg-black bg-opacity-50 w-screen h-screen overflow-auto flex flex-col">
          <div className="m-auto max-w-7xl p-4 bg-[#111] rounded-xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>Select an Item</div>
              <div
                onClick={() => {
                  setShowSelectItem(false);
                }}
                className="text-[#555] hover:text-blue-500 transition cursor-pointer"
              >
                Close
              </div>
            </div>
            <Ordinals onClick={clickOrdinal} currentPage={1} />
          </div>
        </div>
      )}
    </div>
  );
};

export default NewListingPage;

// Constants
const oLockPrefix =
  "2097dfd76851bf465e8f715593b217714858bbe9570ff3bd5e33840a34e20ff0262102ba79df5f8ae7604a9830f03c7933028186aede0675a16f025dc4f8be8eec0382201008ce7480da41702918d1ec8e6849ba32b4d65b1e40dc669c31a1e6306b266c0000";
const oLockSuffix =
  "615179547a75537a537a537a0079537a75527a527a7575615579008763567901c161517957795779210ac407f0e4bd44bfc207355a778b046225a7068fc59ee7eda43ad905aadbffc800206c266b30e6a1319c66dc401e5bd6b432ba49688eecd118297041da8074ce081059795679615679aa0079610079517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01007e81517a75615779567956795679567961537956795479577995939521414136d08c5ed2bf3ba048afe6dcaebafeffffffffffffffffffffffffffffff00517951796151795179970079009f63007952799367007968517a75517a75517a7561527a75517a517951795296a0630079527994527a75517a6853798277527982775379012080517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01205279947f7754537993527993013051797e527e54797e58797e527e53797e52797e57797e0079517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a756100795779ac517a75517a75517a75517a75517a75517a75517a75517a75517a7561517a75517a756169587951797e58797eaa577961007982775179517958947f7551790128947f77517a75517a75618777777777777777777767557951876351795779a9876957795779ac777777777777777767006868";
