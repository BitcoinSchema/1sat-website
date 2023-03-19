import { useLocalStorage } from "@/utils/storage";
import { PrivateKey } from "bsv-wasm";
import { useState } from "react";
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
};

const Inscribe: React.FC<InscribeProps> = ({ callback }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const [preview, setPreview] = useState<string | ArrayBuffer | null>(null);

  const [paymentPKInput, setPaymentPKInput] = useLocalStorage(
    "1satfk",
    PrivateKey.from_random().to_wif()
  );
  const [receiverAddress, setReceiverAddress] = useLocalStorage(
    "1satdsta",
    "152AJEcn4mXAh84L5BBBrufDsQv37mSAdH"
  );
  const [changeAddress, setChangeAddress] = useLocalStorage(
    "1satcga",
    "1MF2wWoVGMqdpik614JdHscEPDLd4N5VHT"
  );
  const [inputTxid, setInputTxid] = useLocalStorage(
    "1satutxoid",
    "42ca4a6de42e8b0746b4b8408ba2597d40554bb7d95f17e282b31472cdc13382"
  );

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
  const handleInputTxChange = (event: any) => {
    setInputTxid(event.target.value);
  };
  const handlePaymentPKChange = (event: any) => {
    setPaymentPKInput(event.target.value);
  };
  const handleReceiverAddressChange = (event: any) => {
    setReceiverAddress(event.target.value);
  };
  const handleChangeAddressChange = (event: any) => {
    setChangeAddress(event.target.value);
  };

  const handleInscribing = async () => {
    // //bsv.PrivateKey
    // const paymentPk = PrivateKey.from_wif(paymentPKInput);
    const fileAsBase64 = await readFileAsBase64(selectedFile);
    // console.log(fileAsBase64);
    // const ordinal = {
    //     satoshis: 1,
    //     txid: inscriptionInputTxid,
    //     script:
    //       'OP_DUP OP_HASH160 b87db78cba867b9f5def9f48d00ec732493ee543 OP_EQUALVERIFY OP_CHECKSIG',
    //     vout: 0,
    //   };

    //   const utxo = {
    //     satoshis: 269114,
    //     txid: inscriptionInputTxid,
    //     script:
    //       'OP_DUP OP_HASH160 df936f6867bf13de0feef81b3fd14804c35e8cc6 OP_EQUALVERIFY OP_CHECKSIG',
    //     vout: 1,
    //   };

    //   // inscription
    //   const inscription = { data: fileAsBase64, contentType: 'model/gltf-binary' };

    //   // returns Promise<Transaction>
    //   const tx =
    //     createOrdinal(utxo, receiverAddress, paymentPk, changeAddress, inscription);

    const apiEndpoint = "/api/inscribe";
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentPKInput,
        fileAsBase64,
        inputTxid,
        receiverAddress,
        changeAddress,
      }),
    });
    const data = await response.json();
    console.log("Completion Data @ Client: ", data);

    callback(data.result.completion);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto">
      <div className="w-full">
        <Label>
          Choose a transaction ID to fund mint
          <Input onChange={handleInputTxChange} value={inputTxid} />
        </Label>

        <Label>
          Payment PK Input
          <Input
            type="div"
            onChange={handlePaymentPKChange}
            value={paymentPKInput}
          />
        </Label>
        <Label>
          Receiver Address
          <Input
            type="div"
            onChange={handleReceiverAddressChange}
            value={receiverAddress}
          />
        </Label>

        <Label>
          Change Address
          <Input
            type="div"
            onChange={handleChangeAddressChange}
            value={changeAddress}
          />
          <Input type="file" onChange={handleFileChange} />
        </Label>

        {preview && <img src={preview as string} alt="Preview" />}

        <button
          type="submit"
          onClick={handleInscribing}
          className="w-full bg-yellow-600 text-xl rounded my-4 text-white"
        >
          Inscribe
        </button>
      </div>
    </div>
  );
};

export default Inscribe;
