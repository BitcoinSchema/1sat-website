import oneSatLogo from "@/assets/images/oneSatLogoDark.svg";
import { useBap } from "@/context/bap";
import { useBitsocket } from "@/context/bitsocket";
import { useOrdinals } from "@/context/ordinals";
import { useWallet } from "@/context/wallet";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Router from "next/router";
import {
  ChangeEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast, { LoaderIcon, Toaster } from "react-hot-toast";
import Tooltip from "../tooltip";

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
// {"hash":"000000000000000006e90982f05673d1cc7ec47386d440e14f72fcd1e8871b4e","coin":1,"height":793523,"time":1685068769,"nonce":1714352154,"version":754237440,"merkleroot":"6a4d5ef9b7cbdff3ab712607ec88e22d3fa584b1fe49d370352af8b520970871","bits":"18107d19","synced":191646}
type BlockHeader = {
  hash: string;
  coin: number;
  height: number;
  time: number;
  nonce: number;
  version: number;
  merkleroot: string;
  bits: string;
  synced: number;
};

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
  const { ordAddress: oAddress } = useWallet();
  const { addressConnectionStatus, connect, ordAddress } = useBitsocket();
  const [showBlockSync, setShowBlockSync] = useState<boolean>(false);
  const [blockHeaders, setBlockHeaders] = useState<BlockHeader[]>([]);
  const [fetchBlockHeadersStatus, setFetchBlockHeadersStatus] =
    useState<FetchStatus>(FetchStatus.Idle);

  const pathname = usePathname();
  useEffect(() => {
    const fire = async (a: string) => {
      try {
        await getUTXOs(a);
      } catch (e) {
        console.log(e);
        toast.error("Error fetching UTXOs", toastErrorProps);
      }
    };

    if (changeAddress && fetchUtxosStatus === FetchStatus.Idle) {
      fire(changeAddress);
    }
  }, [getUTXOs, fetchUtxosStatus, changeAddress]);

  useEffect(() => {
    const fire = async () => {
      try {
        setFetchBlockHeadersStatus(FetchStatus.Loading);
        const resp = await fetch(
          `https://junglebus.gorillapool.io/v1/block_header/list/${stats!.ord}`
        );
        setFetchBlockHeadersStatus(FetchStatus.Success);
        const data = await resp.json();
        setBlockHeaders(data);
      } catch (e) {
        console.log(e);
        setFetchBlockHeadersStatus(FetchStatus.Error);
        toast.error("Error fetching block headers", toastErrorProps);
      }
    };

    if (stats && fetchBlockHeadersStatus === FetchStatus.Idle) {
      fire();
    }
  }, [stats, fetchBlockHeadersStatus]);

  // const oAddress = useMemo(() => {
  //   if (initialized && ordPk) {
  //     const wif = PrivateKey.from_wif(ordPk);
  //     const pk = PublicKey.from_private_key(wif);
  //     return wif && pk && P2PKHAddress.from_pubkey(pk).to_string();
  //   }
  // }, [initialized, ordPk]);

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

  const missingBlocks = useMemo(
    () => blockHeaders?.filter((b) => b.synced === 0).length || 0,
    [blockHeaders]
  );

  const inSync = useMemo(() => {
    return blockHeaders?.every((bh) => bh.synced > 0) || false;
  }, [blockHeaders]);

  const footer = useMemo(() => {
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
          <div className="cursor-pointer" onClick={importId}>
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
    );
  }, [
    onFileChange,
    payPk,
    handleFileChange,
    importKeys,
    backupKeys,
    deleteKeys,
  ]);

  return (
    <div className="min-h-[100vh] min-w-[100vw] flex flex-col justify-between text-yellow-400 font-mono">
      {fetchStatsStatus !== FetchStatus.Loading &&
        stats?.latest &&
        stats.ord < stats.latest && (
          <div className="rounded bg-[#111] p-2 mb-8 w-full">
            <div className=" mx-auto max-w-lg">
              <div
                className="cursor-pointer flex items-center justify-center hover:text-orange-200 text-orange-300 pl-2"
                onClick={() => setShowBlockSync(true)}
              >
                <LoaderIcon className="mr-2" />
                Syncing. Click for details.
              </div>
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
          <Image
            src={oneSatLogo}
            // onClick={() => Router?.push("/wallet")}
            alt={"1Sat Ordinals"}
            className="w-8 h-8 cursor-pointer mx-auto rounded"
            style={{
              animation: "opulcity 8s infinite",
            }}
          />
        </div>
      </div>
      <div className="min-h-[calc(100vh-8rem)] h-full flex flex-col items-center">
        {children}
      </div>
      {footer}
      {fetchUtxosStatus === FetchStatus.Loading && (
        <div className="fixed bottom-0 right-0 mr-8 mb-8 bg-[#111] rounded p-2 text-sm flex items-center">
          <LoaderIcon className="mx-auto mr-2" /> Loading Unspent Coins...
        </div>
      )}
      {showBlockSync && (
        <div
          className="absolute left-0 top-0 w-screen h-screen bg-black bg-opacity-50 flex items-center justify-center"
          onClick={(e) => {
            setShowBlockSync(false);
          }}
        >
          <div
            className="grid grid-flow-row-dense grid-cols-10 grid-rows-10 bg-[#111] p-8 rounded m-auto"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <h1 className="col-span-10 text-lg text-[#777]">
              Bitcoin Sync Status
            </h1>
            <div
              className={`col-span-10 mb-4 ${
                inSync ? "text-emerald-400" : "text-yellow-400"
              }`}
            >
              {inSync ? "Healthy" : missingBlocks + " blocks syncing"}
            </div>

            {blockHeaders.map((b) => (
              <div className="mb-2 mr-2" key={b.hash}>
                {
                  <Tooltip
                    message={
                      b.synced
                        ? `${b.synced.toLocaleString()} transactions`
                        : b.hash
                    }
                  >
                    <div
                      className={`inline-flex rounded-full ${
                        b.synced > 0
                          ? "bg-emerald-400"
                          : "cursor-pointer bg-red-400 hover:bg-red-500"
                      } w-4 h-4`}
                      onClick={() => {
                        if (b.synced === 0) {
                          window.open(
                            `https://whatsonchain.com/block/${b.hash}`,
                            "_blank"
                          );
                        }
                      }}
                    ></div>
                  </Tooltip>
                }
              </div>
            ))}

            {stats?.latest && (
              <div className="col-span-10 mt-4 text-[#777]">
                <h1 className="font-seminbold text-lg text-[#777]">
                  1Sat API Status
                </h1>
                <div className="text-yellow-400 mb-2">
                  {stats.latest && stats.latest - stats.ord} block
                  {stats.latest && stats.latest - stats.ord > 1 ? "s" : ""}{" "}
                  behind
                </div>
                Latest: {stats.latest}
                <br />
                Ordinals: {stats.ord}
                <br />
                Market Listings: {stats.market}
                <br />
                Market Spends: {stats.market_spends}
                <br />
                OPNS: {stats.opns}
                <br />
                BSV20V2: {stats.bsv20v2}
                <br />
                BSV20: {stats["bsv20-deploy"]}
                <br />
                Locks: {stats.locks}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
