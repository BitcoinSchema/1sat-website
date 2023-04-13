import oneSatLogo from "@/assets/images/oneSatLogoDark.svg";
import { useBitsocket } from "@/context/bitsocket";
import { useStorage } from "@/context/storage";
import { useWallet } from "@/context/wallet";
import { generatePassphrase } from "@/utils/passphrase";
import { P2PKHAddress, PrivateKey, PublicKey } from "bsv-wasm-web";
import Image from "next/image";
import Router, { useRouter } from "next/router";
import React, {
  ChangeEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import CopyToClipboard from "react-copy-to-clipboard";
import toast, { Toaster } from "react-hot-toast";
import { FiCopy } from "react-icons/fi";
import { RiErrorWarningFill } from "react-icons/ri";
import Modal from "../modal";
import * as S from "./styles";
export enum FetchStatus {
  Idle,
  Loading,
  Success,
  Error,
}

export const toastProps = {
  style: {
    background: "#333",
    color: "#fff",
  },
  iconTheme: {
    primary: "#111",
    secondary: "#0fffc3",
  },
};

export const toastErrorProps = {
  style: {
    background: "#333",
    color: "#fff",
  },
  iconTheme: {
    primary: "#111",
    secondary: "#f63b42",
  },
};

export enum ConnectionStatus {
  IDLE = 0,
  CONNECTING = 1,
  OPEN = 2,
  FAILED = 3,
}

interface Props {
  children?: ReactNode;
}

const Layout: React.FC<Props> = ({ children }) => {
  const {
    fetchUtxosStatus,
    getUTXOs,
    setBackupFile,
    backupFile,
    deleteKeys,
    payPk,
    backupKeys,
    changeAddress,
    ordPk,
    initialized,
    loadEncryptedKeys,
    encryptedBackup,
    setEncryptedBackup,
    setSaltPubKey,
    showEnterPassphrase,
    setShowEnterPassphrase,
    passphrase,
    setPassphrase,
  } = useWallet();

  const {
    encryptionKey,
    setEncryptionKey,
    generateEncryptionKey,
    getItem,
    setItem,
    ready,
    setEncryptionKeyFromPassphrase,
  } = useStorage();

  const { connectionStatus, connect, ordAddress } = useBitsocket();

  const router = useRouter();
  useEffect(() => {
    const fire = async (a: string) => {
      await getUTXOs(a);
    };

    if (changeAddress && fetchUtxosStatus === FetchStatus.Idle) {
      fire(changeAddress);
    }
  }, [getUTXOs, fetchUtxosStatus, changeAddress]);

  const oAddress = useMemo(() => {
    if (initialized && ordPk) {
      const wif = PrivateKey.from_wif(ordPk);
      const pk = PublicKey.from_private_key(wif);
      return wif && pk && P2PKHAddress.from_pubkey(pk).to_string();
    }
  }, [initialized, ordPk]);

  useEffect(() => {
    if (
      oAddress &&
      connectionStatus !== ConnectionStatus.CONNECTING &&
      (!ordAddress ||
        ordAddress !== oAddress ||
        connectionStatus === ConnectionStatus.IDLE)
    ) {
      connect(oAddress);
    }
  }, [ordAddress, oAddress, connect, connectionStatus]);

  // Load encrypted backup from storage if available
  useEffect(() => {
    const fire = async () => {
      const eb = await getItem("encryptedBackup", false);
      if (!eb) {
        console.log("no encrypted backup in storage");
      } else {
        console.log("got encrypted backup", { eb });
        setEncryptedBackup(eb);
      }
    };
    if (ready && !encryptedBackup) {
      fire();
    }
  }, [setEncryptedBackup, ready, getItem, encryptedBackup]);

  useEffect(() => {
    console.log({ encryptionKey, encryptedBackup, payPk, ordPk });
  }, [encryptionKey, encryptedBackup, payPk, ordPk]);

  // if we have keys, and an encryptionKey but no encryptedBackup
  useEffect(() => {
    const storeEncryptedKeys = async () => {
      if (payPk && ordPk && !encryptedBackup && encryptionKey) {
        const keyData = JSON.stringify({ payPk, ordPk });
        const storedData = await setItem("encryptedBackup", keyData, true);
        const storedData2 = await setItem(
          "saltPubKey",
          PrivateKey.from_wif(payPk).to_public_key().to_hex(),
          false
        );
        setEncryptedBackup(storedData);
        setSaltPubKey(storedData2);
      }
    };

    storeEncryptedKeys();
  }, [
    ordPk,
    payPk,
    encryptedBackup,
    setItem,
    setEncryptedBackup,
    encryptionKey,
    setSaltPubKey,
  ]);

  const importKeys = useCallback(() => {
    if (!backupFile) {
      const el = document.getElementById("backupFile");
      el?.click();
      return;
    }
    console.log({ backupFile });
  }, [backupFile]);

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        console.log("handleFileChange called", e.target.files[0]);
        setBackupFile(e.target.files[0]);
        Router?.push("/wallet");
      }
    },
    [setBackupFile]
  );

  // const encryptKeys = useCallback(async () => {
  //   if (!payPk) {
  //     return;
  //   }

  //   if (!passphrase || passphrase.length < 6) {
  //     toast.error("Invalid phrase. Too short.", toastErrorProps);
  //     return;
  //   }

  //   const pubKeyBytes = PrivateKey.from_wif(payPk).to_public_key().to_bytes();
  //   await setItem(
  //     "publicKey",
  //     Buffer.from(pubKeyBytes).toString("base64"),
  //     false
  //   );

  //   const ec = generateEncryptionKey(
  //     passphrase,
  //     PrivateKey.from_wif(payPk).to_public_key().to_bytes()
  //   );
  //   setEncryptionKey(ec);
  // }, [
  //   setEncryptionKey,
  //   generateEncryptionKey,
  //   setEncryptedBackup,
  //   payPk,
  //   ordPk,
  //   passphrase,
  // ]);

  const handlePassphraseChange = useCallback(
    (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      setPassphrase(e.target.value);
    },
    [setPassphrase]
  );

  const handleClickEncrypt = useCallback(async () => {
    if (passphrase) {
      console.log("encrypt keys", { passphrase });
      try {
        await setEncryptionKeyFromPassphrase(passphrase);
      } catch (e) {
        console.error(e);
        toast.error("Failed to encrypt keys", toastErrorProps);
      }
    }
  }, [passphrase, setEncryptionKeyFromPassphrase]);

  const handleClickGenerate = useCallback(() => {
    const phrase = generatePassphrase(2);
    setPassphrase(phrase);
  }, [setPassphrase]);

  return (
    <div className="min-h-[100vh] min-w-[100vw] flex flex-col justify-between text-yellow-400 font-mono">
      <div className="mx-auto">
        <div
          className="text-2xl md:opacity-25 md:hover:opacity-100 duration-700 transition mt-6 text-white cursor-pointer"
          onClick={() => Router.push("/")}
        >
          {router.pathname !== "/" && (
            <Image
              src={oneSatLogo}
              // onClick={() => Router?.push("/wallet")}
              alt={"1Sat Ordinals"}
              className="w-8 h-8 cursor-pointer mx-auto rounded"
              style={{
                animation: "opulcity 8s infinite",
              }}
            />
          )}
        </div>
      </div>
      <div className="min-h-[calc(100vh-8rem)] h-full flex flex-col items-center">
        {children}
      </div>
      <div
        className="max-w-7xl mx-auto  h-10 flex items-center justify-center font-mono text-yellow-400 py-8 p-2"
        style={{
          height: "4rem",
          textAlign: "center",
        }}
      >
        <a
          className="font-mono text-yellow-400"
          href="https://docs.1satordinals.com"
        >
          Protocol
        </a>
        {!payPk && encryptedBackup && (
          <>
            <div className="mx-4">·</div>
            <div className="cursor-pointer" onClick={() => loadEncryptedKeys()}>
              Unlock Wallet
            </div>
          </>
        )}

        {!encryptedBackup && !payPk && <div className="mx-4">·</div>}

        {payPk && encryptedBackup && <div className="mx-4">·</div>}

        {payPk && (
          <div className="cursor-pointer" onClick={backupKeys}>
            Backup Keys
          </div>
        )}

        {!payPk && !encryptedBackup && (
          <div className="cursor-pointer" onClick={importKeys}>
            Import Keys
          </div>
        )}

        {payPk && !encryptedBackup && <div className="mx-4">·</div>}

        {payPk && !encryptedBackup && (
          <div
            className="cursor-pointer"
            onClick={() => setShowEnterPassphrase(true)}
          >
            Encrypt Keys
          </div>
        )}

        {payPk && <div className="mx-4">·</div>}

        {payPk && (
          <div className="cursor-pointer text-red-500" onClick={deleteKeys}>
            Delete Keys
          </div>
        )}
        <div>
          {showEnterPassphrase && (
            <Modal onClose={() => setShowEnterPassphrase(false)}>
              <div className="flex flex-col text-center justify-between text-teal-600 bg-black max-w-2xl p-4 md:p-8 rounded-lg">
                <h1 className="text-2xl">Enter a passphrase</h1>
                <div className="my-4">
                  This will encrypt your locally stored keys.
                  <br />
                  You still need to keep your seed phrase safe and private.
                </div>
                <div className="font-semibold md:text-xl my-2 relative">
                  <div className="absolute right-0 h-full flex items-center justify-center mr-2 cursor-pointer">
                    <CopyToClipboard
                      text={passphrase || ""}
                      onCopy={() => {
                        toast.success(
                          "Copied phrase. Careful now!",
                          toastProps
                        );
                      }}
                    >
                      <button
                        disabled={!passphrase}
                        className="disabled:text-[#555] transition text-black font-semibold font-mono"
                      >
                        <FiCopy />
                      </button>
                    </CopyToClipboard>
                  </div>
                  <S.Input
                    type="text"
                    onChange={handlePassphraseChange}
                    value={passphrase}
                    className="w-full"
                    placeholder={`>sup3rDup3rSTOONGpwd<`}
                  />
                </div>
                <div>
                  <div
                    onClick={handleClickGenerate}
                    className="cursor-pointer w-full p-2 text-blue-400 hover:text-blue-500 w-full flex text-end"
                  >
                    Generate a strong passphrase
                  </div>
                </div>
                <div className="text-gray-500 text-xs sm:test-sm md:text-base flex justify-center items-center my-4 ">
                  <RiErrorWarningFill className="mr-2" /> Your passphrase
                  unlocks your wallet each time you visit.
                </div>

                <button
                  className="p-2 bg-yellow-500 hover:bg-yellow-600 transition text-black font-semibold font-mono"
                  onClick={handleClickEncrypt}
                >
                  Encrypt & Continue
                </button>
              </div>
            </Modal>
          )}
          <Toaster />
          <input
            accept=".json"
            className="hidden"
            id="backupFile"
            onChange={handleFileChange}
            type="file"
          />
        </div>
      </div>
    </div>
  );
};

export default Layout;
