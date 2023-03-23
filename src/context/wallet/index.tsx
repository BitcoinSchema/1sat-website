import { FetchStatus } from "@/components/pages";
import { addressFromWif } from "@/utils/address";
import { fillContentType } from "@/utils/artifact";
import { randomKeys } from "@/utils/keys";
import { useLocalStorage } from "@/utils/storage";
import init, { P2PKHAddress, Transaction } from "bsv-wasm-web";
import { Inscription, Utxo } from "js-1sat-ord";
import { head } from "lodash";
import Router from "next/router";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";
import sb from "satoshi-bitcoin";

export const PROTOCOL_START_HEIGHT = 783968;

type OutPoint = {
  txid: string;
  vout: number;
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
  value: 6.27138654;
  n: 0;
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
};

export interface OrdUtxo extends Utxo {
  type?: string;
}

type ContextValue = {
  fundingUtxos: Utxo[] | undefined;
  ordUtxos: OrdUtxo[] | undefined;
  payPk: string | undefined;
  ordPk: string | undefined;
  setBackupFile: (backupFile: File) => void;
  initialized: boolean;
  deleteKeys: (e?: any) => void;
  ordAddress: string | undefined;
  changeAddress: string | undefined;
  artifacts: Inscription2[] | undefined;
  backupFile: File | undefined;
  generateKeys: () => void;
  getUtxoByTxId: (txid: string) => Promise<void>;
  getArtifactsByTxId: (txid: string) => Promise<OrdUtxo[]>;
  getUTXOs: (address: string) => Promise<Utxo[]>;
  currentTxId: string | undefined;
  setCurrentTxId: (txid: string) => void;
  setOrdUtxos: (ordUtxos: OrdUtxo[]) => void;
  send: () => void;
  backupKeys: (e?: any) => void;
  fetchUtxosStatus: FetchStatus;
  setPendingTransaction: (pendingTransaction: PendingTransaction) => void;
  pendingTransaction: PendingTransaction | undefined;
  reset: () => void;
  getOrdinalUTXOs: (address: string) => Promise<void>;
  fetchOrdinalUtxosStatus: FetchStatus | undefined;
  setFetchOrdinalUtxosStatus: (status: FetchStatus) => void;
  balance: number;
};

const WalletContext = createContext<ContextValue | undefined>(undefined);

interface Props {
  children?: ReactNode;
}

const WalletProvider: React.FC<Props> = (props) => {
  const [backupFile, setBackupFile] = useState<File>();
  const [currentTxId, setCurrentTxId] = useLocalStorage<string>("1satctx");

  const [pendingTransaction, setPendingTransaction] = useLocalStorage<
    PendingTransaction | undefined
  >("1satpin", undefined);

  const [inscribedUtxos, setInscribedUtxos] = useState<Utxo[] | undefined>(
    undefined
  );
  const [initialized, setInitialized] = useState<boolean>(false);
  const [artifacts, setArtifacts] = useLocalStorage<Inscription2[] | undefined>(
    "1satart",
    undefined
  );
  const [fundingUtxos, setFundingUtxos] = useState<Utxo[] | undefined>(
    undefined
  );
  const [ordUtxos, setOrdUtxos] = useState<Utxo[] | undefined>(undefined);

  const [fetchOrdinalUtxosStatus, setFetchOrdinalUtxosStatus] =
    useState<FetchStatus>(FetchStatus.Idle);

  const [payPk, setPayPk] = useLocalStorage<string | undefined>(
    "1satfk",
    undefined
  );
  const [ordPk, setOrdPk] = useLocalStorage<string | undefined>(
    "1satok",
    undefined
  );

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
      console.log({ jsonString });
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

  const getTxById = async (txid: string): Promise<TxDetails> => {
    const r = await fetch(
      `https://api.whatsonchain.com/v1/bsv/main/tx/${txid}`
    );
    const utxo = (await r.json()) as TxDetails;
    // let utxo = res.find((u: any) => u.value > 1);
    // TODO: How to get script?

    return utxo;
  };

  const getInscriptionsById = async (
    txid: string,
    vout?: number
  ): Promise<GPInscription[]> => {
    let suffix = txid;
    if (vout !== undefined) {
      suffix += `_${vout}`;
    }

    const r = await fetch(
      `https://ordinals.gorillapool.io/api/inscriptions/${suffix}`
    );
    const utxo = (await r.json()) as GPInscription[];
    // let utxo = res.find((u: any) => u.value > 1);
    // TODO: How to get script?

    return utxo;
  };

  const getRawTxById = async (txid: string): Promise<string> => {
    const r = await fetch(
      `https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/hex`
    );
    const rawTx = await r.text();
    // let utxo = res.find((u: any) => u.value > 1);
    // TODO: How to get script?

    return rawTx;
  };

  const getOrdinalUTXOs = useCallback(
    async (address: string): Promise<void> => {
      // address or custom locking script hash
      setFetchOrdinalUtxosStatus(FetchStatus.Loading);
      try {
        const r = await fetch(
          `https://ordinals.gorillapool.io/api/utxos/address/${address}`
        );
        const utxos = (await r.json()) as GPUtxo[];
        const u = utxos.sort((a: GPUtxo, b: GPUtxo) =>
          a.satoshis > b.satoshis ? -1 : 1
        );
        //
        let filledOrdUtxos: OrdUtxo[] = [];
        for (let a of u) {
          const newA = await fillContentType({
            satoshis: a.satoshis,
            txid: a.txid,
            vout: a.vout,
          } as OrdUtxo);
          filledOrdUtxos.push(newA);
        }
        setOrdUtxos(filledOrdUtxos);
        setFetchOrdinalUtxosStatus(FetchStatus.Success);
        return;
      } catch (e) {
        setFetchOrdinalUtxosStatus(FetchStatus.Error);
        throw e;
      }
    },
    [setFetchOrdinalUtxosStatus, setOrdUtxos]
  );

  const getUTXOs = useCallback(
    async (address: string): Promise<Utxo[]> => {
      setFetchUtxosStatus(FetchStatus.Loading);
      try {
        const r = await fetch(
          `https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent`
        );
        const utxos = await r.json();

        setFetchUtxosStatus(FetchStatus.Success);
        const u = utxos
          .map((utxo: any) => {
            return {
              satoshis: utxo.value,
              vout: utxo.tx_pos,
              txid: utxo.tx_hash,
              script: P2PKHAddress.from_string(address)
                .get_locking_script()
                .to_asm_string(),
            } as Utxo;
          })
          .sort((a: Utxo, b: Utxo) => (a.satoshis > b.satoshis ? -1 : 1));
        setFundingUtxos(u);
        return u;
      } catch (e) {
        setFetchUtxosStatus(FetchStatus.Error);
        throw e;
      }
    },
    [setFetchUtxosStatus, setFundingUtxos]
  );

  useEffect(() => {
    if (fundingUtxos && !currentTxId) {
      if (fundingUtxos) {
        setCurrentTxId(head(fundingUtxos)?.txid);
        toast.success(`Found ${fundingUtxos.length} UTXOs`, {
          style: {
            background: "#333",
            color: "#fff",
          },
        });
      } else {
        console.info("No UTXOs. Please make a depot and refresh the page.");
      }
    }
  }, [setCurrentTxId, currentTxId, fundingUtxos]);

  const getUtxoByTxId = useCallback(
    async (txid: string) => {
      const txDetails = await getTxById(txid);
      let outPoint: OutPoint = {
        txid,
        vout: 0,
      };
      let found: boolean = false;
      // figute out the vout
      for (let out of txDetails.vout) {
        if (
          changeAddress &&
          out.scriptPubKey.addresses?.includes(changeAddress)
        ) {
          outPoint.vout = out.n;
          found = true;
        }
      }
      if (!found) {
        alert("The utxo doesn't match this address");
      }
      setFundingUtxos([
        ...(fundingUtxos || []),
        {
          txid: outPoint.txid,
          satoshis: sb.toSatoshi(txDetails.vout[outPoint.vout].value),
          vout: outPoint.vout,
          script: txDetails.vout[outPoint.vout].scriptPubKey.asm,
        },
      ]);
    },
    [setFundingUtxos, fundingUtxos, changeAddress]
  );

  const getArtifactsByTxId = useCallback(
    async (txid: string): Promise<OrdUtxo[]> => {
      const gpInscriptions = await getInscriptionsById(txid, 0);

      if (!gpInscriptions) {
        alert("No artifacts match this txid");
      }
      return gpInscriptions.map((i) => {
        return {
          vout: i.vout,
          satoshis: 1,
          txid: i.txid,
          type: i.file.type,
        } as OrdUtxo;
      });
    },
    [getInscriptionsById]
  );

  type GPUtxo = {
    txid: string;
    vout: Number;
    satoshis: Number;
    acc_sats: Number;
    lock: string;
    origin: string;
    ordinal: number;
  };

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

  type GPFile = {
    hash: string;
    size: number;
    type: string;
  };

  type GPInscription = {
    id: number;
    txid: string;
    vout: number;
    file: GPFile;
    origin: string;
    ordinal: number;
    height: number;
    idx: number;
    lock: string;
  };

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
        toast.success(`Got ${artifacts.length} artifacts`, {
          style: {
            background: "#333",
            color: "#fff",
          },
        });
      } catch (e) {
        setFetchOrdinalUtxosStatus(FetchStatus.Error);
        throw e;
      }
    },
    [setFetchOrdinalUtxosStatus, setInscribedUtxos, setArtifacts]
  );

  // send balance to an address
  const send = useCallback(async () => {
    if (!initialized || !payPk) {
      return;
    }
    const address = prompt(
      "Wher should we send your funds? Must be a normal Bitcoin SV address starting with a 1"
    );
    if (!address?.startsWith("1")) {
      alert("inivalid receive address");
      return;
    }
    toast(`Sending to ${address}`, {
      style: {
        background: "#333",
        color: "#fff",
      },
    });

    // TODO: api request to send utxos
    const response = await fetch(`/api/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fundingUtxos,
        payPk,
        address,
        feeSats: 20,
      }),
    });
    const { tx, feeSats } = await response.json();
    // TODO: Sign the inputs
    console.log("Refund Tx", tx.to_hex());
    setPendingTransaction({
      rawTx: tx.to_hex(),
      size: tx.get_size(),
      fee: feeSats,
      numInputs: fundingUtxos?.length || 0,
      numOutputs: 1,
    });

    Router.push("/preview");
  }, [setPendingTransaction, initialized, payPk, fundingUtxos]);

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

      toast.success("Keys Cleared", {
        style: {
          background: "#333",
          color: "#fff",
        },
      });
      Router.push("/");
    }
  }, [setPayPk, setOrdPk, setFundingUtxos, setArtifacts, setInscribedUtxos]);

  const balance = useMemo(() => {
    let b = 0;
    for (let fu of fundingUtxos || []) {
      b += fu.satoshis;
    }
    return b;
  }, [fundingUtxos]);

  const generateKeys = useCallback(async () => {
    console.log("callback");
    const { payPk, ordPk } = randomKeys();
    setPayPk(payPk);
    setOrdPk(ordPk);
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

  const reset = useCallback(() => {
    console.log("reset");
    setFundingUtxos(undefined);
    setPendingTransaction(undefined);
  }, [setFundingUtxos, setPendingTransaction]);

  const value = useMemo(
    () => ({
      changeAddress,
      ordAddress,
      artifacts,
      ordPk,
      payPk,
      fundingUtxos,
      backupKeys,
      deleteKeys,
      backupFile,
      generateKeys,
      send,
      pendingTransaction,
      setPendingTransaction,
      reset,
      setBackupFile,
      initialized,
      getUtxoByTxId,
      currentTxId,
      setCurrentTxId,
      getOrdinalUTXOs,
      fetchUtxosStatus,
      fetchOrdinalUtxosStatus,
      setFetchOrdinalUtxosStatus,
      balance,
      getUTXOs,
      ordUtxos,
      setOrdUtxos,
      getArtifactsByTxId,
    }),
    [
      backupFile,
      changeAddress,
      ordUtxos,
      ordAddress,
      artifacts,
      ordPk,
      payPk,
      fundingUtxos,
      deleteKeys,
      backupKeys,
      generateKeys,
      send,
      setPendingTransaction,
      pendingTransaction,
      reset,
      getOrdinalUTXOs,
      setBackupFile,
      initialized,
      getUtxoByTxId,
      currentTxId,
      setCurrentTxId,
      fetchUtxosStatus,
      fetchOrdinalUtxosStatus,
      setFetchOrdinalUtxosStatus,
      balance,
      setOrdUtxos,
      getUTXOs,
      getArtifactsByTxId,
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
