import { useWallet } from "@/context/wallet";
import { EncryptDecrypt } from "@/context/wallet/types";
import { restoreKeysFromMnemonic } from "@/utils/keys";
import init, { P2PKHAddress, PrivateKey, PublicKey } from "bsv-wasm-web";
import { QRCodeSVG } from "qrcode.react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import toast from "react-hot-toast";
import { FiArrowDown, FiCopy } from "react-icons/fi";
import { RiErrorWarningFill } from "react-icons/ri";
import { TbCurrencyBitcoin, TbQuestionCircle } from "react-icons/tb";
import sb from "satoshi-bitcoin";
import { default as AnimatedLogo3D } from "./animatedLogo3d";
import MnemonicGrid, {
  MnemonicGridMode,
  MnemonicResult,
} from "./mnemonicGrid/index";
import Modal from "./modal";
import { FetchStatus, toastErrorProps, toastProps } from "./pages";

type WalletProps = {};

const Wallet: React.FC<WalletProps> = ({}) => {
  const {
    generateKeys,
    ordPk,
    payPk,
    backupFile,
    getUTXOs,
    fetchUtxosStatus,
    balance,
    send,
    usdRate,
    mnemonic,
    setShowEnterPassphrase,
    encryptedBackupJson,
    fetchOrdinalUtxosStatus,
    generateStatus,
    changeAddress,
    changeAddressPath,
    ordAddressPath,
  } = useWallet();

  const [viewMode, setViewMode] = useState<MnemonicGridMode>(
    MnemonicGridMode.View
  );
  const [showKeys, setShowKeys] = useState<boolean>(false);
  const [hoveringButton, setHoveringButton] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [showMore, setShowMore] = useState<boolean>(false);
  const [showAddMoney, setShowAddMoney] = useState<boolean>(false);
  const [wordCount, setWordCount] = useState<number>(0);

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

  const handleShowConfirm = useCallback(async () => {
    console.log("callback confirm");
    setViewMode(MnemonicGridMode.Prove);
    // encrypt keys
  }, [setViewMode]);

  const handleProve = useCallback(
    async ({ verified }: MnemonicResult) => {
      console.log("callback prove");
      if (verified) {
        // encrypt keys
        setShowEnterPassphrase(EncryptDecrypt.Encrypt);
        setShowKeys(false);
        toast.success("Nice work! Seed phrase secure.", toastProps);
      } else {
        toast.success("Let's try that again.", toastErrorProps);
        setViewMode(MnemonicGridMode.View);
      }
    },
    [setViewMode, setShowKeys, setShowEnterPassphrase]
  );

  const handleUploadClick = useCallback(() => {
    if (!backupFile) {
      const el = document.getElementById("backupFile");
      el?.click();
      return;
    }
    console.log({ backupFile });
  }, [backupFile]);

  const handleSeedClick = useCallback(async () => {
    setViewMode(MnemonicGridMode.Import);
    setShowKeys(true);
    // const phrase = prompt("Enter your 12 word seed phrase.");
    // if (!phrase) {
    //   return;
    // }
    // await restoreKeysFromMnemonic(phrase);
    // TODO
    return;
  }, [setShowKeys, setViewMode]);

  const handleWordClick = useCallback(
    (word: string) => {
      console.log("Clicked word", word, wordCount);
      if (word === "reset") {
        setWordCount(0);
        return;
      }
      if (word !== mnemonic?.split(" ")[wordCount]) {
        toast.error("Wrong word :( You should start over.", toastErrorProps);
      }
      setWordCount(wordCount + 1);
    },
    [mnemonic, setWordCount, wordCount]
  );

  const handleImport = useCallback(
    async ({ words }: MnemonicResult) => {
      toast.success("Importing mnemonic phrase", toastProps);
      setViewMode(MnemonicGridMode.View);
      setShowKeys(false);
      // const phrase = prompt("Enter your 12 word seed phrase.");
      // if (!phrase) {
      //   return;
      // }
      if (words) {
        await restoreKeysFromMnemonic(words.join(" "));
      }
      // TODO
      return;
    },
    [setViewMode, setShowKeys]
  );

  // if (fetchUtxosStatus === FetchStatus.Loading) {
  //   return (
  //     <div className="flex flex-col w-full max-w-4xl mx-auto">
  //       <LoaderIcon className="mx-auto" />
  //     </div>
  //   );
  // }

  const showProve = useCallback(() => {
    setViewMode(MnemonicGridMode.Prove);
  }, [setViewMode]);

  return (
    <div className="flex flex-col w-full max-w-xl mx-auto p-2 md:p-4 text-[#777]">
      {(!ordPk || !payPk) && viewMode !== MnemonicGridMode.Import && (
        <div className="mx-auto">
          <AnimatedLogo3D
            hover={hoveringButton || generateStatus === FetchStatus.Loading}
            boost={generateStatus === FetchStatus.Loading}
          />
        </div>
      )}
      {(!ordPk || !payPk) &&
        !encryptedBackupJson &&
        viewMode !== MnemonicGridMode.Import && (
          <>
            <div className="w-full group">
              <p className="md:opacity-0 group-hover:opacity-100 transition">
                Generate new keys, and encrypt them with a passphrase.
              </p>
              <button
                type="submit"
                disabled={generateStatus === FetchStatus.Loading}
                onClick={async () => {
                  await generateKeys();

                  setShowKeys(true);
                }}
                className="group relative transition disabled:bg-[#222] disabled:text-[#555] w-full cursor-pointer p-2 bg-[#FFC107] hover:bg-[#FFD54F] text-[#333] text-xl rounded my-4 text-[#111]"
                onMouseEnter={() => setHoveringButton(true)}
                onMouseLeave={() => setHoveringButton(false)}
              >
                <span className="pulse absolute inset-0 rounded hover:animate-pulse"></span>

                <span className="relative">
                  {generateStatus === FetchStatus.Loading
                    ? "Generating"
                    : "Create New"}{" "}
                  Wallet
                </span>
              </button>
            </div>
            <div className="flex relative">
              <div className="w-full group w-1/2 mr-2">
                <p
                  className={`${
                    generateStatus === FetchStatus.Loading
                      ? "opacity-0"
                      : "group-hover:opacity-100"
                  } md:opacity-0 transition absolute bottom-0 left-0 w-full h-full pointer-events-none`}
                >
                  Import a wallet you've previously backed up.
                </p>
                <button
                  disabled={generateStatus === FetchStatus.Loading}
                  type="submit"
                  onClick={handleUploadClick}
                  className={`transition mt-10 w-full cursor-pointer p-2 bg-[#222] disabled:bg-[#222] hover:bg-[#333] text-lg rounded my-4 text-[#aaa]`}
                >
                  Import Backup File
                </button>
              </div>
              <div className="w-full group w-1/2 ml-2">
                <p
                  className={`${
                    generateStatus === FetchStatus.Loading
                      ? "opacity-0"
                      : "group-hover:opacity-100"
                  } md:opacity-0 transition absolute bottom-0 left-0 w-full h-full pointer-events-none`}
                >
                  Use your 12 word mnemonic seed phrase to restore your wallet.
                </p>
                <button
                  disabled={generateStatus === FetchStatus.Loading}
                  type="submit"
                  onClick={handleSeedClick}
                  className="transition mt-10 w-full cursor-pointer p-2 bg-[#222] disabled:bg-[#222] hover:bg-[#333] text-lg rounded my-4 text-[#aaa]"
                >
                  Use Seed Phrase
                </button>
              </div>
            </div>
          </>
        )}
      {(!ordPk || !payPk) &&
        encryptedBackupJson &&
        fetchOrdinalUtxosStatus !== FetchStatus.Loading &&
        (!payPk || !ordPk) && (
          <div
            className="max-w-md rounded my-8 bg-[#222] hover:bg-[#333] cursor-pointer mx-auto p-4 md:p-8"
            onClick={() => {
              setShowEnterPassphrase(EncryptDecrypt.Decrypt);
            }}
          >
            {"Your wallet is encrypted. Enter your passphrase to unlock it."}
          </div>
        )}
      {showKeys && (
        <div className="w-full">
          <div className="w-full text-[#aaa]">
            <p className="text-2xl text-center text-[#aaa] font-bold mb-4">
              {viewMode === MnemonicGridMode.Import && "Import Seed Phrase"}
              {viewMode === MnemonicGridMode.View && "Save your Seed Phrase"}
              {viewMode === MnemonicGridMode.Prove && "Verify Seed Phrase"}
            </p>
            <div
              className="cursor-pointer hover:text-blue-400 transition mb-4 flex items-center justify-center"
              onClick={() => setShowMore(true)}
            >
              <p>
                {viewMode === MnemonicGridMode.Prove &&
                  wordCount > 0 &&
                  `Enter word #${wordCount + 1}`}
                {viewMode === MnemonicGridMode.Prove &&
                  wordCount === 0 &&
                  "Click your words in order!"}
                {viewMode === MnemonicGridMode.View &&
                  "Record these words in order"}
                {viewMode === MnemonicGridMode.Import &&
                  "Enter your words in order!"}
              </p>
              <TbQuestionCircle className="ml-2 text-blue-300" />
            </div>
            {showMore && (
              <>
                <p className="mb-4">
                  This is your seed phrase. We used it to generate your keys. It
                  can be used to restore your wallet. Do not share it with
                  anyone including us! We will never ask you for your seed
                  phrase.
                </p>
                <p>
                  {changeAddress && (
                    <div>
                      Funding Address: {changeAddress} {changeAddressPath}
                    </div>
                  )}
                  {ordAddress && (
                    <div>
                      Ordinal Address: {ordAddress} {ordAddressPath}
                    </div>
                  )}
                </p>
              </>
            )}

            {viewMode === MnemonicGridMode.View && (
              <MnemonicGrid
                onWordClick={handleWordClick}
                onSubmit={showProve}
                mode={MnemonicGridMode.View}
                mnemonic={mnemonic}
              />
            )}
            {viewMode === MnemonicGridMode.Prove && (
              <MnemonicGrid
                onWordClick={handleWordClick}
                onSubmit={handleProve}
                mode={MnemonicGridMode.Prove}
                mnemonic={mnemonic}
              />
            )}
            {viewMode === MnemonicGridMode.Import && (
              <MnemonicGrid
                onWordClick={handleWordClick}
                onSubmit={handleImport}
                mode={MnemonicGridMode.Import}
              />
            )}

            {viewMode === MnemonicGridMode.View && (
              <button
                type="submit"
                disabled={generateStatus === FetchStatus.Loading}
                className="group relative transition disabled:bg-[#222] disabled:text-[#555] w-full cursor-pointer p-2 bg-[#FFC107] hover:bg-[#FFD54F] text-[#333] text-xl rounded my-4 text-[#111]"
                onMouseEnter={() => setHoveringButton(true)}
                onMouseLeave={() => setHoveringButton(false)}
                onClick={handleShowConfirm}
              >
                <span className="pulse absolute inset-0 rounded hover:animate-pulse"></span>
                I wrote it down
              </button>
            )}
          </div>
        </div>
      )}

      {!showKeys &&
        viewMode !== MnemonicGridMode.Prove &&
        changeAddress &&
        ordAddress && (
          <div className="w-full max-w-lg mx-auto">
            <div className="flex text-[#555] items-center justify-center mt-8 mb-2">
              Your Balance
            </div>
            <h1
              className="flex text-5xl font-medium items-center justify-center mt-2 mb-4 text-white transition cursor-pointer font-sans"
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
          </div>
        )}
    </div>
  );
};

export default Wallet;
