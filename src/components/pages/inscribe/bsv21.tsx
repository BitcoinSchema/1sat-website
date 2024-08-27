"use client";

import Artifact from "@/components/artifact";
import { FetchStatus, toastErrorProps } from "@/constants";
import {
  chainInfo,
  indexers,
  payPk,
  usdRate
} from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { setPendingTxs } from "@/signals/wallet/client";
import type { TxoData } from "@/types/ordinals";
import { getUtxos } from "@/utils/address";
import { calculateIndexingFee } from "@/utils/bsv20";
import { PrivateKey } from "@bsv/sdk";
import { computed } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import {
  deployBsv21Token,
  type Distribution,
  type DeployBsv21TokenConfig,
  type IconInscription,
  type ImageContentType,
  type Utxo
} from "js-1sat-ord";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { IoMdWarning } from "react-icons/io";
import { RiSettings2Fill } from "react-icons/ri";
import { IconWithFallback } from "../TokenMarket/heading";
import { knownImageTypes } from "./image";
import type { InscriptionTab } from "./tabs";

const top10 = ["FREN", "LOVE", "TRMP", "GOLD", "TOPG", "CAAL"];

interface InscribeBsv21Props {
  inscribedCallback: () => void;
}

const InscribeBsv21: React.FC<InscribeBsv21Props> = ({ inscribedCallback }) => {
  useSignals();
  const params = useSearchParams();
  // const { tab, tick, op } = params.query as { tab: string; tick: string; op: string };
  const tab = params.get("tab") as InscriptionTab;
  const tick = params.get("tick");
  const op = params.get("op");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImage, setIsImage] = useState<boolean>(false);
  const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);

  const [fetchTickerStatus, setFetchTickerStatus] = useState<FetchStatus>(
    FetchStatus.Idle,
  );
  const [inscribeStatus, setInscribeStatus] = useState<FetchStatus>(
    FetchStatus.Idle,
  );
  const [limit, setLimit] = useState<string | undefined>("1337");
  const [maxSupply, setMaxSupply] = useState<string>("21000000");
  const [decimals, setDecimals] = useState<number | undefined>();
  const [amount, setAmount] = useState<string>();
  const [mintError, setMintError] = useState<string>();
  const [showOptionalFields, setShowOptionalFields] = useState<boolean>(false);
  const [iterations, setIterations] = useState<number>(1);

  const [ticker, setTicker] = useState<string | null>(tick);

  useEffect(() => {
    if (tick) {
      setTicker(tick);
    }
  }, [setTicker, tick]);

  const toggleOptionalFields = useCallback(() => {
    setShowOptionalFields(!showOptionalFields);
  }, [showOptionalFields]);


  const inSync = computed(() => {
    if (!indexers.value || !chainInfo.value) {
      return false;
    }

    // console.log({ indexers: indexers.value, chainInfo: chainInfo.value });
    return (
      indexers.value["bsv20-deploy"] >= chainInfo.value?.blocks &&
      indexers.value.bsv20 >= chainInfo.value?.blocks
    );
  });

  const changeFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) {
      return;
    }
    // TODO: This reads the file twice which is pretty inefficient
    // would be nice to get dimensions and ArrayBuffer for preview in one go

    const file = e.target.files[0] as File;
    // make sure the width and height are identical
    const img = new Image();
    img.onload = () => {
      if (img.width !== img.height) {
        toast.error("Image must be square", toastErrorProps);
        setSelectedFile(null);
        setPreview(null);
        setIsImage(false);
        setMintError("Image must be square");
        return;
      }
      // max size is 400px
      if (img.width > 400) {
        toast.error("Width must be 400px or less", toastErrorProps);
        setSelectedFile(null);
        setPreview(null);
        setIsImage(false);
        setMintError("Width must be 400px or less");
        return;
      }
      if (file.size > 100000) {
        toast.error("Image must be less than 100KB", toastErrorProps);
        setSelectedFile(null);
        setPreview(null);
        setIsImage(false);
        setMintError("Image must be less than 100KB");
        return;
      }
      setMintError(undefined);
      setSelectedFile(file);
      if (knownImageTypes.includes(file.type)) {
        setIsImage(true);
      }
      const reader = new FileReader();

      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    };
    img.src = URL.createObjectURL(file);
  }, []);

  const artifact = useMemo(async () => {
    return (
      selectedFile?.type &&
      preview && (
        <Artifact
          classNames={{ media: "w-20 h-20", wrapper: "w-fit" }}
          showFooter={false}
          size={100}
          artifact={{
            data: {
              insc: {
                file: {
                  type: selectedFile.type,
                  size: selectedFile.size,
                },
              },
            } as TxoData,
            script: "",
            outpoint: "",
            txid: "",
            vout: 0,
          }}
          src={preview as string}
          sizes={""}
          latest={true}
        />
      )
    );
  }, [preview, selectedFile]);

  const inscribeBsv21 = useCallback(
    async (utxos: Utxo[]) => {
      if (!ticker || ticker?.length === 0 || selectedFile === null) {
        return;
      }
      if (!payPk.value || !ordAddress.value || !fundingAddress.value) {
        console.error("Missing payPk, ordAddress, or fundingAddress");
        return;
      }
      setInscribeStatus(FetchStatus.Loading);

      const paymentPk = PrivateKey.fromWif(payPk.value);

      // get a buffer of the file
      const fileData = await selectedFile.arrayBuffer();

      console.log({contentType: selectedFile.type})
      const icon: IconInscription = {
        dataB64: Buffer.from(fileData).toString("base64"),
        contentType: selectedFile.type as ImageContentType,
      };

      const config: DeployBsv21TokenConfig = {
        paymentPk,
        symbol: ticker,
        icon,
        utxos,
        initialDistribution: {
          address: ordAddress.value,
          tokens: Number(maxSupply),
        } as Distribution,
        destinationAddress: ordAddress.value,
      };

      if (decimals) {
        config.decimals = decimals;
      }

      const { tx, spentOutpoints, payChange } = await deployBsv21Token(config);

      // TODO: When inscribing new BSV21 the token isnt there yet and causes errors
      setPendingTxs([{
        returnTo: "/wallet/bsv21", // `/market/bsv21/${tx.id('hex')}_0`,
        rawTx: tx.toHex(),
        size: tx.toBinary().length,
        fee: tx.getFee(),
        numInputs: tx.inputs.length,
        numOutputs: tx.outputs.length,
        txid: tx.id('hex'),
        spentOutpoints,
        payChange,
      }]);
      setInscribeStatus(FetchStatus.Success);
    },
    [ticker, selectedFile, payPk.value, ordAddress.value, fundingAddress.value, maxSupply, decimals],
  );

  const clickInscribe = useCallback(async () => {
    if (!payPk.value || !ordAddress.value || !fundingAddress.value) {
      return;
    }

    const utxos = await getUtxos(fundingAddress.value);

    return await inscribeBsv21(utxos);
  }, [fundingAddress.value, inscribeBsv21, ordAddress.value, payPk.value]);

  const submitDisabled = useMemo(() => {
    return (
      !ticker?.length ||
      inscribeStatus === FetchStatus.Loading ||
      fetchTickerStatus === FetchStatus.Loading ||
      !maxSupply ||
      (!!selectedFile && !isImage)
    );
  }, [
    ticker?.length,
    inscribeStatus,
    fetchTickerStatus,
    maxSupply,
    selectedFile,
    isImage,
  ]);

  const listingFee = computed(() => {
    if (!usdRate.value) {
      return minFee;
    }
    return calculateIndexingFee(usdRate.value);
  });

  return (
    <form className="w-full max-w-lg mx-auto" action="/preview">
      <div className="text-white w-full p-2 rounded my-2">Deploy New Token</div>
      <div className="my-2">
        <label className="block mb-4">
          {/* TODO: Autofill */}
          <div className="flex items-center justify-between my-2">
            Symbol{" "}
            <span className="text-[#555]">{"Not required to be unique"}</span>
          </div>
          <div className="relative">
            <input
              className="text-white w-full rounded p-2"
              maxLength={255}
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  return;
                }
              }}
              value={ticker || ""}
              onChange={(e) => setTicker(e.target.value)}
            />

            {!inSync && (
              <div className="absolute right-0 bottom-0 mb-2 mr-2">
                <IoMdWarning />
              </div>
            )}
          </div>
        </label>
      </div>

      <div className="my-2 flex items-center">
        <div className="w-28 mr-4">
          {(!selectedFile || !preview) && (
            <div className="text-[#555] text-lg">
              <IconWithFallback
                icon={null}
                alt={"Choose an Icon"}
                className="opacity-50 w-20 h-20 rounded-full"
              />
            </div>
          )}
          {selectedFile && preview && isImage && artifact}
          {selectedFile && !isImage && (
            <div className="w-full h-full bg-[#111] rounded flex items-center justify-center">
              X
            </div>
          )}
        </div>
        <label className="block mb-4 w-full">
          <div className="my-2 flex items-center justify-between">
            <div>Upload Icon</div>
            <div>
              <div
                className={`${mintError ? "text-error" : "text-[#555]"
                  } text-sm`}
              >
                {mintError || "Max Size 100KB, Square Image"}
              </div>
            </div>
          </div>
          <input
            type="file"
            className="file-input w-full"
            onChange={changeFile}
          />
        </label>
      </div>
      <div className="my-2">
        <label className="block mb-4">
          <div className="my-2 flex justify-between text-sm">
            Max Supply <span className="text-[#555]">Whole coins</span>
          </div>
          <input
            pattern="\d+"
            type="text"
            className="text-white w-full rounded p-2"
            onChange={(e) => setMaxSupply(e.target.value)}
            value={maxSupply}
          />
        </label>
      </div>

      {!showOptionalFields && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
        <div
          className="my-2 flex items-center justify-end cursor-pointer text-blue-500 hover:text-blue-400 transition"
          onClick={toggleOptionalFields}
        >
          <RiSettings2Fill className="mr-2" /> More Options
        </div>
      )}

      {showOptionalFields && (
        <>
          <div className="my-2">
            <label className="block mb-4">
              <div className="my-2 flex items-center justify-between">
                Decimal Precision
              </div>
              <input
                className="text-white w-full rounded p-2"
                type="number"
                min={0}
                max={18}
                value={decimals}
                placeholder={defaultDec.toString()}
                onChange={(e) => setDecimals(e.target.value ? Number.parseInt(e.target.value) : undefined)}
              />
            </label>
          </div>
        </>
      )}
      <div className="my-2 flex items-center justify-between mb-4 rounded p-2 text-info-content bg-info">
        <label className="block w-full">
          BSV21 deployements are indexed immediately. A listing fee of $
          {`${listingFee.value}`} will be required before it shows up in some
          areas on the website. This can be paid later.
        </label>
      </div>
      {preview && <hr className="my-2 h-2 border-0 bg-[#222]" />}

      <button
        disabled={submitDisabled}
        type="submit"
        onClick={clickInscribe}
        className="w-full disabled:bg-[#222] disabled:text-[#555] hover:bg-yellow-500 transition bg-yellow-600 enabled:cursor-pointer p-3 text-xl rounded my-4 text-white"
      >
        Preview
      </button>
    </form>
  );
};

export default InscribeBsv21;

const maxMaxSupply = BigInt("18446744073709551615");

export const minFee = 100000000; // 1BSV
export const baseFee = 50;

const defaultDec = 8;
