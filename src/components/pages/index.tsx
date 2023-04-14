import { useSocket } from "@/context/bitsocket";
import { useStorage } from "@/context/storage";
import { useWallet } from "@/context/wallet";
import { P2PKHAddress, PrivateKey, PublicKey } from "bsv-wasm-web";
import React, { ReactNode, useEffect, useMemo } from "react";
import Footer from "../footer";
import Header from "../header";
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
    payPk,
    changeAddress,
    ordPk,
    initialized,
    encryptedBackup,
    setEncryptedBackup,
  } = useWallet();

  const { encryptionKey, getItem, setItem, ready } = useStorage();

  const { connectionStatus, connect, ordAddress } = useSocket();

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
        setEncryptedBackup({
          encryptedBackup: eb,
          pubKey: "",
          fundingChildKey: 0,
          ordChildKey: 0,
        });
      }
    };
    if (ready && !encryptedBackup) {
      fire();
    }
  }, [setEncryptedBackup, ready, getItem]);

  // if we have keys, and an encryptionKey but no encryptedBackup
  useEffect(() => {
    const storeEncryptedKeys = async () => {
      const keyData = JSON.stringify({ payPk, ordPk });
      const encryptedBackup = await setItem("encryptedBackup", keyData, true);

      const pubKey = await setItem(
        "pubKey",
        PrivateKey.from_wif(payPk!).to_public_key().to_hex(),
        false
      );

      // TODO: find ordChildKey
      setEncryptedBackup({
        encryptedBackup,
        pubKey,
        fundingChildKey: 0,
        ordChildKey: 99999,
      });
    };
    if (payPk && ordPk && !encryptedBackup && encryptionKey) {
      storeEncryptedKeys();
    }
  }, [ordPk, payPk, setItem, encryptionKey, encryptedBackup]);

  return (
    <div className="min-h-[100vh] min-w-[100vw] flex flex-col justify-between text-yellow-400 font-mono">
      <Header />
      <div className="min-h-[calc(100vh-8rem)] h-full flex flex-col items-center">
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
