import oneSatLogo from "@/assets/images/oneSatLogoDark.svg";
import { useSocket } from "@/context/bitsocket";
import { useStorage } from "@/context/storage";
import { useWallet } from "@/context/wallet";
import { EncryptDecrypt } from "@/context/wallet/types";
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
import { TbDice } from "react-icons/tb";
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
    showEnterPassphrase,
    setShowEnterPassphrase,
    passphrase,
    setPassphrase,
    encryptedBackupJson,
    setEncryptedBackupJson,
  } = useWallet();

  const {
    encryptionKey,
    setEncryptionKey,
    generateEncryptionKey,
    getItem,
    setItem,
    ready,
    setEncryptionKeyFromPassphrase,
    decryptData,
  } = useStorage();

  const { connectionStatus, connect, ordAddress } = useSocket();

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
        setEncryptedBackupJson({
          encryptedBackup: eb,
          pubKey: "",
          fundingChildKey: 0,
          ordChildKey: 0,
        });
      }
    };
    if (ready && !encryptedBackupJson) {
      fire();
    }
  }, [setEncryptedBackupJson, ready, getItem]);

  useEffect(() => {
    console.log({ encryptionKey, encryptedBackupJson, payPk, ordPk });
  }, [encryptionKey, encryptedBackupJson, payPk, ordPk]);

  // if we have keys, and an encryptionKey but no encryptedBackupJson
  useEffect(() => {
    const storeEncryptedKeys = async () => {
      if (payPk && ordPk && !encryptedBackupJson && encryptionKey) {
        const keyData = JSON.stringify({ payPk, ordPk });
        const encryptedBackup = await setItem("encryptedBackup", keyData, true);

        const pubKey = await setItem(
          "pubKey",
          PrivateKey.from_wif(payPk).to_public_key().to_hex(),
          false
        );

        debugger;
        // TODO: find ordChildKey

        setEncryptedBackupJson({
          encryptedBackup,
          pubKey,
          fundingChildKey: 0,
          ordChildKey: 99999,
        });
      }
    };

    storeEncryptedKeys();
  }, [ordPk, payPk, setItem, encryptionKey, encryptedBackupJson]);

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
      console.log("encrypt keys with passphrase");
      try {
        await setEncryptionKeyFromPassphrase(passphrase);
      } catch (e) {
        console.error(e);
        toast.error("Failed to encrypt keys", toastErrorProps);
      }
    }
  }, [passphrase, setEncryptionKeyFromPassphrase]);

  const handleClickDecrypt = useCallback(async () => {
    if (passphrase) {
      console.log("decrypt keys w passphrase");

      try {
        await setEncryptionKeyFromPassphrase(
          passphrase,
          encryptedBackupJson?.pubKey
        );
        // setShowEnterPassphrase(false);
      } catch (e) {
        console.error(e);
        toast.error("Failed to decrypt keys", toastErrorProps);
      }
    }
    encryptedBackupJson;
  }, [setShowEnterPassphrase, passphrase, setEncryptionKeyFromPassphrase]);

  const handleClickGenerate = useCallback(() => {
    const phrase = generatePassphrase(1);
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
        {!payPk && encryptedBackupJson && (
          <>
            <div className="mx-4">·</div>
            <div className="cursor-pointer" onClick={() => loadEncryptedKeys()}>
              Unlock Wallet
            </div>
          </>
        )}

        {!encryptedBackupJson && !payPk && <div className="mx-4">·</div>}

        {payPk && encryptedBackupJson && <div className="mx-4">·</div>}

        {payPk && (
          <div className="cursor-pointer" onClick={backupKeys}>
            Backup Keys
          </div>
        )}

        {!payPk && !encryptedBackupJson && (
          <div
            className="cursor-pointer"
            onClick={() => {
              Router.push("/wallet");
            }}
          >
            Sign In
          </div>
        )}

        {payPk && !encryptedBackupJson && <div className="mx-4">·</div>}

        {payPk && !encryptedBackupJson && (
          <div
            className="cursor-pointer"
            onClick={() => setShowEnterPassphrase(EncryptDecrypt.Encrypt)}
          >
            Encrypt Keys
          </div>
        )}

        {(payPk || encryptedBackupJson) && <div className="mx-4">·</div>}

        {(payPk || encryptedBackupJson) && (
          <div className="cursor-pointer text-red-500" onClick={deleteKeys}>
            Delete Keys
          </div>
        )}
        <div>
          {showEnterPassphrase !== undefined && (
            <Modal onClose={() => setShowEnterPassphrase(undefined)}>
              <div className="flex flex-col text-center justify-between text-[#aaa] bg-black max-w-2xl p-4 md:p-8 rounded-lg">
                <h1 className="text-2xl">Enter a password</h1>
                <div className="my-4">
                  {showEnterPassphrase === EncryptDecrypt.Decrypt
                    ? "Decrypt"
                    : "Encrypt"}{" "}
                  your saved keys.
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
                    type="password"
                    onChange={handlePassphraseChange}
                    value={passphrase}
                    className="w-full placeholder-[#555]"
                    placeholder={"your-password-here"}
                  />
                </div>
                {showEnterPassphrase === EncryptDecrypt.Encrypt && (
                  <div>
                    <div className="flex items-center">
                      <div
                        onClick={handleClickGenerate}
                        className="flex items-center cursor-pointer p-2 group text-blue-400 hover:text-blue-500"
                      >
                        <TbDice className="mr-2 group-hover:animate-spin" />{" "}
                        Generate a strong passphrase
                      </div>
                    </div>
                  </div>
                )}
                <div className="text-gray-500 text-xs sm:test-sm md:text-base flex justify-center items-center my-4 ">
                  <RiErrorWarningFill className="mr-2" />
                  {showEnterPassphrase === EncryptDecrypt.Encrypt
                    ? "You still need to keep your 12 word seed  phrase."
                    : "Your password unlocks your wallet each time you visit"}
                </div>

                <button
                  disabled={(passphrase?.length || 0) < 6}
                  className="rounded p-2 bg-yellow-500 hover:bg-yellow-600 transition text-black font-semibold font-mono"
                  onClick={
                    showEnterPassphrase === EncryptDecrypt.Decrypt
                      ? handleClickDecrypt
                      : handleClickEncrypt
                  }
                >
                  {showEnterPassphrase === EncryptDecrypt.Decrypt
                    ? "Unlock Wallet"
                    : "Encrypt & Continue"}
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
