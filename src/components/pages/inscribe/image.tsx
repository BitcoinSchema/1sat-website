import Artifact from "@/components/artifact";
import { useOrdinals } from "@/context/ordinals";
import { PendingTransaction, useWallet } from "@/context/wallet";
import { formatBytes } from "@/utils/bytes";
import { head } from "lodash";
import React, { useCallback, useMemo, useState } from "react";
import { TbClick } from "react-icons/tb";
import styled from "styled-components";
import { FetchStatus } from "..";

interface InscribeImageProps {
  inscribedCallback: (pendingTx: PendingTransaction) => void;
}

const InscribeImage: React.FC<InscribeImageProps> = ({ inscribedCallback }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);

  const [inscribeStatus, setInscribeStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  const { payPk, ordAddress, changeAddress, getUTXOs } = useWallet();
  const { inscribeFile } = useOrdinals();

  const handleFileChange = useCallback(
    (event: any) => {
      const file = event.target.files[0] as File;
      setSelectedFile(file);
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    },
    [setPreview, setSelectedFile]
  );

  const clickInscribe = useCallback(async () => {
    if (!selectedFile || !payPk || !ordAddress || !changeAddress) {
      return;
    }

    const utxos = await getUTXOs(changeAddress);
    const sortedUtxos = utxos.sort((a, b) =>
      a.satoshis > b.satoshis ? -1 : 1
    );
    const u = head(sortedUtxos);
    if (!u) {
      console.log("no utxo");
      return;
    }

    const pendingTx = await inscribeFile(u, selectedFile);
    if (pendingTx) {
      inscribedCallback(pendingTx);
    }
  }, [
    inscribedCallback,
    getUTXOs,
    changeAddress,
    inscribeFile,
    ordAddress,
    payPk,
    selectedFile,
  ]);

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

  const artifact = useMemo(() => {
    return (
      selectedFile?.type &&
      preview && (
        <Artifact
          classNames={{ media: "w-full h-full" }}
          contentType={selectedFile.type}
          src={preview as string}
        />
      )
    );
  }, [preview, selectedFile?.type]);

  return (
    <div className="max-w-lg mx-auto">
      <Label
        className={`${
          selectedFile ? "" : "min-h-[300px] min-w-[360px] md:min-w-[420px]"
        } rounded border border-dashed border-[#222] flex items-center justify-center`}
      >
        {!selectedFile && <TbClick className="text-6xl my-4 text-[#555]" />}
        {selectedFile ? selectedFile.name : "Choose a file to inscribe"}
        <Input type="file" className="hidden" onChange={handleFileChange} />
        {selectedFile && (
          <div className="text-sm text-center w-full">
            {formatBytes(selectedFile.size)} Bytes
          </div>
        )}
      </Label>
      {preview && <hr className="my-2 h-2 border-0 bg-[#222]" />}

      {selectedFile && preview && <>{artifact}</>}

      <button
        disabled={submitDisabled}
        type="submit"
        onClick={clickInscribe}
        className="w-full disabled:bg-[#222] disabled:text-[#555] hover:bg-yellow-500 transition bg-yellow-600 enabled:cursor-pointer p-3 text-xl rounded my-4 text-white"
      >
        Inscribe Image
      </button>
    </div>
  );
};

export default InscribeImage;
