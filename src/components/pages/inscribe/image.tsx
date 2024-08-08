"use client";

import { FetchStatus } from "@/constants";
import { generatedImage } from "@/signals/ai";
import { payPk, pendingTxs } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { setPendingTxs } from "@/signals/wallet/client";
import type { FileEvent } from "@/types/file";
import type { OrdUtxo, TxoData } from "@/types/ordinals";
import { getCollectionUtxos, getUtxos } from "@/utils/address";
import { formatBytes } from "@/utils/bytes";
import { useSignals } from "@preact/signals-react/runtime";
import type { PreMAP } from "js-1sat-ord";
import { head } from "lodash";
import * as mime from "mime";
import type React from "react";
import { useCallback, useMemo, useState } from "react";
import { TbClick } from "react-icons/tb";
import CollectionItemForm from "./collectionItemForm";
import FilePreview from "./filePreview";
import InscribeButton from "./inscribeButton";
import MetaForm from "./metaForm";
import { Input, Label } from "./styles";
import useFileHandler from "./useFileHandler";
import { useQuery } from "@tanstack/react-query";
import { inscribeFile } from "@/utils/inscribe";
import styled from "styled-components";
import Artifact from "@/components/artifact";
import { FaPlus } from "react-icons/fa6";

export type MetaMap = {
  key: string;
  value: string;
  idx: number;
};

interface InscribeImageProps {
  inscribedCallback: () => void;
  generated?: boolean;
}

const InscribeImage: React.FC<InscribeImageProps> = ({ inscribedCallback, generated }) => {
  useSignals();
  const [selectedCollection, setSelectedCollection] = useState<string>();
  const [inscribeStatus, setInscribeStatus] = useState<FetchStatus>(FetchStatus.Idle);
  const [collectionEnabled, setCollectionEnabled] = useState(false);
  const { data: userCollections, error } = useQuery<OrdUtxo[]>({
    queryKey: ["collections", ordAddress.value],
    queryFn: async () => {
      return await getCollectionUtxos(ordAddress.value);
    },
  });

  const { selectedFile, preview, isImage, handleFileChange } = useFileHandler({ generated });
  const [metadata, setMetadata] = useState<MetaMap[] | undefined>();

  const mapData = useMemo(() => {
    const md = metadata?.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as PreMAP);
    if (md) {
      md.app = "1satordinals.com";
      md.type = "ord";
      return md;
    }
  }, [metadata]);

  const clickInscribe = useCallback(async () => {
    if (!selectedFile || !payPk.value || !ordAddress.value || !fundingAddress.value) {
      return;
    }

    const utxos = await getUtxos(fundingAddress.value);
    // metadata
    const m =
      metadata && Object.keys(metadata).length > 0 ? mapData : undefined;
    let file: File | undefined;
    if (selectedFile.type === "") {
      const newType = mime.getType(selectedFile.name);
      console.log("new type", newType);
      if (newType !== null) {
        file = new File([selectedFile], selectedFile.name, { type: newType });
      }
    }
    if (!file) {
      file = selectedFile;
    }
    const pendingTx = await inscribeFile(utxos, file, m);
    if (pendingTx) {
      setPendingTxs([pendingTx]);
      inscribedCallback();
    }
  }, [selectedFile, payPk.value, ordAddress.value, fundingAddress.value, metadata, mapData, inscribedCallback]);

  const Input = styled.input`
    padding: 0.5rem;
    border-radius: 0.25rem;
    margin: 0.5rem 0 0.5rem 0;
  `;

  const Label = styled.label`
    display: flex;
    flex-direction: column;
  `;

  const submitDisabled = useMemo(() => {
    return !selectedFile || inscribeStatus === FetchStatus.Loading;
  }, [selectedFile, inscribeStatus]);

  const artifact = useMemo(async () => {
    return (
      selectedFile?.type &&
      typeof preview === "string" && (
        <Artifact
          classNames={{ media: "w-full h-full" }}
          latest={true}
          artifact={{
            data: {
              insc: {
                file: {
                  type: selectedFile.type,
                  size: selectedFile.size,
                }
              }
            } as TxoData,
            script: "",
            outpoint: "",
            txid: "",
            vout: 0,
          }}
          size={300}
          src={preview as string}
          sizes={""} />
      )
    );
  }, [preview, selectedFile]);

  const metaRow = useCallback(
    (meta: MetaMap) => {
      return (
        <div className="flex flex-row w-full" key={`metarow-${meta.idx}`}>
          <input
            type="text"
            disabled={meta.idx === 0}
            placeholder={
              [
                "ex. name",
                "ex. geohash",
                "ex. context",
                "ex. subcontext",
                "ex. url",
                "ex. tx",
                "ex. platform",
              ][meta.idx] || "Key"
            }
            className="w-1/2 p-2 mr-1 my-1 rounded"
            value={meta.key}
            onChange={(e) => {
              // update metadata MetaMap
              // where meta.idx === idx
              e.preventDefault();
              setMetadata(
                (metadata || []).map((m) => {
                  if (m.idx === meta.idx) {
                    return {
                      ...m,
                      // exclude whitespace, special characters, or any invalid key characters
                      key: e.target.value.replaceAll(/[^a-zA-Z0-9]/g, ""),
                    };
                  }
                  return m;
                })
              );
            }}
          />
          <input
            type="text"
            placeholder="Value"
            className="w-1/2 p-2 ml-1 my-1 rounded"
            value={meta.value}
            onChange={(e) => {
              // update metadata MetaMap
              // where meta.idx === idx
              e.preventDefault();
              setMetadata(
                (metadata || []).map((m) => {
                  if (m.idx === meta.idx) {
                    return {
                      ...m,
                      value: e.target.value,
                    };
                  }
                  return m;
                })
              );
            }}
          />
        </div>
      );
    },
    [metadata]
  );

  const metaHead = useMemo(
    () => (
      <div className="flex items-center justify-between">
        <div>Add Metadata (optional)</div>
        <div>
          <button
            type="button"
            className="bg-yellow-600 hover:bg-yellow-700 transition text-white p-1 rounded ml-2"
            onClick={() => {
              let key = "";
              let value = "";

              const initialKeys = [];
              if (!metadata?.some((m) => m.key === "name")) {
                key = "name";
                value = selectedFile?.name || "";
                initialKeys.push({ key, value, idx: metadata?.length || 0 });
              }

              const data = (metadata || []).concat(initialKeys || []);
              setMetadata(
                data.concat([
                  {
                    key: "",
                    value: "",
                    idx: data.length,
                  },
                ])
              );
            }}
          >
            <FaPlus />
          </button>
        </div>
      </div>
    ),
    [selectedFile, metadata]
  );

  const metaForm = useMemo(() => {
    // Form to add metadata to the image
    // each metadata is a key value pair of strings
    // and we need an add button to add more metadata

    return (
      <div className="my-4">
        {metaHead}
        {metadata?.map((m) => metaRow(m))}
      </div>
    );
  }, [metaHead, metaRow, metadata]);

  return (
    <div className="max-w-lg mx-auto">
      <CollectionItemForm
        userCollections={userCollections}
        selectedCollection={selectedCollection}
        setSelectedCollection={setSelectedCollection}
        collectionEnabled={collectionEnabled}
        setCollectionEnabled={setCollectionEnabled}
        setMetadata={setMetadata}
        selectedFile={selectedFile}
      />

      {(selectedFile || selectedCollection) && (
        <MetaForm
          metadata={metadata}
          setMetadata={setMetadata}
          selectedCollection={selectedCollection}
          selectedFile={selectedFile}
        />
      )}

      {!selectedFile && (
        <Label
          className={
            "min-h-[300px] min-w-[360px] md:min-w-[420px] rounded border border-dashed border-[#222] flex items-center justify-center"
          }
        >
          <TbClick className="text-6xl my-4 text-[#555]" />
          Choose a file to inscribe
          <Input type="file" className="hidden" onChange={handleFileChange} />
        </Label>
      )}

      {selectedFile && (
        <>
          <Label className={"rounded border border-dashed border-[#222] flex items-center justify-center"}>
            {selectedFile.name}
            <Input type="file" className="hidden" onChange={handleFileChange} />
            <div className="text-sm text-center w-full">{formatBytes(selectedFile.size)} Bytes</div>
          </Label>

          {preview && <hr className="my-2 h-2 border-0 bg-[#222]" />}

          {preview && <FilePreview selectedFile={selectedFile} preview={preview} isImage={isImage} />}
        </>
      )}

      <InscribeButton
        selectedFile={selectedFile}
        inscribeStatus={inscribeStatus}
        selectedCollection={selectedCollection}
        metadata={metadata}
        inscribedCallback={inscribedCallback}
      />
    </div>
  );
};

export default InscribeImage;