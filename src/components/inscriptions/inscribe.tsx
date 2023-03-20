import { CallbackData, FetchStatus } from "@/pages";
import { addressFromWif } from "@/utils/address";
import { Utxo } from "js-1sat-ord";
import { useMemo, useState } from "react";
import { RxReset } from "react-icons/rx";
import styled from "styled-components";

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
  callback: (callbackData: CallbackData) => void;
  fundingUtxo: Utxo;
  payPk: string;
  receiverAddress: string;
  initialized: boolean;
  reset: () => void;
};

const Inscribe: React.FC<InscribeProps> = ({
  callback,
  fundingUtxo,
  payPk,
  receiverAddress,
  initialized,
  reset,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
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
    const file = event.target.files[0];
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
          receiverAddress,
          changeAddress,
          fundingUtxo,
        }),
      });
      const data = await response.json();
      setInscribeStatus(FetchStatus.Success);
      console.log("Completion Data @ Client: ", data);

      callback(data.result);
    } catch (e) {
      setInscribeStatus(FetchStatus.Error);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto">
      <h1 className="text-white text-4xl my-4">Inscribe an Ordinal</h1>
      <div className="w-full">
        <div className="rounded bg-[#222] p-4 mb-4 text-xs flex flex-col">
          <div>
            Using output #{fundingUtxo.vout} ({fundingUtxo.satoshis} Sat )
          </div>
          <div>{fundingUtxo.txid}</div>
        </div>
        {/* <Label>
          Payment PK Input
          <Input
            type="div"
            onChange={handlePaymentPKChange}
            value={paymentPKInput}
          />
        </Label> */}
        {/* <Label>
          Receiver Address
          <Input
            type="div"
            onChange={handleReceiverAddressChange}
            value={receiverAddress}
          />
        </Label> */}

        {/* <Label>
          Change Address
          <Input
            type="div"
            onChange={handleChangeAddressChange}
            value={changeAddress}
          />
        </Label> */}
        <hr className="my-2 h-2 border-0 bg-[#222]" />
        <Label>
          Choose a file to inscribe
          <Input type="file" onChange={handleFileChange} />
        </Label>

        <hr className="my-2 h-2 border-0 bg-[#222]" />

        {preview && (
          <>
            <img src={preview as string} alt="Preview" className="w-full" />
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
        {selectedFile && (
          <button
            onClick={() => {
              reset();
            }}
            className="w-full p-2 text-lg bg-gray-400 rounded my-4 text-black font-semibold"
          >
            <div className="mx-auto flex items-center justify-center">
              <RxReset className="w-10" />
              <div>Start Over</div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default Inscribe;
