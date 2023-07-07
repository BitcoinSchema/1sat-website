import { useWallet } from "@/context/wallet";
import Router from "next/router";
import { ChangeEvent, useCallback } from "react";

const Footer: React.FC = () => {
  const {
    // encryptedBackup,
    payPk,
    backupKeys,
    // setShowEnterPassphrase,
    // showEnterPassphrase,
    deleteKeys,
    setBackupFile,
    // loadEncryptedKeys,
  } = useWallet();

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

  return (
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
      {/* {!payPk && encryptedBackup && (
        <>
          <div className="mx-4">·</div>
          <div className="cursor-pointer" onClick={() => loadEncryptedKeys()}>
            Unlock Wallet
          </div>
        </>
      )} */}

      {/* {!encryptedBackup && !payPk && <div className="mx-4">·</div>} 

      {payPk && encryptedBackup && <div className="mx-4">·</div>} */}

      {payPk && (
        <div className="cursor-pointer" onClick={backupKeys}>
          Backup Keys
        </div>
      )}

      {/* {!payPk && !encryptedBackup && (
        <div
          className="cursor-pointer"
          onClick={() => {
            Router.push("/wallet");
          }}
        >
          Sign In
        </div>
      )} */}

      {/* 
      {payPk && !encryptedBackup && <div className="mx-4">·</div>}

      {payPk && !encryptedBackup && (
        <div
          className="cursor-pointer"
          onClick={() => setShowEnterPassphrase(EncryptDecrypt.Encrypt)}
        >
          Encrypt Keys
        </div>
      )} */}

      {/* {(payPk || encryptedBackup) && <div className="mx-4">·</div>} */}

      {/* {(payPk || encryptedBackup) && (
        <div className="cursor-pointer text-red-500" onClick={deleteKeys}>
          Delete Keys
        </div>
      )} */}
      {/* <div>
        {showEnterPassphrase !== undefined && (
          <PasswordModal
            mode={showEnterPassphrase}
            onClose={() => setShowEnterPassphrase(undefined)}
          />
        )}
        <Toaster />
        <input
          accept=".json"
          className="hidden"
          id="backupFile"
          onChange={handleFileChange}
          type="file"
        />
      </div> */}
    </div>
  );
};

export default Footer;
