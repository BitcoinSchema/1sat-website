import { useWallet } from "@/context/wallet";
import init, { P2PKHAddress, PrivateKey, PublicKey } from "bsv-wasm-web";
import { QRCodeSVG } from "qrcode.react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import toast, { LoaderIcon } from "react-hot-toast";
import { FiArrowDown, FiCopy } from "react-icons/fi";
import { RiErrorWarningFill } from "react-icons/ri";
import { TbCurrencyBitcoin } from "react-icons/tb";
import sb from "satoshi-bitcoin";
import styled from "styled-components";
import { FetchStatus, toastProps } from "./pages";

const Input = styled.input`
  padding: 0.5rem;
  border-radius: 0.25rem;
  margin: 0.5rem 0 0.5rem 0;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
`;

type WalletProps = {};

const Wallet: React.FC<WalletProps> = ({}) => {
  const {
    generateKeys,
    ordPk,
    payPk,
    changeAddress,
    backupFile,
    getUTXOs,
    fetchUtxosStatus,
    balance,
    send,
    usdRate,
  } = useWallet();

  const [showKeys, setShowKeys] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [showAddMoney, setShowAddMoney] = useState<boolean>(false);
  const [generateStatus, setGenerateStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  useEffect(() => {
    const fire = async () => {
      await init();
      setInitialized(true);
    };
    if (!initialized) {
      fire();
    }
  }, [initialized, setInitialized]);

  const ordAddress = useMemo(() => {
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

  const handleUploadClick = useCallback(() => {
    if (!backupFile) {
      const el = document.getElementById("backupFile");
      el?.click();
      return;
    }
    console.log({ backupFile });
  }, [backupFile]);

  if (fetchUtxosStatus === FetchStatus.Loading) {
    return (
      <div className="flex flex-col w-full max-w-4xl mx-auto">
        <LoaderIcon className="mx-auto" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto p-2 md:p-4">
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
              disabled={generateStatus === FetchStatus.Loading}
              onClick={async () => {
                setGenerateStatus(FetchStatus.Loading);
                await generateKeys();
                setGenerateStatus(FetchStatus.Success);
                setShowKeys(true);
              }}
              className="disabled:bg-[#222] disabled:text-[#555] w-full cursor-pointer p-2 bg-yellow-600 text-xl rounded my-4 text-white"
            >
              {generateStatus === FetchStatus.Loading
                ? "Generating"
                : "Generate"}{" "}
              Wallets
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

      {!showKeys && changeAddress && ordAddress && (
        <div className="w-full max-w-lg mx-auto">
          <div className="flex text-[#555] items-center justify-center mt-8 mb-2">
            Your Balance
          </div>
          <h1
            className="flex text-5xl font-medium items-center justify-center mt-2 mb-4 text-white transition cursor-pointer"
            onClick={async () => {
              await getUTXOs(changeAddress);
            }}
          >
            $
            {usdRate && balance
              ? (balance / usdRate).toFixed(2)
              : balance.toFixed(2)}
          </h1>
          <h2 className="mb-24 text-center text-teal-600">
            {sb.toBitcoin(balance)} BSV
          </h2>
          <div className="text-center w-full items-center flex md:px-8">
            <div
              className="rounded-full hover:bg-[#222] transition cursor-pointer bg-[#111] text-teal-600 flex items-center mx-auto w-36 justify-center px-4 p-2"
              onClick={() => setShowAddMoney(true)}
            >
              <TbCurrencyBitcoin className="mr-2" /> Add Money
            </div>
            <div
              className={`${
                balance > 0
                  ? "bg-[#111] text-yellow-400"
                  : "bg-[#222] hover:bg-[#222] text-[#555]"
              }  rounded-full cursor-pointer  transition  flex items-center mx-auto w-36 justify-center px-4 p-2`}
              onClick={() => {
                const address = prompt(
                  `ENTER AN ADDRESS. Sends entire ${balance} Sat BSV balance. 
                  
Must be a normal Bitcoin SV address starting with a 1.
                  
Do not send ordinals to this address, it is only for funding transactions.
                  
If you still have ordinals in your wallet, you will be unable to send them without BSV in your wallet.`
                );
                if (address) {
                  send(address);
                }
              }}
            >
              <FiArrowDown className="mr-2" /> Cash Out
            </div>
          </div>
          {showAddMoney && (
            <div
              className="left-0 top-0 overflow-hidden w-full h-full absolute flex items-center justify-center bg-[#555]/30 backdrop-blur"
              onClick={(e: React.MouseEvent<HTMLDivElement>) => {
                const target = (e.target as HTMLDivElement)?.id;
                if (target === "backdrop") {
                  setShowAddMoney(false);
                }
              }}
              id="backdrop"
            >
              <div className="flex flex-col text-center justify-between text-teal-600 bg-black max-w-2xl p-4 md:p-8 rounded-lg">
                <div>Send Funds to:</div>
                <div className="font-semibold md:text-xl my-2">
                  {changeAddress}
                </div>

                <div className="text-center rounded-lg h-full w-full">
                  <QRCodeSVG
                    value={changeAddress || ""}
                    className="w-full h-full"
                    includeMargin={true}
                  />
                </div>
                <CopyToClipboard
                  text={changeAddress}
                  onCopy={() => {
                    toast.success(
                      "Copied. Remember, send BSV only!",
                      toastProps
                    );
                    setShowAddMoney(false);
                  }}
                >
                  <button className="w-full p-2 text-lg bg-teal-400 rounded my-4 text-black font-semibold flex items-center">
                    <div className="mx-auto flex items-center justify-center">
                      <FiCopy className="w-10" />
                      <div>Copy BSV Address</div>
                    </div>
                  </button>
                </CopyToClipboard>
                <div className="text-yellow-500 text-xs sm:test-sm md:text-base flex justify-center items-center">
                  <RiErrorWarningFill className="mr-2" /> Do not send ordinals
                  to this address
                </div>
              </div>
            </div>
          )}

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
          {/* <div className="flex items-center justify-between">
            <div></div>
            <div></div>
            {fundingUtxos && (
              <button className="w-full p-2 bg-[#222] cursor-pointer rounded my-4">
                Send Money
              </button>
            )}
          </div> */}
        </div>
      )}
    </div>
  );
};

export default Wallet;
