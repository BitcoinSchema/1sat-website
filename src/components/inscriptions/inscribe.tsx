import { PendingInscription, useWallet } from "@/context/wallet";
import { addressFromWif } from "@/utils/address";
import { head } from "lodash";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import styled from "styled-components";
import { FetchStatus } from "../pages/home";

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
  inscribedCallback: (inscription: PendingInscription) => void;
};

const Inscribe: React.FC<InscribeProps> = ({ inscribedCallback }) => {
  const {
    setPendingInscription,
    fundingUtxos,
    receiverAddress,
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

  const handleFileChange = (event: any) => {
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
  };
  const utxo = head(fundingUtxos);

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
          receiverAddress,
          changeAddress,
          fundingUtxo: utxo,
        }),
      });
      console.log({ status: response.status, response });
      if (response.status === 200) {
        const data = (await response.json()) as PendingInscription;
        console.log("Completion Data @ Client: ", response, data);

        setPendingInscription(data);
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

  useEffect(() => {
    console.log({ type: selectedFile?.type });
  }, [selectedFile]);

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto">
      <h1 className="text-white text-4xl my-4">Inscribe an Ordinal</h1>
      <div className="w-full">
        <Label className="min-h-[300px] rounded border flex items-center justify-center">
          Choose a file to inscribe
          <Input type="file" onChange={handleFileChange} />
        </Label>

        <hr className="my-2 h-2 border-0 bg-[#222]" />

        {preview && (
          <>
            {selectedFile?.type.startsWith("video") ? (
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
            <hr className="my-2 h-2 border-0 bg-[#222]" />
          </>
        )}

        <button
          disabled={!selectedFile || inscribeStatus === FetchStatus.Loading}
          type="submit"
          onClick={handleInscribing}
          className="w-full disabled:bg-gray-600 hover:bg-yellow-500 transition bg-yellow-600 enabled:cursor-pointer p-3 text-xl rounded my-4 text-white"
        >
          Preview
        </button>
      </div>
    </div>
  );
};

export default Inscribe;
