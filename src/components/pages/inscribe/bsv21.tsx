"use client";

import Artifact from "@/components/artifact";
import { FetchStatus } from "@/constants";
import {
  chainInfo,
  indexers,
  payPk,
  usdRate
} from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { TxoData } from "@/types/ordinals";
import type { PendingTransaction } from "@/types/preview";
import { getUtxos } from "@/utils/address";
import { calculateIndexingFee } from "@/utils/bsv20";
import { getCroppedImg } from "@/utils/canvasUtils";
import { useIDBStorage } from "@/utils/storage";
import { PrivateKey } from "@bsv/sdk";
import { computed } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import {
  type DeployBsv21TokenConfig,
  type Distribution,
  type IconInscription,
  type ImageContentType,
  type Utxo,
  deployBsv21Token
} from "js-1sat-ord";
import { useRouter, useSearchParams } from "next/navigation";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Cropper from 'react-easy-crop';
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

type CropData = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CroppedArea = {
  width: number;
  height: number;
  x: number;
  y: number;
};

const InscribeBsv21: React.FC<InscribeBsv21Props> = ({ inscribedCallback }) => {
  useSignals();
  const router = useRouter();
  const [pendingTxs, setPendingTxs] = useIDBStorage<PendingTransaction[]>(
    "1sat-pts",
    [],
  );
  const params = useSearchParams();
  // const { tab, tick, op } = params.query as { tab: string; tick: string; op: string };
  const tab = params.get("tab") as InscriptionTab;
  const tick = params.get("tick");
  const op = params.get("op");
  const [isImage, setIsImage] = useState<boolean>(false);


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
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImageURL, setSelectedImageURL] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState<boolean>(false);

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

  const artifact = useMemo(() => {
    console.log({ croppedImage })
    if (!croppedImage || typeof croppedImage !== "string") {
      return null;
    }
    return (
      croppedImage && (
        <Artifact
          classNames={{ media: "w-20 h-20", wrapper: "w-fit" }}
          showFooter={false}
          size={100}
          artifact={{
            data: {
              insc: {
                file: {
                  type: "image/png",
                  size: 0,
                },
              },
            } as TxoData,
            script: "",
            outpoint: "",
            txid: "",
            vout: 0,
          }}
          src={croppedImage}
          sizes={""}
          latest={true}
        />
      )
    );
  }, [croppedImage]);

  const handleIconSelection = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) {
      return;
    }

    const file = e.target.files[0] as File;

    // No validations here
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(file);
    setSelectedImageURL(imageUrl);
    setShowCropper(true); // Open the cropper modal

    if (knownImageTypes.includes(file.type)) {
      setIsImage(true);
    }
  }, []);

  const inscribeBsv21 = useCallback(
    async (utxos: Utxo[]) => {
      if (!ticker || ticker?.length === 0 || (!selectedImage && !croppedImage)) {
        return;
      }
      if (!payPk.value || !ordAddress.value || !fundingAddress.value) {
        console.error("Missing payPk, ordAddress, or fundingAddress");
        return;
      }
      setInscribeStatus(FetchStatus.Loading);

      const paymentPk = PrivateKey.fromWif(payPk.value);

      let contentType: ImageContentType;
      let dataB64: string;

      if (croppedImage) {
        // Handle Blob URL
        const response = await fetch(croppedImage);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        dataB64 = Buffer.from(arrayBuffer).toString("base64");
        contentType = blob.type as ImageContentType;

        if (!contentType || !dataB64) {
          console.error('Invalid cropped image data');
          setInscribeStatus(FetchStatus.Error);
          return;
        }
      } else if (selectedImage) {
        const fileData = await selectedImage.arrayBuffer();
        dataB64 = Buffer.from(fileData).toString("base64");
        contentType = selectedImage.type as ImageContentType;
      } else {
        console.error('No image data available');
        setInscribeStatus(FetchStatus.Error);
        return;
      }

      const icon: IconInscription = {
        dataB64,
        contentType,
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

      setPendingTxs([{
        returnTo: "/wallet/bsv21",
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

      router.push("/preview");
    },
    [router, ticker, selectedImage, croppedImage, payPk.value, ordAddress.value, fundingAddress.value, maxSupply, decimals, setPendingTxs],
  );

  const clickInscribe = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
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
      !croppedImage ||
      !isImage
    );
  }, [
    ticker?.length,
    inscribeStatus,
    fetchTickerStatus,
    maxSupply,
    croppedImage,
    isImage,
  ]);

  const listingFee = computed(() => {
    if (!usdRate.value) {
      return minFee;
    }
    return calculateIndexingFee(usdRate.value);
  });

  const onCropComplete = useCallback((croppedArea: CropData, croppedAreaPixels: CroppedArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropIcon = useCallback(async () => {
    if (!selectedImage || !croppedAreaPixels || !selectedImageURL) {
      console.error("No image selected or no crop area", selectedImage, croppedAreaPixels);
      setShowCropper(false);
      return;
    }
    try {
      const dataUrl = await getCroppedImg(
        selectedImageURL,
        croppedAreaPixels,
      );
      if (dataUrl) {
        setCroppedImage(dataUrl);
        setSelectedImage(null);
        setSelectedImageURL(null);
        setShowCropper(false);
        setIsImage(true);
      } else {
        console.error("Failed to crop image");
        toast.error("Failed to crop image");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to crop image");
    }
  }, [selectedImage, croppedAreaPixels, selectedImageURL]);

  useEffect(() => {
    console.log({ croppedImage, selectedImage, selectedImageURL, isImage, artifact });
  }, [croppedImage, selectedImage, selectedImageURL, isImage, artifact]);
  return (
    <form className="w-full max-w-lg mx-auto" onSubmit={clickInscribe}>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
      <dialog
        id="cropper_modal"
        className={`modal backdrop-blur ${showCropper ? "modal-open" : ""}`}
        onClick={() => setShowCropper(false)}
      >
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <div className="modal-box" onClick={(e) => e.stopPropagation()}>
          <div className="relative w-full h-[400px] bg-[#333]">
            {selectedImageURL ? <Cropper
              image={selectedImageURL}
              crop={crop}
              zoom={zoom}
              cropSize={{ width: 400, height: 400 }}
              objectFit={"contain"}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            /> : null}
          </div>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={handleCropIcon}
              className="mr-2 px-4 py-2 bg-blue-500 text-white rounded"
            >
              Crop
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCropper(false);
                setSelectedImage(null);
                setSelectedImageURL(null);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </dialog>
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
          {(!croppedImage) && (
            <div className="text-[#555] text-lg">
              <IconWithFallback
                icon={null}
                alt={"Choose an Icon"}
                className="opacity-50 w-20 h-20 rounded-full"
              />
            </div>
          )}
          {croppedImage && isImage && artifact}
          {croppedImage && !isImage && (
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
            onChange={handleIconSelection}
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
      )}
      <div className="my-2 flex items-center justify-between mb-4 rounded p-2 text-info-content bg-info">
        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
        <label className="block w-full">
          BSV21 deployements are indexed immediately. A listing fee of $
          {`${listingFee.value}`} will be required before it shows up in some
          areas on the website. This can be paid later.
        </label>
      </div>
      {croppedImage && <hr className="my-2 h-2 border-0 bg-[#222]" />}

      <button
        disabled={submitDisabled}
        type="submit"
        className="w-full disabled:bg-[#222] disabled:text-[#555] hover:bg-yellow-500 transition bg-yellow-600 enabled:cursor-pointer p-3 text-xl rounded my-4 text-white"
      >
        Preview
      </button>
    </form>);
}

export default InscribeBsv21;

const maxMaxSupply = BigInt("18446744073709551615");

export const minFee = 100000000; // 1BSV
export const baseFee = 50;

const defaultDec = 8;
