import { useWallet } from "@/context/wallet";

import init, { P2PKHAddress, PrivateKey, PublicKey } from "bsv-wasm-web";
import { Inscription } from "js-1sat-ord";
import { head } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import sb from "satoshi-bitcoin";
import styled from "styled-components";
import { FetchStatus } from "./pages/home";

const Input = styled.input`
  padding: 0.5rem;
  border-radius: 0.25rem;
  margin: 0.5rem 0 0.5rem 0;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
`;

type WalletProps = {
  // onKeysGenerated: ({ payPk, ordPk }: { payPk: string; ordPk: string }) => void;
  // onInputTxidChange: (inputTxid: string) => void;
  // onUtxosChange: (utxos: Utxo[]) => void;
  // onFileChange: (file: File) => void;
  // onArtifactsChange: ({
  //   artifacts,
  //   inscribedUtxos,
  // }: {
  //   artifacts: Inscription[];
  //   inscribedUtxos: Utxo[];
  // }) => void;
  // callback: (callbackData: CallbackData) => void;
  // payPk: string | undefined;
  // ordPk: string | undefined;
  // utxos: Utxo[] | undefined;
  // file: File | undefined;
};

const Wallet: React.FC<WalletProps> = (
  {
    // onKeysGenerated,
    // payPk,
    // ordPk,
    // onInputTxidChange,
    // onUtxosChange,
    // onArtifactsChange,
    // utxos,
    // file,
    // callback,
    // onFileChange,
  }
) => {
  const {
    generateKeys,
    ordPk,
    payPk,
    fundingUtxos,
    getUtxoByTxId,
    currentTxId,
    changeAddress,
    backupFile,
    setCurrentTxId,
    refund,
    getUTXOs,
    fetchUtxosStatus,
    balance,
  } = useWallet();
  const [artifacts, setArtifacts] = useState<Inscription[]>();

  // const [inscriptions, setInscriptions] =
  //   useLocalStorage<Inscription[]>("1satins");
  const [showKeys, setShowKeys] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    const fire = async () => {
      await init();
      setInitialized(true);
    };
    if (!initialized) {
      fire();
    }
  }, [initialized, setInitialized]);

  const receiverAddress = useMemo(() => {
    console.log({ initialized });
    if (initialized && ordPk) {
      const wif = PrivateKey.from_wif(ordPk);
      const pk = PublicKey.from_private_key(wif);
      return wif && pk && P2PKHAddress.from_pubkey(pk).to_string();
    }
  }, [initialized, ordPk]);

  const handleConfirm = async () => {
    console.log("callback confirm");
    setShowKeys(false);
  };

  const readFileAsBase64 = (file: any) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = (reader?.result as string).split(",")[1];
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const utxo = head(fundingUtxos);
  const handleUploadClick = useCallback(() => {
    if (!backupFile) {
      const el = document.getElementById("backupFile");
      el?.click();
      return;
    }
    console.log({ backupFile });
  }, [backupFile]);

  if (fetchUtxosStatus === FetchStatus.Loading) {
    return <div className="flex flex-col w-full max-w-4xl mx-auto"></div>;
  }

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto">
      {(!ordPk || !payPk) && (
        <>
          <div className="w-full">
            <p>Import a wallet from existing backup</p>
            <button
              type="submit"
              onClick={handleUploadClick}
              className="w-full cursor-pointer p-2 bg-teal-600 text-xl rounded my-4 text-white"
            >
              Import Wallets
            </button>
          </div>
          <div className="w-full">
            <p>
              This will generate 2 local wallets. 1 for sats, and 1 for
              ordinals.
            </p>
            <button
              type="submit"
              onClick={() => {
                generateKeys();
                setShowKeys(true);
              }}
              className="w-full cursor-pointer p-2 bg-yellow-600 text-xl rounded my-4 text-white"
            >
              Generate Wallets
            </button>
          </div>
        </>
      )}
      {showKeys && (
        <div>
          <div className="w-full">
            <p>These are your keys. Keep them safe.</p>
            <pre>{payPk}</pre>
            <pre>{ordPk}</pre>
            <button
              type="submit"
              onClick={handleConfirm}
              className="w-full p-1 bg-yellow-600 text-xl cursor-pointer rounded my-4 text-white"
            >
              I Backed Them Up
            </button>
          </div>
        </div>
      )}
      {!showKeys && changeAddress && receiverAddress && (
        <div className="w-full max-w-lg mx-auto">
          <h1
            className="flex text-2xl items-center justify-center mt-8 hover:text-yellow-300 transition cursor-pointer"
            onClick={async () => {
              await getUTXOs(changeAddress);
            }}
          >
            {/* <QRCode value={changeAddress || ""} size={420} />
             */}
            {sb.toBitcoin(balance)} BSV
          </h1>
          <div className="flex items-center justify-center mb-8">Balance</div>

          <div className="my-4">
            <div className="flex justify-between text-teal-600">
              <div>Funding Address:</div>
              <div>{changeAddress}</div>
            </div>

            <div className="flex justify-between text-orange-600">
              <div>Ordinal Address:</div>
              <div>{receiverAddress}</div>
            </div>
          </div>

          {/* <div className="mt-4">
            <Label>
              Deposit TxID
              <Input
                type="text"
                className="w-full"
                value={currentTxId}
                onChange={(e) => {
                  setCurrentTxId(e.target.value);
                }}
              />
            </Label>
          </div> */}
          <div className="flex items-center justify-between">
            {/* <button
              className="p-2 bg-[#222] cursor-pointer rounded my-4"
              onClick={() => {
                if (currentTxId) {
                  getUtxoByTxId(currentTxId);
                }
              }}
            >
              Fetch By TxID
            </button> */}
            <div></div>
            <div></div>
            {/* {fundingUtxos && (
              <button
                className="p-2 bg-[#222] cursor-pointer rounded my-4"
                onClick={() => {
                  refund();
                }}
              >
                Send Balance
              </button>
            )} */}
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
