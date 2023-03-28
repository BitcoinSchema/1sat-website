import oneSatLogo from "@/assets/images/oneSatLogoDark.svg";
import { useWallet } from "@/context/wallet";
import Image from "next/image";
import Router, { useRouter } from "next/router";
import { ChangeEvent, ReactNode, useCallback, useEffect } from "react";
import { Toaster } from "react-hot-toast";
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

  const router = useRouter();
  useEffect(() => {
    const fire = async (a: string) => {
      await getUTXOs(a);
    };

    if (changeAddress && fetchUtxosStatus === FetchStatus.Idle) {
      fire(changeAddress);
    }
  }, [getUTXOs, fetchUtxosStatus, changeAddress]);

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
        setBackupFile(e.target.files[0]);
        Router?.push("/wallet");
      }
    },
    [setBackupFile]
  );

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
        <div>
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
