import { FetchStatus } from "@/components/pages";
import { API_HOST } from "@/pages/_app";
import { addressFromWif } from "@/utils/address";
import { randomKeys } from "@/utils/keys";
import { useLocalStorage } from "@/utils/storage";
import {
  Address,
  Bn,
  Br,
  Hash,
  KeyPair,
  PrivKey,
  PubKey,
  Script,
  Sig,
  Tx,
  TxBuilder,
  TxIn,
  TxOut,
  VarInt,
} from "@ts-bitcoin/core";

import init, {
  P2PKHAddress,
  PrivateKey,
  Script as WasmScript,
  SigHash,
  Transaction,
  TxIn as WasmTxIn,
  TxOut as WasmTxOut,
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
  ordinal?: number;
  height: number;
  idx: number;
  lock: string;
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
  origin?: string;
  id?: number;
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
  generateKeys: () => Promise<void>;
  getArtifactsByTxId: (txid: string) => Promise<OrdUtxo[]>;
  getArtifactsByOrigin: (txid: string) => Promise<OrdUtxo[]>;
  getArtifactByInscriptionId: (
    inscriptionId: number
  ) => Promise<OrdUtxo | undefined>;
  getUTXOs: (address: string) => Promise<Utxo[]>;
  currentTxId: string | undefined;
  setCurrentTxId: (txid: string) => void;
  setOrdUtxos: (ordUtxos: OrdUtxo[]) => void;
  send: (address: string) => Promise<void>;
  transfer: (ordUtxo: OrdUtxo, toAddress: string) => Promise<void>;
  backupKeys: (e?: any) => void;
  fetchUtxosStatus: FetchStatus;
  fetchInscriptionsStatus: FetchStatus;
  setPendingTransaction: (pendingTransaction: PendingTransaction) => void;
  pendingTransaction: PendingTransaction | undefined;
  reset: () => void;
  getOrdinalUTXOs: (address: string) => Promise<void>;
  fetchOrdinalUtxosStatus: FetchStatus | undefined;
  setFetchOrdinalUtxosStatus: (status: FetchStatus) => void;
  setFetchInscriptionsStatus: (status: FetchStatus) => void;
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
  const [fetchInscriptionsStatus, setFetchInscriptionsStatus] =
    useState<FetchStatus>(FetchStatus.Idle);

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

  const getOrdinalUTXOs = useCallback(
    async (address: string): Promise<void> => {
      // address or custom locking script hash
      setFetchOrdinalUtxosStatus(FetchStatus.Loading);

      try {
        const r = await fetch(
          `${API_HOST}/api/utxos/address/${address}/inscriptions`
        );

        const utxos = (await r.json()) as GPInscription[];

        let oUtxos: OrdUtxo[] = [];
        for (let a of utxos) {
          const parts = a.origin.split("_");

          oUtxos.push({
            satoshis: 1, // all ord utxos currently 1 satoshi
            txid: a.txid,
            vout: parseInt(parts[1]),
            origin: a.origin,
            type: a.file.type,
          } as OrdUtxo);
        }
        setOrdUtxos(oUtxos);
        setFetchOrdinalUtxosStatus(FetchStatus.Success);
        return;
      } catch (e) {
        setFetchOrdinalUtxosStatus(FetchStatus.Error);
        throw e;
      }
    },
    [setFetchOrdinalUtxosStatus, setOrdUtxos]
  );

  useEffect(() => {
    const fire = async (a: string) => {
      await getOrdinalUTXOs(a);
    };
    if (ordAddress && fetchOrdinalUtxosStatus === FetchStatus.Idle) {
      fire(ordAddress);
    }
  }, [getOrdinalUTXOs, ordAddress, fetchOrdinalUtxosStatus]);

  const getTxById = async (txid: string): Promise<TxDetails> => {
    const r = await fetch(
      `https://api.whatsonchain.com/v1/bsv/main/tx/${txid}`
    );
    const utxo = (await r.json()) as TxDetails;
    // let utxo = res.find((u: any) => u.value > 1);
    // TODO: How to get script?

    return utxo;
  };

  const getInscriptionsById = useCallback(
    async (txidOrOrigin: string): Promise<GPInscription[]> => {
      let [txid, vout] = txidOrOrigin.split("_");
      let suffix = "";
      if (vout) {
        suffix += `origin/${txid}_${vout}`;
      } else {
        suffix += `txid/${txid}`;
      }

      setFetchInscriptionsStatus(FetchStatus.Loading);
      try {
        const r = await fetch(`${API_HOST}/api/inscriptions/${suffix}`);
        const inscriptions = (await r.json()) as GPInscription[];
        setFetchInscriptionsStatus(FetchStatus.Success);
        // let utxo = res.find((u: any) => u.value > 1);
        // TODO: How to get script?

        return inscriptions;
      } catch (e) {
        setFetchInscriptionsStatus(FetchStatus.Error);

        throw e;
      }
    },
    []
  );

  const getInscriptionByInscriptionId = useCallback(
    async (inscriptionId: number): Promise<GPInscription> => {
      setFetchInscriptionsStatus(FetchStatus.Loading);
      try {
        const r = await fetch(`${API_HOST}/api/inscriptions/${inscriptionId}`);
        const inscription = (await r.json()) as GPInscription;
        setFetchInscriptionsStatus(FetchStatus.Success);
        return inscription;
      } catch (e) {
        setFetchInscriptionsStatus(FetchStatus.Error);
        throw e;
      }
    },
    [setFetchInscriptionsStatus]
  );

  const getRawTxById = async (txid: string): Promise<string> => {
    const r = await fetch(
      `https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/hex`
    );
    return await r.text();
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

  const getArtifactsByTxId = useCallback(
    async (txidOrOrigin: string): Promise<OrdUtxo[]> => {
      const gpInscriptions = await getInscriptionsById(txidOrOrigin);

      if (!gpInscriptions) {
        return [];
      }
      return gpInscriptions.map((i) => {
        return {
          vout: i.vout,
          satoshis: 1,
          txid: i.txid,
          type: i.file.type,
          origin: i.origin,
          id: i.id,
        } as OrdUtxo;
      });
    },
    [getInscriptionsById]
  );

  const getArtifactByInscriptionId = useCallback(
    async (inscriptionId: number): Promise<OrdUtxo | undefined> => {
      const gpInscription = await getInscriptionByInscriptionId(inscriptionId);

      if (!gpInscription) {
        return;
      }
      return {
        vout: gpInscription.vout,
        satoshis: 1,
        txid: gpInscription.txid,
        type: gpInscription.file.type,
        origin: gpInscription.origin,
        id: gpInscription.id,
      } as OrdUtxo;
    },
    [getInscriptionByInscriptionId]
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
        debugger;
        const ordRawTx = await getRawTxById(ordUtxo.txid);
        const tx = Transaction.from_hex(ordRawTx);
        const out = tx.get_output(ordUtxo.vout);
        const script = out?.get_script_pub_key();
        if (script) {
          ordUtxo.script = script.to_asm_string();
        }
      }
      const fundingUtxo = head(fundingUtxos);
      if (fundingUtxo && !fundingUtxo.script) {
        const ordRawTx = await getRawTxById(fundingUtxo.txid);
        const tx = Transaction.from_hex(ordRawTx);
        const out = tx.get_output(ordUtxo.vout);
        const script = out?.get_script_pub_key();
        if (script) {
          fundingUtxo.script = script.to_asm_string();
        }
      }
      const response = await fetch(`/api/ordinal/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fundingUtxo,
          ordUtxo,
          payPk,
          ordPk,
          address: toOrdAddress,
          satsPerByteFee: 0.125,
        }),
      });
      const { rawTx, fee, size } = await response.json();

      console.log("Transfer Tx", rawTx);
      setPendingTransaction({
        rawTx,
        size,
        fee,
        numInputs: 2,
        numOutputs: 2,
      });

      Router.push("/preview");
    },
    [setPendingTransaction, payPk, ordPk, fundingUtxos]
  );

  const sendApi = useCallback(async () => {
    if (!payPk) {
      return;
    }
    const address = prompt(
      "Where should we send your funds? Must be a normal Bitcoin SV address starting with a 1"
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
    const response = await fetch(`/api/payment/send`, {
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
    const resp = await response.json();
    console.log({ resp });
    const { rawTx, fee, size, numInputs, numOutputs } = resp;
    // TODO: Sign the inputs
    console.log("Refund Tx", rawTx);
    setPendingTransaction({
      rawTx,
      size,
      fee,
      numInputs,
      numOutputs,
    });

    Router.push("/preview");
  }, [setPendingTransaction, payPk, fundingUtxos]);

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
      });

      Router.push("/preview");
    },
    [setPendingTransaction, payPk, fundingUtxos]
  );

  const sendTxBuilder = useCallback(async () => {
    if (!payPk) {
      return;
    }
    if (!fundingUtxos || fundingUtxos?.length == 0) {
      alert("Nothing to send");
      return;
    }
    const address = prompt(
      "Where should we send your funds? Must be a normal Bitcoin SV address starting with a 1"
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

    // fundingUtxos,
    // payPk,
    // address,

    // Prepare payment constants
    const paymentPk = new PrivKey().fromWif(payPk);
    const paymentPubKey = new PubKey().fromPrivKey(paymentPk);
    const pubKeyBuf = paymentPubKey.toBuffer();
    const pubKeyHash = Hash.sha256Ripemd160(pubKeyBuf);
    const paymentScript = new Script().fromPubKeyHash(pubKeyHash);
    const keyPair = new KeyPair().fromPrivKey(paymentPk);

    // destination constants
    const destinationAddress = new Address().fromString(address);
    const destinationScript = destinationAddress.toTxOutScript();

    console.log({ script: paymentScript.toAsmString() });

    let txb = new TxBuilder().setFeePerKbNum(0.0001e8);

    let i = 0;

    for (let u of fundingUtxos) {
      console.log({ i });
      const out = TxOut.fromProperties(
        new Bn(u.satoshis),
        new Script().fromAsmString(u.script)
      );
      const txHashBuf = Buffer.from(u.txid, "hex").reverse();

      txb.inputFromScript(
        txHashBuf,
        i,
        out,
        new Script().fromAsmString(u.script)
      );
      // txb = txb.inputFromPubKeyHash(
      //   Buffer.from(u.txid).reverse(),
      //   i,
      //   out,
      //   paymentPubKey
      // );
      i++;
    }

    txb = txb.setChangeAddress(destinationAddress);
    const tx = txb.build();

    console.log("inputs", tx.txIns.length, fundingUtxos.length);

    i = 0;
    for (let utxo of fundingUtxos) {
      const keyPair = new KeyPair().fromPrivKey(paymentPk);
      // const utxoScriptHex = WasmScript.from_asm_string(utxo.script).to_hex();
      // console.log({ utxoScriptHex });
      const sig = tx.sign(
        keyPair,
        Sig.SIGHASH_ALL,
        i,
        paymentScript,
        new Bn(utxo.satoshis)
      );
      const pubKeyHash = Hash.sha256Ripemd160(keyPair.pubKey.toBuffer());

      tx.txIns[i].setScript(
        new Script().fromAsmString(`${sig} ${pubKeyHash.toString("hex")}`)
      );
      i++;
    }
    setPendingTransaction({
      rawTx: tx.toHex(),
      size: Math.ceil(tx.toHex().length / 2),
      fee: 20,
      numInputs: tx.txIns.length,
      numOutputs: tx.txOuts.length,
    } as PendingTransaction);
    // sign
    Router.push("/preview");
  }, [setPendingTransaction, payPk, fundingUtxos]);

  const sendTx = useCallback(async () => {
    if (!payPk) {
      return;
    }
    if (!fundingUtxos || fundingUtxos?.length == 0) {
      alert("Nothing to send");
      return;
    }
    const address = prompt(
      "Where should we send your funds? Must be a normal Bitcoin SV address starting with a 1"
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

    // fundingUtxos,
    // payPk,
    // address,

    // Prepare payment constants
    const paymentPk = new PrivKey().fromWif(payPk);
    const paymentPubKey = new PubKey().fromPrivKey(paymentPk);
    const pubKeyBuf = paymentPubKey.toBuffer();
    const pubKeyHash = Hash.sha256Ripemd160(pubKeyBuf);
    const paymentScript = new Script().fromPubKeyHash(pubKeyHash);
    const keyPair = new KeyPair().fromPrivKey(paymentPk);

    // destination constants
    const destinationAddress = new Address().fromString(address);
    const destinationScript = destinationAddress.toTxOutScript();

    console.log({ script: paymentScript.toAsmString() });

    let i = 0;

    // add inputs
    let totalSatsIn = 0;
    let txIns: TxIn[] = [];
    for (const u of fundingUtxos) {
      console.log({ u });
      const txHashBuf = new Br(Buffer.from(u.txid, "hex")).readReverse();
      // const txHashBuf = Buffer.from(u.txid);
      // const utxoIn = new TxIn().fromObject({
      //   txHashBuf,
      //   txOutNum: u.vout,
      //   scriptVi: paymentScriptVi,
      //   script: paymentScript,
      //   nSequence: 0,
      // });
      const utxoIn = new TxIn().fromProperties(
        txHashBuf,
        u.vout,
        paymentScript,
        0
      );
      console.log({ utxoIn });
      txIns.push(utxoIn);
      totalSatsIn += u.vout;
    }

    // add output
    const fee = 20;
    const satsOut = totalSatsIn - fee;
    const output = new TxOut().fromProperties(
      new Bn(satsOut),
      destinationScript
    );

    const tx = new Tx().fromObject({
      versionBytesNum: 1,
      txInsVi: VarInt.fromNumber(txIns.length),
      txIns,
      txOutsVi: VarInt.fromNumber(1),
      txOuts: [output],
      nLockTime: 0,
    });

    console.log("inputs", tx.txIns.length, fundingUtxos.length);

    // sign inputs
    const rawTx = tx.toHex();
    console.log({ tx, rawTx });

    i = 0;
    for (let utxo of fundingUtxos) {
      const keyPair = new KeyPair().fromPrivKey(paymentPk);
      // const utxoScriptHex = WasmScript.from_asm_string(utxo.script).to_hex();
      // console.log({ utxoScriptHex });
      const sig = tx.sign(
        keyPair,
        Sig.SIGHASH_ALL,
        i,
        paymentScript,
        new Bn(utxo.satoshis)
      );
      const pubKeyHash = Hash.sha256Ripemd160(keyPair.pubKey.toBuffer());

      tx.txIns[i].setScript(
        new Script().fromAsmString(`${sig} ${pubKeyHash.toString("hex")}`)
      );
      i++;
    }
    setPendingTransaction({
      rawTx: tx.toHex(),
      size: Math.ceil(tx.toHex().length / 2),
      fee: 20,
      numInputs: tx.txIns.length,
      numOutputs: tx.txOuts.length,
    } as PendingTransaction);
    // sign
    Router.push("/preview");
  }, [setPendingTransaction, payPk, fundingUtxos]);

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

      toast.success("Keys Cleared", {
        style: {
          background: "#333",
          color: "#fff",
        },
      });
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
      send: sendWasm,
      pendingTransaction,
      setPendingTransaction,
      reset,
      setBackupFile,
      initialized,
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
      fetchInscriptionsStatus,
      getArtifactsByTxId,
      getArtifactByInscriptionId,
      setFetchInscriptionsStatus,
      getArtifactsByOrigin: getArtifactsByTxId,
      transfer,
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
      sendWasm,
      setPendingTransaction,
      pendingTransaction,
      reset,
      getOrdinalUTXOs,
      setBackupFile,
      initialized,
      currentTxId,
      setCurrentTxId,
      fetchUtxosStatus,
      fetchOrdinalUtxosStatus,
      setFetchOrdinalUtxosStatus,
      balance,
      setOrdUtxos,
      getUTXOs,
      getArtifactsByTxId,
      fetchInscriptionsStatus,
      getArtifactByInscriptionId,
      setFetchInscriptionsStatus,
      transfer,
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
