import { FetchStatus } from "@/components/pages";
import { addressFromWif } from "@/utils/address";
import { randomKeys } from "@/utils/keys";
import { useLocalStorage } from "@/utils/storage";
import init, {
  P2PKHAddress,
  PrivateKey,
  Script,
  SigHash,
  Transaction,
  TxIn,
  TxOut,
} from "bsv-wasm-web";
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

export type PendingInscription = {
  rawTx: string;
  size: number;
  fee: number;
  numInputs: number;
  numOutputs: number;
};

type ContextValue = {
  fundingUtxos: Utxo[] | undefined;
  payPk: string | undefined;
  ordPk: string | undefined;
  setBackupFile: (backupFile: File) => void;
  initialized: boolean;
  deleteKeys: (e?: any) => void;
  receiverAddress: string | undefined;
  changeAddress: string | undefined;
  artifacts: Inscription2[] | undefined;
  backupFile: File | undefined;
  generateKeys: () => void;
  getUtxoByTxId: (txid: string) => Promise<void>;
  getUTXOs: (address: string) => Promise<Utxo[]>;
  currentTxId: string | undefined;
  setCurrentTxId: (txid: string) => void;
  refund: () => void;
  backupKeys: (e?: any) => void;
  fetchUtxosStatus: FetchStatus;
  setPendingInscription: (pendingInscription: PendingInscription) => void;
  pendingInscription: PendingInscription | undefined;
  reset: () => void;
  getArtifacts: (address: string) => Promise<void>;
  fetchArtifactsStatus: FetchStatus | undefined;
  setFetchArtifactsStatus: (status: FetchStatus) => void;
  balance: number;
};

const WalletContext = createContext<ContextValue | undefined>(undefined);

interface Props {
  children?: ReactNode;
}

const WalletProvider: React.FC<Props> = (props) => {
  const [backupFile, setBackupFile] = useState<File>();
  const [currentTxId, setCurrentTxId] = useLocalStorage<string>("1satctx");

  const [pendingInscription, setPendingInscription] = useLocalStorage<
    PendingInscription | undefined
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

  const [fetchArtifactsStatus, setFetchArtifactsStatus] =
    useLocalStorage<FetchStatus>("1satafs", FetchStatus.Idle);

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

  const receiverAddress = useMemo(
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

  const getRawTxById = async (txid: string): Promise<string> => {
    const r = await fetch(
      `https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/hex`
    );
    const rawTx = await r.text();
    // let utxo = res.find((u: any) => u.value > 1);
    // TODO: How to get script?

    return rawTx;
  };

  // TODO: Get Ordinals UTXOs
  const getOrdinalUTXOs = async (address: string): Promise<Utxo[]> => {
    // address or custom locking script hash
    setFetchOrdinalUtxosStatus(FetchStatus.Loading);
    try {
      const r = await fetch(
        `https://ordinals.gorillapool.io/v1/utxo/${address}`
      );

      return [];
    } catch (e) {
      setFetchUtxosStatus(FetchStatus.Error);
      throw e;
    }
  };

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

  const getArtifacts = useCallback(
    async (address: string): Promise<void> => {
      setFetchArtifactsStatus(FetchStatus.Loading);
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
              const outPoint = `${tx.get_id_hex()}_o${x}}`;
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
        setFetchArtifactsStatus(FetchStatus.Success);
        setInscribedUtxos(iUtxos);
        setArtifacts(artifacts);
        toast.success(`Got ${artifacts.length} artifacts`, {
          style: {
            background: "#333",
            color: "#fff",
          },
        });
      } catch (e) {
        setFetchArtifactsStatus(FetchStatus.Error);
        throw e;
      }
    },
    [setFetchArtifactsStatus, setInscribedUtxos, setArtifacts]
  );

  // refund balance to an address
  const refund = useCallback(() => {
    if (!initialized || !payPk) {
      return;
    }
    const refundToAddress = prompt(
      "Wher should we send your funds? Must be a normal Bitcoin SV address starting with a 1"
    );
    if (!refundToAddress?.startsWith("1")) {
      alert("inivalid refund address");
      return;
    }
    toast(`Refunding to ${refundToAddress}`, {
      style: {
        background: "#333",
        color: "#fff",
      },
    });

    const address = P2PKHAddress.from_string(refundToAddress);
    const tx = new Transaction(1, 0);

    // Outputs
    let inputValue = 0;
    for (let u of fundingUtxos || []) {
      inputValue += u.satoshis;
    }
    const satsIn = inputValue;
    const feeSats = 20;
    const satsOut = satsIn - feeSats;
    console.log({ feeSats, satsIn, satsOut });
    tx.add_output(new TxOut(BigInt(satsOut), address.get_locking_script()));

    // build txins from our UTXOs
    let idx = 0;
    for (let u of fundingUtxos || []) {
      console.log({ u });
      const inx = new TxIn(
        Buffer.from(u.txid, "hex"),
        u.vout,
        Script.from_asm_string("")
      );
      console.log({ inx });

      tx.add_input(inx);

      const paymentPk = PrivateKey.from_wif(payPk);

      const sig = tx.sign(
        paymentPk,
        SigHash.ALL | SigHash.FORKID,
        idx,
        Script.from_asm_string(u.script),
        BigInt(u.satoshis)
      );

      const s = Script.from_asm_string(u.script);
      inx.set_unlocking_script(
        P2PKHAddress.from_string(changeAddress || "").get_unlocking_script(
          paymentPk.to_public_key(),
          sig
        )
      );
      // inx.set_unlocking_script(
      //   Script.from_asm_string(
      //     `${sig.to_hex()} ${paymentPk.to_public_key().to_hex()}`
      //   )
      // );

      tx.set_input(idx, inx);
      idx++;
    }

    // TODO: Sign the inputs
    console.log("Refund Tx", tx.to_hex());
    setPendingInscription({
      rawTx: tx.to_hex(),
      size: tx.get_size(),
      fee: feeSats,
      numInputs: fundingUtxos?.length || 0,
      numOutputs: 1,
    });

    Router.push("/preview");
  }, [setPendingInscription, changeAddress, initialized, payPk, fundingUtxos]);

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
  }, [payPk, ordPk]);

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
    setPendingInscription(undefined);
  }, [setFundingUtxos, setPendingInscription]);

  const value = useMemo(
    () => ({
      changeAddress,
      receiverAddress,
      artifacts,
      ordPk,
      payPk,
      fundingUtxos,
      backupKeys,
      deleteKeys,
      backupFile,
      generateKeys,
      refund,
      pendingInscription,
      setPendingInscription,
      reset,
      setBackupFile,
      initialized,
      getUtxoByTxId,
      currentTxId,
      setCurrentTxId,
      getArtifacts,
      fetchUtxosStatus,
      fetchArtifactsStatus,
      setFetchArtifactsStatus,
      balance,
      getUTXOs,
    }),
    [
      backupFile,
      changeAddress,
      receiverAddress,
      artifacts,
      ordPk,
      payPk,
      fundingUtxos,
      deleteKeys,
      backupKeys,
      generateKeys,
      refund,
      setPendingInscription,
      pendingInscription,
      reset,
      getArtifacts,
      setBackupFile,
      initialized,
      getUtxoByTxId,
      currentTxId,
      setCurrentTxId,
      fetchUtxosStatus,
      fetchArtifactsStatus,
      setFetchArtifactsStatus,
      balance,
      getUTXOs,
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
