import { useWallet } from "@/context/wallet";
import init, { P2PKHAddress, PrivateKey, PublicKey } from "bsv-wasm-web";
import { QRCodeSVG } from "qrcode.react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import toast, { LoaderIcon } from "react-hot-toast";
import { FiArrowDown, FiCopy } from "react-icons/fi";
import { RiErrorWarningFill } from "react-icons/ri";
import { TbCurrencyBitcoin, TbQuestionCircle } from "react-icons/tb";
import sb from "satoshi-bitcoin";
import Modal from "./modal";
import { FetchStatus, toastProps } from "./pages";

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
    mnemonic,
    setShowEnterPassphrase,
  } = useWallet();

  const [showKeys, setShowKeys] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [showMore, setShowMore] = useState<boolean>(false);
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

  const handleConfirm = useCallback(async () => {
    console.log("callback confirm");
    // encrypt keys
    setShowEnterPassphrase(true);
    setShowKeys(false);
  }, [setShowEnterPassphrase]);

  const handleUploadClick = useCallback(() => {
    if (!backupFile) {
      const el = document.getElementById("backupFile");
      el?.click();
      return;
    }
    console.log({ backupFile });
  }, [backupFile]);

  const handleSeedClick = useCallback(() => {
    const phrase = prompt("Enter your 12 word seed phrase.");
    if (!phrase) {
      return;
    }
    // TODO
    return;
  }, []);

  if (fetchUtxosStatus === FetchStatus.Loading) {
    return (
      <div className="flex flex-col w-full max-w-4xl mx-auto">
        <LoaderIcon className="mx-auto" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto p-2 md:p-4 text-[#777]">
      {(!ordPk || !payPk) && (
        <>
          <div className="w-full group">
            <p className="md:opacity-0 group-hover:opacity-100 transition">
              Generate new keys, and encrypt them with a passphrase.
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
                : "Create New"}{" "}
              Wallet
            </button>
          </div>
          <div className="flex relative">
            <div className="w-full group w-1/2 mr-2">
              <p className="md:opacity-0 group-hover:opacity-100 transition absolute bottom-0 left-0 w-full h-full pointer-events-none">
                Import a wallet you've previously backed up.
              </p>
              <button
                type="submit"
                onClick={handleUploadClick}
                className="mt-10 w-full cursor-pointer p-2 bg-teal-600 text-xl rounded my-4 text-white"
              >
                Import Backup File
              </button>
            </div>
            <div className="w-full group w-1/2 ml-2">
              <p className="md:opacity-0 group-hover:opacity-100 transition absolute bottom-0 left-0 w-full h-full pointer-events-none">
                Use your 12 word mnemonic seed phrase to restore your wallet.
              </p>
              <button
                type="submit"
                onClick={handleSeedClick}
                className="mt-10 w-full cursor-pointer p-2 bg-gray-600 text-xl rounded my-4 text-white"
              >
                Use Seed Phrase
              </button>
            </div>
          </div>
        </>
      )}
      {showKeys && (
        <div className="w-full">
          <div className="w-full text-[#aaa]">
            <p className="text-2xl text-center text-purple-200 font-bold mb-4">
              Save your Seed Phrase
            </p>
            <div className="cursor-pointer hover:text-blue-400 transition mb-4 flex items-center justify-center">
              <p onClick={() => setShowMore(true)}>
                Record these words in order
              </p>
              <TbQuestionCircle className="ml-2 text-blue-300" />
            </div>
            {showMore && (
              <p className="mb-4">
                This is your seed phrase. We used it to generate your keys. It
                can be used to restore your wallet. Do not share it with anyone
                including us! We will never ask you for your seed phrase.
              </p>
            )}
            <div className="cursor-pointer hover:bg-[#333] transition my-4 mx-auto rounded bg-[#222] w-full p-4 text-yellow-500">
              <CopyToClipboard
                text={mnemonic || ""}
                onCopy={() => {
                  if (mnemonic) {
                    toast.success(
                      "Copied seed phrase. Careful now!",
                      toastProps
                    );
                  }
                }}
              >
                <div className="flex items-center justify-center">
                  {mnemonic}
                  <FiCopy className="w-8 h-8" />
                </div>
              </CopyToClipboard>
            </div>
            <button
              type="submit"
              onClick={handleConfirm}
              className="w-full p-1 bg-yellow-600 text-xl cursor-pointer rounded my-4 text-white"
            >
              Encrypt Keys & Continue
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
            <Modal onClose={() => setShowAddMoney(false)}>
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
            </Modal>
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
