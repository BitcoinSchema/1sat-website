import { useWallet } from "@/context/wallet";
import { WithRouterProps } from "next/dist/client/with-router";
import Router from "next/router";
import { ChangeEvent, ReactNode, useCallback } from "react";
import { Toaster } from "react-hot-toast";

interface Props extends WithRouterProps {
  children?: ReactNode;
}

const Layout: React.FC<Props> = ({ router, children }) => {
  const { setBackupFile, backupFile, deleteKeys, payPk, backupKeys } =
    useWallet();

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
    <div className="w-screen h-screen flex flex-col justify-between text-yellow-400 font-mono">
      <div className="h-10 mx-auto">
        <h1
          className="text-2xl py-4 text-white cursor-pointer"
          onClick={() => Router.push("/")}
        >
          1Sat Ordinals
        </h1>
      </div>
      <div className="h-full flex flex-col items-center">{children}</div>
      <div
        className="max-w-7xl mx-auto  h-10 flex items-center justify-center font-mono text-yellow-400 py-8"
        style={{
          height: "4rem",
          textAlign: "center",
        }}
      >
        <a
          className="font-mono text-yellow-400"
          href="https://docs.1satordinals.com"
        >
          Read the Docs
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
          <div className="cursor-pointer text-orange-600" onClick={deleteKeys}>
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
