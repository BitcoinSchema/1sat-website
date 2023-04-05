import { PendingTransaction, useWallet } from "@/context/wallet";
import { addressFromWif } from "@/utils/address";
import { formatBytes } from "@/utils/bytes";
import { PrivateKey } from "bsv-wasm-web";
import { createOrdinal } from "js-1sat-ord";
import { head } from "lodash";
import React, { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { TbClick } from "react-icons/tb";
import styled from "styled-components";
import Artifact from "../artifact";
import { FetchStatus, toastErrorProps } from "../pages";

const Input = styled.input`
  padding: 0.5rem;
  border-radius: 0.25rem;
  margin: 0.5rem 0 0.5rem 0;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
`;

type InscribeProps = {
  inscribedCallback: (inscription: PendingTransaction) => void;
};

const Inscribe: React.FC<InscribeProps> = ({ inscribedCallback }) => {
  const {
    setPendingTransaction,
    fundingUtxos,
    ordAddress,
    payPk,
    initialized,
  } = useWallet();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inscribeStatus, setInscribeStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);

  const changeAddress = useMemo(() => {
    if (initialized && payPk) {
      return addressFromWif(payPk);
    }
  }, [initialized, payPk]);

  function readFileAsBase64(file: any): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = (reader?.result as string).split(",")[1];
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });
  }

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
    [setPreview]
  );

  const utxo = useMemo(() => head(fundingUtxos), [fundingUtxos]);

  const clickInscribe = async () => {
    if (
      !utxo ||
      !payPk ||
      !selectedFile?.type ||
      !ordAddress ||
      !changeAddress
    ) {
      return;
    }
    setInscribeStatus(FetchStatus.Loading);
    try {
      const fileAsBase64 = await readFileAsBase64(selectedFile);
      try {
        setInscribeStatus(FetchStatus.Loading);
        const tx = await handleInscribing(
          payPk,
          fileAsBase64,
          selectedFile?.type,
          ordAddress,
          changeAddress,
          utxo
        );
        const satsIn = utxo.satoshis;
        const satsOut = Number(tx.satoshis_out());
        if (satsIn && satsOut) {
          const fee = satsIn - satsOut;

          if (fee < 0) {
            console.error("Fee inadequate");
            toast.error("Fee Inadequate", toastErrorProps);
            setInscribeStatus(FetchStatus.Error);
            return;
          }
          const result = {
            rawTx: tx.to_hex(),
            size: tx.get_size(),
            fee,
            numInputs: tx.get_ninputs(),
            numOutputs: tx.get_noutputs(),
            txid: tx.get_id_hex(),
          } as PendingTransaction;
          console.log(Object.keys(result));
          // res.status(200).json(result);

          console.log("Completion Data @ Client: ", result);

          setPendingTransaction(result);
          inscribedCallback(result);
          setInscribeStatus(FetchStatus.Success);
          // const tx = Transaction.from_hex(result.rawTx);
          return;
        }
      } catch (e) {
        console.error(e);
        setInscribeStatus(FetchStatus.Error);
        // res.status(500).send(e.toString());
        return;
      }
    } catch (e) {
      setInscribeStatus(FetchStatus.Error);
      toast.error("Failed to inscribe " + e, toastErrorProps);
      console.error(e);
    }
  };

  const artifact = useMemo(() => {
    console.log({ artifactType: selectedFile?.type });
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

  console.log({ preview });
  return (
    <div className="flex flex-col w-full max-w-xl mx-auto p-4">
      <div className="w-full">
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
        {/* {selectedFile?.type.startsWith("video") ? (
              <video
                src={preview as string}
                autoPlay={true}
                controls={true}
                loop={true}
                className="w-full"
              />
            ) : selectedFile?.type.startsWith("audio") ? (
              <audio
                src={preview as string}
                autoPlay
                controls
                className="w-full"
              />
            ) : (
              <img src={preview as string} alt="Preview" className="w-full" />
            )}

            </>
          )} */}

        {preview && <hr className="my-2 h-2 border-0 bg-[#222]" />}
        <button
          disabled={!selectedFile || inscribeStatus === FetchStatus.Loading}
          type="submit"
          onClick={clickInscribe}
          className="w-full disabled:bg-[#222] disabled:text-[#555] hover:bg-yellow-500 transition bg-yellow-600 enabled:cursor-pointer p-3 text-xl rounded my-4 text-white"
        >
          Preview
        </button>
      </div>
    </div>
  );
};

export default Inscribe;

const handleInscribing = async (
  payPk: string,
  fileAsBase64: string,
  fileContentType: string,
  ordAddress: string,
  changeAddress: string,
  fundingUtxo: any
) => {
  const paymentPk = PrivateKey.from_wif(payPk);

  // inscription
  const inscription = {
    dataB64: fileAsBase64,
    contentType: fileContentType,
  };

  try {
    const tx = await createOrdinal(
      fundingUtxo,
      ordAddress,
      paymentPk,
      changeAddress,
      0.06,
      inscription
    );
    return tx;
  } catch (e) {
    throw e;
  }
};
