import { addressFromWif } from "@/utils/address";
import { Utxo } from "js-1sat-ord";
import { useMemo, useState } from "react";
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
  callback: (rawTxString: string) => void;
  fundingUtxo: Utxo;
  payPk: string;
  receiverAddress: string;
  initialized: boolean;
};

const Inscribe: React.FC<InscribeProps> = ({
  callback,
  fundingUtxo,
  payPk,
  receiverAddress,
  initialized,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);

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
    console.log("Completion Data @ Client: ", data);

    callback(data.result);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto">
      <h1 className="text-white text-4xl my-4">Inscribe an Ordinal</h1>
      <div className="w-full">
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
        <Label>
          Choose a file to inscribe
          <Input type="file" onChange={handleFileChange} />
        </Label>

        {preview && (
          <img src={preview as string} alt="Preview" className="w-full" />
        )}

        <button
          type="submit"
          onClick={handleInscribing}
          className="w-full bg-yellow-600 p-1 text-xl rounded my-4 text-white"
        >
          Inscribe
        </button>
      </div>
    </div>
  );
};

export default Inscribe;
