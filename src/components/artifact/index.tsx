import { API_HOST } from "@/context/ordinals";
import { useWallet } from "@/context/wallet";
import { customFetch } from "@/utils/httpClient";
import {
  P2PKHAddress,
  PrivateKey,
  Script,
  SigHash,
  Transaction,
  TxIn,
  TxOut,
} from "bsv-wasm-web";
import { Utxo } from "js-1sat-ord";
import { head, sumBy } from "lodash";
import Image from "next/image";
import Router from "next/router";
import React, { useCallback, useMemo, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import { IoMdWarning } from "react-icons/io";
import { toBitcoin } from "satoshi-bitcoin-ts";
import styled from "styled-components";
import tw from "twin.macro";
import Model from "../model";
import { FetchStatus, toastErrorProps } from "../pages";
import AudioArtifact from "./audio";
import JsonArtifact from "./json";
import TextArtifact from "./text";
import VideoArtifact from "./video";

type MarketResponse = {
  txid: string;
  vout: number;
  height: number;
  idx: number;
  price: number;
  payout: string;
  script: string;
  origin: string;
};

export enum ArtifactType {
  Audio,
  Image,
  Model,
  PDF,
  Video,
  Javascript,
  HTML,
  MarkDown,
  Text,
  JSON,
  BSV20,
}

type ArtifactProps = {
  outPoint?: string; // can be left out when previewing inscription not on chain yet
  contentType?: string;
  num?: number;
  height?: number;
  classNames?: { wrapper?: string; media?: string };
  to?: string;
  src?: string;
  onClick?: (outPoint: string) => void;
  txid?: string;
  price?: number;
  origin?: string;
};

const Artifact: React.FC<ArtifactProps> = ({
  outPoint,
  origin,
  contentType,
  classNames,
  num,
  to,
  src = `${API_HOST}/api/files/inscriptions/${origin}`,
  onClick,
  txid,
  price,
  height,
}) => {
  const [imageLoadStatus, setImageLoadStatus] = useState<FetchStatus>(
    FetchStatus.Loading
  );

  const {
    ordAddress,
    changeAddress,
    fundingUtxos,
    payPk,
    setPendingTransaction,
  } = useWallet();

  const [showBuy, setShowBuy] = useState<boolean>(false);
  const [hoverPrice, setHoverPrice] = useState<boolean>(false);
  const type = useMemo(() => {
    let artifactType = undefined;
    const t = head(contentType?.toLowerCase().split(";"));
    if (contentType?.startsWith("audio")) {
      artifactType = ArtifactType.Audio;
    } else if (t?.startsWith("video")) {
      artifactType = ArtifactType.Video;
    } else if (t?.startsWith("model")) {
      artifactType = ArtifactType.Model;
    } else if (t === "application/pdf") {
      artifactType = ArtifactType.Model;
    } else if (t === "application/javascript") {
      artifactType = ArtifactType.Javascript;
    } else if (t === "application/json") {
      artifactType = ArtifactType.JSON;
    } else if (t === "text/plain") {
      artifactType = ArtifactType.Text;
    } else if (t === "text/markdown") {
      artifactType = ArtifactType.MarkDown;
    } else if (t === "text/html") {
      artifactType = ArtifactType.HTML;
    } else if (t === "application/bsv-20") {
      artifactType = ArtifactType.BSV20;
    } else if (t?.startsWith("image")) {
      artifactType = ArtifactType.Image;
    }
    return artifactType;
  }, [contentType]);

  const ArtifactContainer = styled.a`
    &:after {
      position: absolute;
      content: "";
      top: 5vw;
      left: 0;
      right: 0;
      z-index: -1;
      height: 100%;
      width: 100%;
      margin: 0 auto;
      transform: scale(0.75);
      -webkit-filter: blur(5vw);
      -moz-filter: blur(5vw);
      -ms-filter: blur(5vw);
      filter: blur(5vw);
      background: linear-gradient(270deg, #ffa60f85, #942fff66);
      background-size: 200% 200%;
      animation: animateGlow 10s ease infinite;
    }
  `;

  const ItemContainer = tw.div`
  flex items-center justify-center w-full h-full rounded
  `;

  // const isBsv20 = useMemo(() => {
  //   if (type === ArtifactType.BSV20) {
  //     return true;
  //   }
  //   if (height) {
  //     // console.log(
  //     //   { json },
  //     //   (json.height || 0) > 793000,
  //     //   head(json.file!.type.split(";"))
  //     // );

  //     if (type === ArtifactType.Text && (height || 0) < 793000) {
  //       try {
  //         JSON.parse(json);
  //         return true
  //       } catch (e) {
  //         console.log(e);
  //         return true
  //       }
  //     }
  //     return;
  //   } else {
  //     return false;
  //   }
  // }, [height, type]);

  const calculateFee = (numPaymentUtxos: number, purchaseTx: Transaction) => {
    const byteSize = Math.ceil(
      P2PKHInputSize * numPaymentUtxos + purchaseTx.to_bytes().byteLength
    );
    return Math.ceil(byteSize * 0.05);
  };

  const buyArtifact = useCallback(async () => {
    if (!fundingUtxos || !payPk || !ordAddress || !changeAddress) {
      return;
    }

    // I1 - Ordinal
    // I2 - Funding
    // O1 - Ordinal destination
    // O2 - Payment to lister
    // O3 - Market Fee
    // O4 - Change

    const purchaseTx = new Transaction(1, 0);

    const { promise } = customFetch<MarketResponse>(
      `${API_HOST}/api/market/${outPoint}`
    );

    const { script, payout, vout, txid, price } = await promise;
    console.log(
      { script, payout, vout, txid, price },
      sumBy(fundingUtxos, "satoshis")
    );

    // make sure funding UTXOs can cover price, otherwise show error
    if (
      (price === 0 ? minimumMarketFee + price : price * 1.04) >=
      sumBy(fundingUtxos, "satoshis") + P2PKHInputSize * fundingUtxos.length
    ) {
      toast.error("Not enough Bitcoion!", toastErrorProps);
      return;
    }
    const listingInput = new TxIn(
      Buffer.from(txid, "hex"),
      vout,
      Script.from_asm_string("")
    );
    purchaseTx.add_input(listingInput);

    // output 0
    const buyerOutput = new TxOut(
      BigInt(1),
      P2PKHAddress.from_string(ordAddress).get_locking_script()
    );
    purchaseTx.add_output(buyerOutput);

    // output 1
    const payOutput = TxOut.from_hex(
      Buffer.from(payout, "base64").toString("hex")
    );
    purchaseTx.add_output(payOutput);

    // output 2 - change
    const dummyChangeOutput = new TxOut(
      BigInt(0),
      P2PKHAddress.from_string(changeAddress).get_locking_script()
    );
    purchaseTx.add_output(dummyChangeOutput);

    // output 3 - marketFee
    const dummyMarketFeeOutput = new TxOut(
      BigInt(0),
      P2PKHAddress.from_string(marketAddress).get_locking_script()
    );
    purchaseTx.add_output(dummyMarketFeeOutput);

    let preimage = purchaseTx.sighash_preimage(
      SigHash.InputOutput,
      0,
      Script.from_bytes(Buffer.from(script, "base64")),
      BigInt(1) // todo use amount from listing
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
    let marketFee = price * 0.04;
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
    const sortedFundingUtxos = fundingUtxos.sort((a, b) =>
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
      P2PKHAddress.from_string(changeAddress).get_locking_script()
    );

    purchaseTx.set_output(2, changeOutput);

    // add output 3 - market fee (not part of preimage?)
    const marketFeeOutput = new TxOut(
      BigInt(marketFee),
      P2PKHAddress.from_string(marketAddress).get_locking_script()
    );
    purchaseTx.set_output(3, marketFeeOutput);

    preimage = purchaseTx.sighash_preimage(
      SigHash.InputOutputs,
      0,
      Script.from_bytes(Buffer.from(script, "base64")),
      BigInt(1)
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

    // create and sign inputs (payment)
    const paymentPk = PrivateKey.from_wif(payPk);

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

    setPendingTransaction({
      rawTx: purchaseTx.to_hex(),
      size: purchaseTx.get_size(),
      fee,
      price,
      numInputs: purchaseTx.get_ninputs(),
      numOutputs: purchaseTx.get_noutputs(),
      txid: purchaseTx.get_id_hex(),
      marketFee,
      // TODO: support multiple txids here
      inputTxid: head(paymentUtxos)!.txid,
    });

    Router.push("/preview");
  }, [
    changeAddress,
    fundingUtxos,
    ordAddress,
    outPoint,
    payPk,
    setPendingTransaction,
  ]);

  const content = useMemo(() => {
    if (!src || type === undefined) {
      return (
        <ItemContainer className="bg-white min-h-[300px]">
          <LoaderIcon className="m-auto" />
        </ItemContainer>
      );
    }

    return type === ArtifactType.Video ? (
      <VideoArtifact
        origin={origin}
        src={src}
        className={`${classNames?.media ? classNames.media : ""}`}
      />
    ) : type === ArtifactType.Audio ? (
      <>
        <AudioArtifact
          outPoint={outPoint}
          src={src}
          className={`p-1 absolute bottom-0 left-0 w-full ${
            classNames?.media ? classNames.media : ""
          }`}
        />
      </>
    ) : type === ArtifactType.HTML ? (
      <div className="w-full h-full">
        <iframe
          className="w-full h-full min-h-[60vh]"
          src={`${API_HOST}/api/files/inscriptions/${origin}`}
          sandbox=" "
        />
      </div>
    ) : type === ArtifactType.BSV20 || type === ArtifactType.JSON ? (
      <div
        className={`h-full p-4 ${classNames?.wrapper || ""} ${
          classNames?.media || ""
        }`}
      >
        <JsonArtifact origin={origin} type={type} />
      </div>
    ) : type === ArtifactType.Text ? (
      <div className={`w-full p-2 h-full`}>
        <TextArtifact origin={origin} className="w-full" />
      </div>
    ) : type === ArtifactType.Model ? (
      <div
        className={`w-full h-[50vh] ${classNames?.wrapper || ""} ${
          classNames?.media || ""
        }`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onAuxClick={(e) => {
          console.log("middle click");
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Model src={src} />
      </div>
    ) : type === ArtifactType.MarkDown ? (
      <div
        className={`h-full p-4 ${classNames?.wrapper || ""} ${
          classNames?.media || ""
        }`}
      >
        MarkDown Inscriptions not yet supported.
      </div>
    ) : type === ArtifactType.PDF ? (
      <div
        className={`h-full p-4 ${classNames?.wrapper || ""} ${
          classNames?.media || ""
        }`}
      >
        PDF Inscriptions not yet supported.
      </div>
    ) : (
      <ItemContainer className="min-h-[300px]">
        {src !== "" && src != undefined && (
          <Image
            className={`h-auto ${classNames?.media ? classNames.media : ""}`}
            // TODO: Use a opl account for this
            src={
              src.startsWith("data:")
                ? src
                : `https://res.cloudinary.com/jamifybitcoin/image/fetch/c_fill,g_center,h_300,w_300/f_auto/${src}`
            }
            id={`artifact_${new Date().getTime()}_image`}
            alt={`Inscription${num ? " #" + num : ""}`}
            // placeholder="blur"
            // blurDataURL={`data:image/svg+xml;base64,${toBase64(
            //   shimmer(700, 475)
            // )}`}
            width={300}
            height={300}
          />
        )}
      </ItemContainer>
    );
  }, [src, type, origin, classNames, outPoint, ItemContainer, num]);

  return (
    <React.Fragment>
      <ArtifactContainer
        key={outPoint}
        className={`flex flex-col pb-[65px] items-center justify-center min-h-[356px] min-w-[300px] bg-[#111] w-full h-full relative rounded ${
          to ? "cursor-pointer" : ""
        } block transition mx-auto ${
          classNames?.wrapper ? classNames.wrapper : ""
        }`}
        target={to ? "_self" : undefined}
        href={to}
        onClick={(e) => {
          if (!to) {
            e.stopPropagation();
            e.preventDefault();
            if (txid && onClick) {
              onClick(txid);
            }
          }
        }}
      >
        {content}

        {/* TODO: Show indicator when more than one isncription */}
        {num !== undefined && (
          <div className="absolute bottom-0 left-0 bg-black bg-opacity-75 flex items-center justify-between w-full p-2 h-[56px]">
            <div
              className={`rounded bg-[#222] p-2 text-[#aaa] cursor-pointer`}
              onClick={() => Router.push(`/inscription/${num}`)}
            >
              #{num}
            </div>
            <div className={`hidden md:block`}>&nbsp;</div>
            <div
              className={` ${
                price &&
                type !== ArtifactType.BSV20 &&
                !(height && type === ArtifactType.Text && height >= 793000)
                  ? "cursor-pointer hover:bg-emerald-600 text-white"
                  : ""
              } select-none min-w-24 text-right rounded bg-[#222] p-2 text-[#aaa] transition`}
              onClick={() => {
                if (
                  !(
                    price &&
                    type !== ArtifactType.BSV20 &&
                    !(height && type === ArtifactType.Text && height >= 793000)
                  )
                ) {
                  return;
                }
                setShowBuy(true);
              }}
              onMouseEnter={() => {
                setHoverPrice(true);
              }}
              onMouseLeave={() => {
                setHoverPrice(false);
              }}
            >
              {price ? `${toBitcoin(price || 0)} BSV` : contentType}
            </div>
          </div>
        )}
      </ArtifactContainer>
      {showBuy && (
        <div
          className="z-10 flex items-center justify-center fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50"
          onClick={() => setShowBuy(false)}
        >
          <div
            className="w-full max-w-lg m-auto p-4 bg-[#111] trext-[#aaa] rounded flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div>{content}</div>
            <div className="rounded mb-4 p-2 text-xs text-[#777]">
              <h1>License</h1>
              <IoMdWarning className="inline-block mr-2" />
              You are about to purchase this inscription, granting you ownership
              and control the associated token. There purchase does not include
              a license to any artwork or IP that may be depicted here and no
              rights are transferred to the purchaser unless specified
              explicitly within the transaction itself.
            </div>

            <button
              className="bg-[#222] p-2 rounded cusros-pointer hover:bg-emerald-600 text-white"
              onClick={buyArtifact}
            >
              Buy - {toBitcoin(price || 0)} BSV
            </button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

export default Artifact;

const toBase64 = (str: string) =>
  typeof window === "undefined"
    ? Buffer.from(str).toString("base64")
    : window.btoa(str);

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const P2PKHInputSize = 148;
const marketAddress = `15q8YQSqUa9uTh6gh4AVixxq29xkpBBP9z`;
const minimumMarketFee = 10000;
