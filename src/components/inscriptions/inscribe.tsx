import { PendingTransaction, useWallet } from "@/context/wallet";
import { addressFromWif } from "@/utils/address";
import { formatBytes } from "@/utils/bytes";
import { Transaction } from "bsv-wasm-web";
import { head } from "lodash";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { TbClick } from "react-icons/tb";
import styled from "styled-components";
import Artifact from "../artifact";
import { FetchStatus } from "../pages";

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

  function readFileAsBase64(file: any) {
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

  const handleInscribing = async () => {
    setInscribeStatus(FetchStatus.Loading);
    try {
      const fileAsBase64 = await readFileAsBase64(selectedFile);
      const apiEndpoint = "/api/inscribe";
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          payPk,
          fileAsBase64,
          fileContentType: selectedFile?.type,
          ordAddress,
          changeAddress,
          fundingUtxo: utxo,
        }),
      });
      console.log({ status: response.status, response });
      if (response.status === 200) {
        const data = (await response.json()) as PendingTransaction;
        console.log("Completion Data @ Client: ", response, data);

        setPendingTransaction(data);
        const tx = Transaction.from_hex(data.rawTx);

        // setPendingOrdUtxo({
        //   txid:
        // } as OrdUtxo)

        inscribedCallback(data);
        setInscribeStatus(FetchStatus.Success);
      } else if (response.status === 402) {
        // payment required
        setInscribeStatus(FetchStatus.Error);
        const { error } = await response.json();
        throw new Error(error);
      } else {
        setInscribeStatus(FetchStatus.Error);
        const body = await response.text();
        throw new Error(body);
      }
    } catch (e) {
      setInscribeStatus(FetchStatus.Error);
      toast.error("Failed to inscribe " + e, {
        style: {
          background: "#333",
          color: "#fff",
        },
      });
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
            selectedFile ? "" : "min-h-[300px]"
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
          onClick={handleInscribing}
          className="w-full disabled:bg-[#222] disabled:text-[#555] hover:bg-yellow-500 transition bg-yellow-600 enabled:cursor-pointer p-3 text-xl rounded my-4 text-white"
        >
          Preview
        </button>
      </div>
    </div>
  );
};

export default Inscribe;
