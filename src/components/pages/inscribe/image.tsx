// image.tsx
"use client";

import { FetchStatus } from "@/constants";
import { ordAddress } from "@/signals/wallet/address";
import type { OrdUtxo } from "@/types/ordinals";
import { getCollectionUtxos } from "@/utils/address";
import { formatBytes } from "@/utils/bytes";
import { useSignals } from "@preact/signals-react/runtime";
import type React from "react";
import { useState } from "react";
import { TbClick } from "react-icons/tb";
import CollectionItemForm from "./collectionItemForm";
import FilePreview from "./filePreview";
import InscribeButton from "./inscribeButton";
import MetaForm from "./metaForm";
import useFileHandler from "./useFileHandler";
import { useQuery } from "@tanstack/react-query";
import styled from "styled-components";

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

  const Input = styled.input`
    padding: 0.5rem;
    border-radius: 0.25rem;
    margin: 0.5rem 0 0.5rem 0;
  `;

  const Label = styled.label`
    display: flex;
    flex-direction: column;
  `;

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