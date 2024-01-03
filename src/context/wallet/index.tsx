import { FetchStatus, toastErrorProps, toastProps } from "@/components/pages";
import { addressFromWif } from "@/utils/address";
import { customFetch } from "@/utils/httpClient";
import { randomKeys } from "@/utils/keys";
import { useLocalStorage, useSessionStorage } from "@/utils/storage";
import init, {
  P2PKHAddress,
  PrivateKey,
  Script,
  SigHash,
  Transaction,
  Script as WasmScript,
  TxIn as WasmTxIn,
  TxOut as WasmTxOut,
} from "bsv-wasm-web";
import { Inscription, Utxo } from "js-1sat-ord";
import { head, uniq } from "lodash";
import { useSearchParams } from "next/navigation";
import Router from "next/router";
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";
import { useBitsocket } from "../bitsocket";
import { API_HOST, BSV20, BSV20TXO, OrdUtxo } from "../ordinals";
import { useRates } from "../rates";
import { useStorage } from "../storage";
import { handleTransferring } from "./transfer";
import { EncryptDecrypt, EncryptedBackupJson, WocUtxo } from "./types";

export const PROTOCOL_START_HEIGHT = 783968;
export const ORDS_PER_PAGE = 60;

type BroadcastResponse = {
  encoding: string;
  mimeType: string;
  payload: string;
  publicKey: string;
  signature: string;
  code?: number;
  status?: number;
  error?: string;
};

type ScriptSig = {
  asm: string;
  hex: string;
};

type VIn = {
  coinbase: string;
  txid: string;
  vout: number;
  scriptSig: ScriptSig;
  sequence: number;
};

type ScriptPubKey = {
  asm: string;
  hex: string;
  reqSigs: number;
  type: string;
  addresses: string[];
  isTruncated: boolean;
};

type VOut = {
  value: number;
  n: number;
  scriptPubKey: ScriptPubKey;
};

type TxDetails = {
  txid: string;
  hash: string;
  version: number;
  size: number;
  locktime: number;
  vin: VIn[];
  vout: VOut[];
  blockhash: string;
  confirmations: number;
  time: number;
  blocktime: number;
  blockheight: number;
};
export interface Inscription2 extends Inscription {
  outPoint: string;
}
type HistoryItem = {
  tx_hash: string;
  height: number;
};

export type PendingTransaction = {
  rawTx: string;
  size: number;
  fee: number;
  numInputs: number;
  numOutputs: number;
  txid: string;
  contentType?: string;
  inputTxid: string;
  price?: number;
  marketFee?: number;
  iterations?: number;
  metadata?: any; // MAP;
};

export type BroadcastResponsePayload = {
  apiVersion: string;
  currentHighestBlockHash: string;
  currentHighestBlockHeight: number;
  minerId: string;
  resultDescription: string;
  returnResult: string;
  timestamp: string;
  txSecondMempoolExpiry: number;
  txid: string;
};

type BSV20Counts = {
  confirmed: number;
  pending: number;
};

type BSV20Balance = {
  tick: string;
  all: BSV20Counts;
  listed: BSV20Counts;
};

type ContextValue = {
  bsv20Activity: BSV20TXO[] | undefined;
  getBsv20Activity: (
    address: string,
    page?: number | undefined,
    sort?: boolean | undefined
  ) => Promise<BSV20TXO[]>;
  fetchBsv20ActivityStatus: FetchStatus;
  bsv20ArchiveActivity: BSV20[] | undefined;
  getBsv20ArchiveActivity: (
    address: string,
    page?: number | undefined,
    sort?: boolean | undefined
  ) => Promise<BSV20[]>;
  fetchBsv20ArchiveActivityStatus: FetchStatus;
  bsv20Balances: BSV20Balance[] | undefined;
  getBsv20Balances: (address: string) => Promise<BSV20Balance[]>;
  fetchBsv20sStatus: FetchStatus;
  artifacts: Inscription2[] | undefined;
  backupFile: File | undefined;
  backupKeys: (e?: any) => void;
  balance: number;
  changeAddress: string | undefined;
  currentTxId: string | undefined;
  deleteKeys: (e?: any) => void;
  downloadPendingTx: (e?: any) => void;
  fetchOrdinalUtxosStatus: FetchStatus | undefined;
  fetchUtxosStatus: FetchStatus;
  fundingUtxos: Utxo[] | undefined;
  generateKeys: () => Promise<void>;
  encryptedBackup: EncryptedBackupJson | undefined;
  setEncryptedBackup: (json: EncryptedBackupJson) => void;
  generateStatus: FetchStatus;
  getOrdinalUTXOs: (
    address: string,
    page?: number | undefined,
    sort?: boolean | undefined
  ) => Promise<void>;
  getRawTxById: (id: string) => Promise<string>;
  getUTXOs: (address: string) => Promise<Utxo[]>;
  initialized: boolean;
  ordAddress: string | undefined;
  ordPk: string | undefined;
  ordUtxos: OrdUtxo[] | undefined;
  payPk: string | undefined;
  pendingTransaction: PendingTransaction | undefined;
  reset: () => void;
  send: (address: string) => Promise<void>;
  setBackupFile: (backupFile: File) => void;
  setCurrentTxId: (txid: string) => void;
  setFetchOrdinalUtxosStatus: (status: FetchStatus) => void;
  setFetchUtxoByOutpointStatus: (status: FetchStatus) => void;
  fetchUtxoByOutpointStatus: FetchStatus;
  passphrase: string | undefined;
  setPassphrase: (phrase: string) => void;
  setShowEnterPassphrase: (show: EncryptDecrypt | undefined) => void;
  showEnterPassphrase: EncryptDecrypt | undefined;
  setFetchBsv20sStatus: (status: FetchStatus) => void;
  setOrdUtxos: (ordUtxos: OrdUtxo[]) => void;
  setPendingTransaction: (pendingTransaction: PendingTransaction) => void;
  transfer: (ordUtxo: OrdUtxo, toAddress: string) => Promise<void>;
  usdRate: number | undefined;
  broadcastCache: string[] | undefined;
  setBroadcastCache: (cache: string[]) => void;
  createdUtxos: Utxo[];
  setCreatedUtxos: (utxos: Utxo[]) => void;
  setFundingUtxos: (utxos: Utxo[]) => void;
  broadcastStatus: FetchStatus;
  broadcastPendingTx: (
    tx: PendingTransaction
  ) => Promise<BroadcastResponsePayload | void>;
  getUtxoByOutpoint: (origin: string) => Promise<OrdUtxo | undefined>;
};

const WalletContext = createContext<ContextValue | undefined>(undefined);

interface Props {
  children?: ReactNode;
}

const WalletProvider: React.FC<Props> = (props) => {
  const { ready, getItem, setItem, removeItem, encryptionKey } = useStorage(); // Access the storage context values

  // bsv-wasm initialization flag
  const [initialized, setInitialized] = useState<boolean>(false);

  const [backupFile, setBackupFile] = useState<File>();
  const [broadcastStatus, setBroadcastStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [currentTxId, setCurrentTxId] = useLocalStorage<string>("1satctx");
  const { leid, lastAddressEvent, lastSettledEvent } = useBitsocket();
  const [createdUtxos, setCreatedUtxos] = useLocalStorage<Utxo[]>(
    "1satcutx2",
    []
  );
  const [pendingTransaction, setPendingTransaction] = useState<
    PendingTransaction | undefined
  >(undefined);
  const [broadcastCache, setBroadcastCache] = useSessionStorage<
    string[] | undefined
  >("1satbc", []);
  const [inscribedUtxos, setInscribedUtxos] = useState<Utxo[] | undefined>(
    undefined
  );
  const [lastEventId, setLastEventId] = useState<string>();
  const [artifacts, setArtifacts] = useLocalStorage<Inscription2[] | undefined>(
    "1satart",
    undefined
  );
  const [fundingUtxos, setFundingUtxos] = useState<Utxo[] | undefined>(
    undefined
  );
  const [bsv20Balances, setBsv20Balances] = useState<
    BSV20Balance[] | undefined
  >(undefined);
  const [bsv20ArchiveActivity, setBsv20ArchiveActivity] = useState<
    BSV20[] | undefined
  >(undefined);
  const [bsv20Activity, setBsv20Activity] = useState<BSV20TXO[] | undefined>(
    undefined
  );
  const [ordUtxos, setOrdUtxos] = useState<OrdUtxo[] | undefined>(undefined);

  const [fetchOrdinalUtxosStatus, setFetchOrdinalUtxosStatus] =
    useState<FetchStatus>(FetchStatus.Idle);
  const [fetchUtxoByOutpointStatus, setFetchUtxoByOutpointStatus] =
    useState<FetchStatus>(FetchStatus.Idle);
  const [fetchBsv20sStatus, setFetchBsv20sStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [fetchBsv20ActivityStatus, setFetchBsv20ActivityStatus] =
    useState<FetchStatus>(FetchStatus.Idle);
  const [fetchBsv20ArchiveActivityStatus, setFetchBsv20ArchiveActivityStatus] =
    useState<FetchStatus>(FetchStatus.Idle);

  const [payPk, setPayPk] = useLocalStorage<string | undefined>(
    "1satfk",
    undefined
  );
  const [ordPk, setOrdPk] = useLocalStorage<string | undefined>(
    "1satok",
    undefined
  );

  const [mnemonic, setMnemonic] = useState<string | undefined>(undefined);
  // The child key deptch for the funding and ordinal addresses
  const [changeAddressPath, setChangeAddressPath] = useState<
    string | undefined
  >(undefined);
  const [ordAddressPath, setOrdAddressPath] = useState<string | undefined>(
    undefined
  );

  const [usdRate, setUsdRate] = useState<number>(0);
  const { rates } = useRates();

  // Needs to persist so we can decrypt the local keys file
  const [encryptedBackup, setEncryptedBackup] =
    useLocalStorage<EncryptedBackupJson>("1sebj", undefined);
  const [generateStatus, setGenerateStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  const searchParams = useSearchParams();

  const page = searchParams.get("page");
  const sort = searchParams.get("sort");

  // Modal control flags
  const [showEnterPassphrase, setShowEnterPassphrase] = useState<
    EncryptDecrypt | undefined
  >();
  // passphrase is used to encrypt keys
  const [passphrase, setPassphrase] = useState<string | undefined>();

  const currentPage = useMemo(() => {
    setFetchBsv20sStatus(FetchStatus.Idle);
    setFetchOrdinalUtxosStatus(FetchStatus.Idle);
    return typeof page === "string" ? parseInt(page) : 1;
  }, [page, setFetchOrdinalUtxosStatus, setFetchBsv20sStatus]);

  const currentSort = useMemo(() => {
    setFetchBsv20sStatus(FetchStatus.Idle);
    setFetchOrdinalUtxosStatus(FetchStatus.Idle);
    return typeof sort === "string" ? parseInt(sort) : 0;
  }, [sort, setFetchOrdinalUtxosStatus, setFetchBsv20sStatus]);

  useEffect(() => {
    if (rates && rates.length > 0) {
      // Gives rate for 1 USD in satoshis
      let usdRate = rates.filter((r) => r.currency === "usd")[0]
        .price_in_satoshis;
      setUsdRate(usdRate);
    }
  }, [rates, usdRate]);

  useEffect(() => {
    if (lastAddressEvent && ordUtxos && leid !== lastEventId) {
      setLastEventId(leid);
      const e = lastAddressEvent as any;
      const filteredOrdUtxos =
        ordUtxos?.filter((o) => o.txid !== e.spend) || [];
      if (e && !e.spend) {
        // const sampleSocketData = {
        //   txid: "ebdca6d8c50029b3220aa16c4d9cb9868724f1cc72075f9efe328a4d82eb863e",
        //   vout: 0,
        //   satoshis: 1,
        //   lock: "b0a542a4a4707f7b5b48f4c7a45e12bee4f9481a5ad3db250dfd3730f5ff4225",
        //   spend: "f6e14fa43443f15bdf6d4b4fb45b0fcad17326684d0a089f3a5cc9a33be1b64b",
        //   vin: 0,
        //   ordinal: 0,
        //   height: 0,
        //   idx: 0,
        // };
        toast.success("Ordinal Recieved!", toastProps);
        setOrdUtxos([
          // {
          //   satoshis: e.satoshis,
          //   txid: e.txid,
          //   // id: parseInt(e.id),
          //   vout: e.vout,
          //   data: { insc: e.file },
          //   origin: e.origin,
          //   height: e.height,
          //   outpoint: e.outpoint,
          //   listing: e.listing,
          //   num: e.num,
          //   spend: e.spend,
          // } as OrdUtxo,
          ...e,
          ...filteredOrdUtxos,
        ]);
      } else {
        setOrdUtxos(filteredOrdUtxos);
      }
    }
  }, [
    leid,
    setLastEventId,
    ordUtxos,
    setOrdUtxos,
    lastAddressEvent,
    lastEventId,
  ]);

  const [fetchUtxosStatus, setFetchUtxosStatus] = useState<FetchStatus>(
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

  const changeAddress = useMemo(
    () => (payPk && initialized ? addressFromWif(payPk) : undefined),
    [initialized, payPk]
  );

  const ordAddress = useMemo(
    () => (ordPk && initialized ? addressFromWif(ordPk) : undefined),
    [initialized, ordPk]
  );

  useEffect(() => {
    const fire = async (f: File) => {
      const jsonString = await f.text();
      if (jsonString) {
        const json = JSON.parse(jsonString);
        const pPk = json.payPk;
        const oPk = json.ordPk;
        setPayPk(pPk);
        setOrdPk(oPk);
      }
    };
    if (backupFile) {
      fire(backupFile);
    }
  }, [setOrdPk, setPayPk, backupFile]);

  const getUtxoByOutpoint = useCallback(
    async (outpoint: string): Promise<OrdUtxo> => {
      setFetchUtxoByOutpointStatus(FetchStatus.Loading);
      try {
        const { promise } = customFetch<OrdUtxo>(
          `${API_HOST}/api/txos/${outpoint}?script=true`
        );
        const ordUtxo = await promise;
        console.log({ ordUtxo });
        setFetchUtxoByOutpointStatus(FetchStatus.Success);

        ordUtxo.script = Script.from_bytes(
          Buffer.from(ordUtxo.script, "base64")
        ).to_asm_string();

        return ordUtxo;
      } catch (e) {
        setFetchUtxoByOutpointStatus(FetchStatus.Error);
        throw e;
      }
    },
    [setFetchUtxoByOutpointStatus]
  );

  const getOrdinalUTXOs = useCallback(
    async (
      address: string,
      page: number = 1,
      sort: boolean = false
    ): Promise<void> => {
      // address or custom locking script hash
      setFetchOrdinalUtxosStatus(FetchStatus.Loading);

      const offset = (page - 1) * ORDS_PER_PAGE;
      try {
        const direction = sort ? "ASC" : "DESC";

        const r = await fetch(
          `${API_HOST}/api/txos/address/${address}/unspent?limit=${ORDS_PER_PAGE}&offset=${offset}&dir=${direction}&bsv20=false`
        );

        const utxos = (await r.json()) as OrdUtxo[];

        setOrdUtxos(utxos);
        setFetchOrdinalUtxosStatus(FetchStatus.Success);
        return;
      } catch (e) {
        setOrdUtxos([]);
        setFetchOrdinalUtxosStatus(FetchStatus.Error);
        throw e;
      }
    },
    [setFetchOrdinalUtxosStatus, setOrdUtxos]
  );

  useEffect(() => {
    const fire = async (a: string) => {
      await getOrdinalUTXOs(a, currentPage, currentSort === 1);
    };
    if (ordAddress && fetchOrdinalUtxosStatus === FetchStatus.Idle) {
      fire(ordAddress);
    }
  }, [
    currentSort,
    currentPage,
    getOrdinalUTXOs,
    ordAddress,
    fetchOrdinalUtxosStatus,
  ]);

  const getTxById = async (txid: string): Promise<TxDetails> => {
    const r = await fetch(
      `https://api.whatsonchain.com/v1/bsv/main/tx/${txid}`
    );
    const utxo = (await r.json()) as TxDetails;
    // let utxo = res.find((u: any) => u.value > 1);
    // TODO: How to get script?

    return utxo;
  };

  const getRawTxById = useCallback(async (txid: string): Promise<string> => {
    const r = await fetch(
      `https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/hex`
    );
    return await r.text();
  }, []);

  const getUTXOs = useCallback(
    async (address: string): Promise<Utxo[]> => {
      setFetchUtxosStatus(FetchStatus.Loading);
      try {
        const { promise } = customFetch<WocUtxo[]>(
          `https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent`
        );
        const utxos = await promise;
        setFetchUtxosStatus(FetchStatus.Success);
        const u = utxos.map((u: WocUtxo) => {
          return {
            satoshis: u.value,
            txid: u.tx_hash,
            vout: u.tx_pos,
            script: P2PKHAddress.from_string(address)
              .get_locking_script()
              .to_asm_string(),
          };
        });
        setFundingUtxos(u);
        return u;
      } catch (e) {
        setFetchUtxosStatus(FetchStatus.Error);
        throw e;
      }
    },
    [setFetchUtxosStatus, setFundingUtxos]
  );

  const getBsv20Balances = useCallback(
    async (address: string): Promise<BSV20Balance[]> => {
      setFetchBsv20sStatus(FetchStatus.Loading);
      try {
        const r = await fetch(`${API_HOST}/api/bsv20/${address}/balance`);
        const balances = (await r.json()) as BSV20Balance[];

        setFetchBsv20sStatus(FetchStatus.Success);

        setBsv20Balances(balances);
        return balances;
      } catch (e) {
        setFetchBsv20sStatus(FetchStatus.Error);
        throw e;
      }
    },
    [setFetchBsv20sStatus, setBsv20Balances]
  );

  const getBsv20Activity = useCallback(
    async (
      address: string,
      page: number = 1,
      sort: boolean = false
    ): Promise<BSV20TXO[]> => {
      setFetchBsv20ActivityStatus(FetchStatus.Loading);
      const offset = (page - 1) * ORDS_PER_PAGE;
      const direction = sort ? "ASC" : "DESC";

      try {
        const r = await fetch(
          `${API_HOST}/api/bsv20/${address}/unspent?limit=${ORDS_PER_PAGE}&offset=${offset}&dir=${direction}`
        );
        const utxos = (await r.json()) as BSV20TXO[];
        console.log({ utxos });
        setFetchBsv20ActivityStatus(FetchStatus.Success);
        setBsv20Activity(utxos);
        return utxos;
      } catch (e) {
        setFetchBsv20ActivityStatus(FetchStatus.Error);
        throw e;
      }
    },
    [setFetchBsv20ActivityStatus, setBsv20Activity]
  );
  const getBsv20ArchiveActivity = useCallback(
    async (
      address: string,
      page: number = 1,
      sort: boolean = false
    ): Promise<BSV20[]> => {
      setFetchBsv20ArchiveActivityStatus(FetchStatus.Loading);
      const offset = (page - 1) * ORDS_PER_PAGE;
      const direction = sort ? "ASC" : "DESC";

      try {
        const r = await fetch(
          `${API_HOST}/api/txos/address/${address}/unspent?limit=${ORDS_PER_PAGE}&offset=${offset}&dir=${direction}&status=all&bsv20=true`
        );
        const utxos = (await r.json()) as [{ data: { bsv20: BSV20 } }];

        setFetchBsv20ArchiveActivityStatus(FetchStatus.Success);
        const bsv20s = utxos?.map((u) => u.data.bsv20);
        setBsv20ArchiveActivity(bsv20s);
        return bsv20s;
      } catch (e) {
        setFetchBsv20ArchiveActivityStatus(FetchStatus.Error);
        throw e;
      }
    },
    [setFetchBsv20ArchiveActivityStatus, setBsv20ArchiveActivity]
  );

  useEffect(() => {
    const fire = async (a: string) => {
      await getBsv20Balances(a);
      await getBsv20Activity(a, currentPage, currentSort === 1);
      await getBsv20ArchiveActivity(a, currentPage, currentSort === 1);
    };
    if (ordAddress && fetchBsv20sStatus === FetchStatus.Idle) {
      fire(ordAddress);
    }
  }, [
    currentSort,
    currentPage,
    getBsv20Balances,
    getBsv20Activity,
    getBsv20ArchiveActivity,
    ordAddress,
    fetchBsv20sStatus,
  ]);

  useEffect(() => {
    if (fundingUtxos && !currentTxId) {
      if (fundingUtxos) {
        setCurrentTxId(head(fundingUtxos)?.txid);
        toast.success(`Found ${fundingUtxos.length} UTXOs`, toastProps);
      } else {
        console.info("No UTXOs. Please make a depot and refresh the page.");
      }
    }
  }, [setCurrentTxId, currentTxId, fundingUtxos]);

  // [
  //   {
  //     id: 165,
  //     txid: "e17d7856c375640427943395d2341b6ed75f73afc8b22bb3681987278978a584",
  //     vout: 1,
  //     file: {
  //       hash: "3dbe16ec7625e0d8a02ceaa5b2b03bc412c06186d03fbd69090c162469cf0292",
  //       size: 2592,
  //       type: "image/png",
  //     },
  //     origin:
  //       "e17d7856c375640427943395d2341b6ed75f73afc8b22bb3681987278978a584_1",
  //     ordinal: 0,
  //     height: 783968,
  //     idx: 756,
  //     lock: "95EA9JV8O+RWtoU7zrUdcsIRyF2RhhHON/CxiBEpw3Y=",
  //   },
  // ];

  const getHistory = useCallback(
    async (address: string): Promise<void> => {
      setFetchOrdinalUtxosStatus(FetchStatus.Loading);
      try {
        const r = await fetch(
          `https://api.whatsonchain.com/v1/bsv/main/address/${address}/history`
        );
        const history: HistoryItem[] = await r.json();

        let iUtxos: Utxo[] = [];
        let artifacts: Inscription2[] = [];
        for (let item of history.filter(
          (h) => h.height >= PROTOCOL_START_HEIGHT
        )) {
          const rawTx = await getRawTxById(item.tx_hash);
          await new Promise((r) => setTimeout(r, 250));
          // loop over outputs, adding any ordinal outputs to a list
          const tx = Transaction.from_hex(rawTx);
          for (let x = 0; x < tx.get_noutputs(); x++) {
            let out = tx.get_output(x);
            console.log({ tx, out });
            if (!out) {
              console.log("last output", x);
              break;
            }

            const fixedAsm = out.get_script_pub_key().to_asm_string();
            const sats = out.get_satoshis();
            console.log({ fixedAsm });
            // Find ord prefix
            // haha I have 10 artifacts with reversed OP order
            const splitScript = fixedAsm.split(" 0 OP_IF 6f7264 OP_1 ");
            if (splitScript.length > 0 && Number(sats) === 1) {
              iUtxos.push({
                satoshis: 1,
                vout: x,
                txid: item.tx_hash,
                script: fixedAsm,
              });
              if (splitScript.length === 1) {
                console.log("NO SPLIT MATCH", splitScript);
                continue;
              }
              let scr = splitScript[1].split(" ");
              let contentType = Buffer.from(scr[0], "hex").toString();
              let dataHex = scr[2];
              let dataB64 = Buffer.from(dataHex, "hex").toString("base64");
              const outPoint = `${tx.get_id_hex()}_${x}}`;
              artifacts.push({
                dataB64,
                contentType,
                outPoint,
              });
              console.log({ tx, fixedAsm, iUtxos });
            } else {
              console.log("NO MATCH", fixedAsm);
            }
          }
        }
        setFetchOrdinalUtxosStatus(FetchStatus.Success);
        setInscribedUtxos(iUtxos);
        setArtifacts(artifacts);
        toast.success(`Got ${artifacts.length} artifacts`, toastProps);
      } catch (e) {
        setFetchOrdinalUtxosStatus(FetchStatus.Error);
        throw e;
      }
    },
    [getRawTxById, setFetchOrdinalUtxosStatus, setInscribedUtxos, setArtifacts]
  );

  // transfer an ordinal to an ordinal address
  const transfer = useCallback(
    async (ordUtxo: OrdUtxo, toOrdAddress: string) => {
      if (!payPk || !ordPk || !ordUtxo || !toOrdAddress || !fundingUtxos) {
        console.log(
          "missing thing",
          payPk,
          ordPk,
          toOrdAddress,
          ordUtxo,
          fundingUtxos
        );
        return;
      }

      if (!toOrdAddress?.startsWith("1")) {
        alert("inivalid receive address");
        return;
      }
      toast(`Transferring to ${toOrdAddress}`, {
        style: {
          background: "#333",
          color: "#fff",
        },
      });
      if (!ordUtxo.script) {
        const ordRawTx = await getRawTxById(ordUtxo.txid);
        const tx = Transaction.from_hex(ordRawTx);
        console.log({ num: tx.get_noutputs() });
        const out = tx.get_output(ordUtxo.vout);
        const script = out?.get_script_pub_key();
        if (script) {
          ordUtxo.script = script.to_asm_string();
        }
      }
      if (!ordUtxo.satoshis) {
        ordUtxo.satoshis = 1;
      }

      const fundingUtxo = head(fundingUtxos);
      if (!fundingUtxo) {
        // toast
        toast(`No funding UTXOs`, toastErrorProps);
        return;
      }
      if (fundingUtxo && !fundingUtxo.script) {
        const fundingRawTx = await getRawTxById(fundingUtxo.txid);
        const tx = Transaction.from_hex(fundingRawTx);
        const out = tx.get_output(fundingUtxo.vout);
        const script = out?.get_script_pub_key();
        if (script) {
          fundingUtxo.script = script.to_asm_string();
        }
      }

      const address = toOrdAddress;
      const satsPerByteFee = 0.09;
      let pendingTransaction: PendingTransaction;
      // const { payPk, ordPk, address, ordUtxo, fundingUtxo, satsPerByteFee } =
      // req.body;
      console.log({
        payPk,
        address,
        fundingUtxo,
        satsPerByteFee,
        ordPk,
        ordUtxo,
        script: ordUtxo.script,
      });
      if (
        !!payPk &&
        !!address &&
        !!fundingUtxo &&
        !!ordUtxo &&
        !!ordPk &&
        !!satsPerByteFee &&
        !!ordUtxo.script
      ) {
        try {
          const tx = await handleTransferring(
            payPk,
            ordPk,
            address,
            fundingUtxo,
            ordUtxo,
            satsPerByteFee
          );
          const satsIn = fundingUtxo.satoshis;
          const satsOut = Number(tx.satoshis_out());
          if (satsIn && satsOut) {
            const fee = satsIn - satsOut;

            if (fee < 0) {
              // res.type("application/json");
              // res.status(402).send({ error: "Fee inadequate" });
              console.error("fee inadequate");
              return;
            }
            // res.status(200).json(result);

            const rawTx = tx.to_hex();
            console.log("Transfer Tx", rawTx);
            setPendingTransaction({
              rawTx,
              size: tx.get_size(),
              fee,
              numInputs: tx.get_ninputs(),
              numOutputs: tx.get_noutputs(),
              txid: tx.get_id_hex(),
              inputTxid: tx.get_input(0)?.get_prev_tx_id_hex(),
            } as PendingTransaction);

            Router.push("/preview");
            return;
          }
        } catch (e) {
          console.error(e);
          // res.status(500).send({ error: e.toString() });
          return;
        }
      } else {
        //res.status(400).send({ error: "some param not set" });
        console.log("error some param not set");
        return;
      }
    },
    [getRawTxById, setPendingTransaction, payPk, ordPk, fundingUtxos]
  );

  const sendWasm = useCallback(
    async (address: string) => {
      if (!payPk) {
        return;
      }

      if (!address?.startsWith("1")) {
        console.error("inivalid receive address");
        return;
      }
      toast(`Sending to ${address}`, {
        style: {
          background: "#333",
          color: "#fff",
        },
      });

      const feeSats = 20;
      const paymentPk = PrivateKey.from_wif(payPk);
      const tx = new Transaction(1, 0);

      // Outputs
      let inputValue = 0;
      for (let u of fundingUtxos || []) {
        inputValue += u.satoshis;
      }
      const satsIn = inputValue;
      const satsOut = satsIn - feeSats;
      console.log({ feeSats, satsIn, satsOut });
      tx.add_output(
        new WasmTxOut(
          BigInt(satsOut),
          P2PKHAddress.from_string(address).get_locking_script()
        )
      );

      // build txins from our UTXOs
      let idx = 0;
      for (let u of fundingUtxos || []) {
        console.log({ u });
        const inx = new WasmTxIn(
          Buffer.from(u.txid, "hex"),
          u.vout,
          WasmScript.from_asm_string("")
        );
        console.log({ inx });
        inx.set_satoshis(BigInt(u.satoshis));
        tx.add_input(inx);

        const sig = tx.sign(
          paymentPk,
          SigHash.InputOutputs,
          idx,
          WasmScript.from_asm_string(u.script),
          BigInt(u.satoshis)
        );

        console.log({ sig: sig.to_hex() });

        // const s = Script.from_asm_string(u.script);
        // inx.set_unlocking_script(
        //   P2PKHAddress.from_string(changeAddress || "").get_unlocking_script(
        //     paymentPk.to_public_key(),
        //     sig
        //   )
        // );

        inx.set_unlocking_script(
          WasmScript.from_asm_string(
            `${sig.to_hex()} ${paymentPk.to_public_key().to_hex()}`
          )
        );

        tx.set_input(idx, inx);
        idx++;
      }

      const rawTx = tx.to_hex();
      // const { rawTx, fee, size, numInputs, numOutputs } = resp;
      // TODO: Sign the inputs
      console.log("Refund Tx", rawTx);
      setPendingTransaction({
        rawTx,
        size: Math.ceil(rawTx.length / 2),
        fee: 20,
        numInputs: tx.get_ninputs(),
        numOutputs: tx.get_noutputs(),
        txid: tx.get_id_hex(),
        inputTxid: tx.get_input(0)!.get_prev_tx_id_hex(),
      });

      Router.push("/preview");
    },
    [setPendingTransaction, payPk, fundingUtxos]
  );
  type WocResult = {};

  const broadcastPendingTx = useCallback(async () => {
    if (!fundingUtxos) {
      return;
    }
    console.log("click broadcast");
    if (!pendingTransaction?.rawTx) {
      return;
    }

    console.log({ pendingTransaction });
    setBroadcastStatus(FetchStatus.Loading);
    const rawtx = Buffer.from(pendingTransaction.rawTx, "hex").toString(
      "base64"
    );
    const response = await fetch(`${API_HOST}/api/tx`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify({ rawtx }),
    });

    if (response.ok) {
      toast.success("Broadcasted", toastProps);
      setBroadcastCache(
        uniq([...(broadcastCache || []), pendingTransaction.inputTxid]).slice(
          0,
          10
        )
      );

      setBroadcastStatus(FetchStatus.Success);

      if (changeAddress) {
        // keep the utxo created
        // we assume the last output is change and make a utxo from it
        const pendingTx = Transaction.from_hex(pendingTransaction.rawTx);
        const changeOut = pendingTx.get_output(pendingTx.get_noutputs() - 1);
        const address = P2PKHAddress.from_string(changeAddress).to_string();
        const createdUtxo = {
          satoshis: Number(changeOut?.get_satoshis()),
          vout: pendingTx.get_noutputs() - 1,
          txid: pendingTx.get_id_hex(),
          script: P2PKHAddress.from_string(address)
            .get_locking_script()
            .to_asm_string(),
        } as Utxo;
        console.log({ createdUtxo });
        const cu = [
          ...(createdUtxos || []).filter(
            (u) => u.txid === pendingTransaction.inputTxid
          ),
          createdUtxo,
        ];

        setCreatedUtxos(cu);
        setFundingUtxos([
          ...fundingUtxos.filter((u) => {
            if (u.txid === pendingTransaction.inputTxid) {
              return false;
            }
            return true;
          }),
          createdUtxo,
        ]);
      }

      // setOrdUtxos([...(ordUtxos || []), pendingOrdUtxo]);
      if (pendingTransaction.contentType === "application/bsv-20") {
        Router.push("/bsv20");
      } else {
        Router.push("/ordinals");
      }
      return;
    }
    const { message } = await response.json();
    toast.error("Failed to broadcast " + message, toastErrorProps);

    setBroadcastStatus(FetchStatus.Error);
  }, [
    broadcastCache,
    changeAddress,
    createdUtxos,
    fundingUtxos,
    pendingTransaction,
    setBroadcastCache,
    setCreatedUtxos,
  ]);

  const deleteKeys = useCallback(() => {
    const c = confirm(
      "Are you sure you want to clear your keys from the browser? This cannot be undone!"
    );

    if (c) {
      setPayPk(undefined);
      setOrdPk(undefined);
      setFundingUtxos(undefined);
      setArtifacts(undefined);
      setInscribedUtxos(undefined);
      setBackupFile(undefined);
      setOrdUtxos(undefined);
      toast.success("Keys Cleared", toastProps);
      Router.push("/");
    }
  }, [
    setOrdUtxos,
    setPayPk,
    setOrdPk,
    setFundingUtxos,
    setArtifacts,
    setInscribedUtxos,
  ]);

  const balance = useMemo(() => {
    let b = 0;
    for (let fu of fundingUtxos || []) {
      b += fu.satoshis;
    }
    return b;
  }, [fundingUtxos]);

  const generateKeys = useCallback(() => {
    return new Promise<void>(async (resolve, reject) => {
      console.log("callback");
      try {
        const { payPk, ordPk } = await randomKeys();
        setPayPk(payPk);
        setOrdPk(ordPk);
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }, [setOrdPk, setPayPk]);

  const backupKeys = useCallback(
    (e?: any) => {
      var dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify({ payPk, ordPk }));

      const clicker = document.createElement("a");
      clicker.setAttribute("href", dataStr);
      clicker.setAttribute("download", "1sat.json");
      clicker.click();
    },
    [payPk, ordPk]
  );

  // Set key state variables from indexedDB
  const loadUnencryptedKeys = useCallback(async () => {
    if (ready) {
      const ordPk = await getItem("ordPk");
      const payPk = await getItem("payPk");
      if (ordPk && payPk) {
        setOrdPk(ordPk);
        setPayPk(payPk);
        return;
      } else {
        console.log("No keys");
        return;
      }
    }
  }, [ready, getItem, setOrdPk, setPayPk]);

  const downloadPendingTx = useCallback(
    (e?: any) => {
      if (!pendingTransaction) {
        toast.error("No pending transaction to download");
        return;
      }
      var dataStr =
        "data:text/plain;charset=utf-8," + pendingTransaction?.rawTx;

      const clicker = document.createElement("a");
      clicker.setAttribute("href", dataStr);
      clicker.setAttribute("download", `${pendingTransaction.txid}.hex`);
      clicker.click();
    },
    [pendingTransaction]
  );

  const reset = useCallback(() => {
    console.log("reset");
    setFundingUtxos(undefined);
    setPendingTransaction(undefined);
  }, [setFundingUtxos, setPendingTransaction]);

  const value = useMemo(
    () => ({
      artifacts,
      backupFile,
      backupKeys,
      balance,
      broadcastCache,
      broadcastPendingTx,
      broadcastStatus,
      bsv20Activity,
      bsv20ArchiveActivity,
      bsv20Balances,
      changeAddress,
      createdUtxos: createdUtxos || [],
      currentTxId,
      deleteKeys,
      downloadPendingTx,
      encryptedBackup,
      fetchBsv20ActivityStatus,
      fetchBsv20ArchiveActivityStatus,
      fetchBsv20sStatus,
      fetchOrdinalUtxosStatus,
      fetchUtxoByOutpointStatus,
      fetchUtxosStatus,
      fundingUtxos,
      generateKeys,
      generateStatus,
      getBsv20Activity,
      getBsv20ArchiveActivity,
      getBsv20Balances,
      getOrdinalUTXOs,
      getRawTxById,
      getUtxoByOutpoint,
      getUTXOs,
      initialized,
      ordAddress,
      ordPk,
      ordUtxos,
      passphrase,
      payPk,
      pendingTransaction,
      reset,
      send: sendWasm,
      setBackupFile,
      setBroadcastCache,
      setCreatedUtxos,
      setCurrentTxId,
      setEncryptedBackup,
      setFetchBsv20sStatus,
      setFetchOrdinalUtxosStatus,
      setFetchUtxoByOutpointStatus,
      setFundingUtxos,
      setOrdUtxos,
      setPassphrase,
      setPendingTransaction,
      setShowEnterPassphrase,
      showEnterPassphrase,
      transfer,
      usdRate,
    }),
    [
      artifacts,
      backupFile,
      backupKeys,
      balance,
      broadcastCache,
      broadcastPendingTx,
      broadcastStatus,
      bsv20Activity,
      bsv20ArchiveActivity,
      bsv20Balances,
      changeAddress,
      createdUtxos,
      currentTxId,
      deleteKeys,
      downloadPendingTx,
      encryptedBackup,
      fetchBsv20ActivityStatus,
      fetchBsv20ArchiveActivityStatus,
      fetchBsv20sStatus,
      fetchOrdinalUtxosStatus,
      fetchUtxoByOutpointStatus,
      fetchUtxosStatus,
      fundingUtxos,
      generateKeys,
      generateStatus,
      getBsv20Activity,
      getBsv20ArchiveActivity,
      getBsv20Balances,
      getOrdinalUTXOs,
      getRawTxById,
      getUtxoByOutpoint,
      getUTXOs,
      initialized,
      ordAddress,
      ordPk,
      ordUtxos,
      passphrase,
      payPk,
      pendingTransaction,
      reset,
      sendWasm,
      setBackupFile,
      setBroadcastCache,
      setCreatedUtxos,
      setCurrentTxId,
      setEncryptedBackup,
      setFetchBsv20sStatus,
      setFetchOrdinalUtxosStatus,
      setFetchUtxoByOutpointStatus,
      setFundingUtxos,
      setOrdUtxos,
      setPassphrase,
      setPendingTransaction,
      setShowEnterPassphrase,
      showEnterPassphrase,
      transfer,
      usdRate,
    ]
  );

  return (
    <>
      <WalletContext.Provider value={value} {...props} />
    </>
  );
};

const useWallet = (): ContextValue => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within an WalletProvider");
  }
  return context;
};

export { WalletProvider, useWallet };
