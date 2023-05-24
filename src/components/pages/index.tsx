import oneSatLogo from "@/assets/images/oneSatLogoDark.svg";
import { useBap } from "@/context/bap";
import { useBitsocket } from "@/context/bitsocket";
import { useOrdinals } from "@/context/ordinals";
import { useWallet } from "@/context/wallet";
import { P2PKHAddress, PrivateKey, PublicKey } from "bsv-wasm-web";
import Image from "next/image";
import Router, { useRouter } from "next/router";
import { ChangeEvent, ReactNode, useCallback, useEffect, useMemo } from "react";
import { LoaderIcon, Toaster } from "react-hot-toast";

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
  } = useWallet();
  const { fetchStatsStatus, stats } = useOrdinals();

  const { idKey, onFileChange } = useBap();
  const { ordPk, initialized } = useWallet();
  const { addressConnectionStatus, connect, ordAddress } = useBitsocket();

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
      addressConnectionStatus !== ConnectionStatus.CONNECTING &&
      (!ordAddress ||
        ordAddress !== oAddress ||
        addressConnectionStatus === ConnectionStatus.IDLE)
    ) {
      connect(oAddress);
    }
  }, [ordAddress, oAddress, connect, addressConnectionStatus]);

  const importKeys = useCallback(() => {
    if (!backupFile) {
      const el = document.getElementById("backupFile");
      el?.click();
      return;
    }
    console.log({ backupFile });
  }, [backupFile]);

  const importId = useCallback(() => {
    if (!idKey) {
      const el = document.getElementById("idFile");
      el?.click();
      return;
    }
    console.log({ idKey });
  }, [idKey]);

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        setBackupFile(e.target.files[0]);
        Router?.push("/wallet");
      }
    },
    [setBackupFile]
  );

  return (
    <div className="min-h-[100vh] min-w-[100vw] flex flex-col justify-between text-yellow-400 font-mono">
      {fetchStatsStatus !== FetchStatus.Loading &&
        stats &&
        stats.settled + 6 < stats.latest && (
          <div className="rounded bg-[#111] p-2 mb-8 w-full">
            <div className=" mx-auto max-w-lg">
              <p className="flex items-center justify-center text-orange-300 ">
                <LoaderIcon className="mr-2" />
                Syncing. {stats.latest - stats.settled - 6} block
                {stats.latest - stats.settled - 6 > 1 ? "s" : ""} behind.
              </p>
              <p className="text-center text-red-300 mt-2">
                BALANCES WILL BE INACCURATE UNTIL SYNCED.
              </p>
            </div>
          </div>
        )}
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
        <div className="mx-4">·</div>
        {payPk && (
          <div className="cursor-pointer" onClick={backupKeys}>
            Backup Keys
          </div>
        )}
        {!payPk && (
          <div className="cursor-pointer" onClick={importKeys}>
            Import Keys
          </div>
        )}
        {payPk && <div className="mx-4">·</div>}

        {payPk && (
          <div className="cursor-pointer text-red-500" onClick={deleteKeys}>
            Delete Keys
          </div>
        )}

        {/* {!idKey && <div className="mx-4">·</div>}

        {!idKey && (
          <div className="cursor-pointer text-red-500" onClick={importId}>
            Import Identity
          </div>
        )} */}
        <div>
          <Toaster />
          <input
            accept=".json"
            className="hidden"
            id="backupFile"
            onChange={handleFileChange}
            type="file"
          />
          <input
            accept=".json"
            className="hidden"
            id="idFile"
            onChange={onFileChange}
            type="file"
          />
        </div>
      </div>
    </div>
  );
};

export default Layout;
