import { FetchStatus, toastProps } from "@/components/pages";
import { handleTransferring } from "@/context/wallet/transfer";
import { addressFromWif } from "@/utils/address";
import { randomKeys } from "@/utils/keys";
import { useLocalStorage } from "@/utils/storage";
import { base64UrlToUint8Array } from "@/utils/uint8array";
import { getRawTxById } from "@/utils/whatsOnChain";
import init, {
  P2PKHAddress,
  PrivateKey,
  SigHash,
  Transaction,
  Script as WasmScript,
  TxIn as WasmTxIn,
  TxOut as WasmTxOut,
} from "bsv-wasm-web";
import { Utxo } from "js-1sat-ord";
import { head } from "lodash";
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
import { useSocket } from "../bitsocket";
import { API_HOST, GPInscription, OrdUtxo } from "../ordinals";
import { useRates } from "../rates";
import { encryptionPrefix, useStorage } from "../storage";
import {
  EncryptDecrypt,
  EncryptedBackupJson,
  PendingTransaction,
} from "./types";

export const PROTOCOL_START_HEIGHT = 783968;

type ContextValue = {
  backupFile: File | undefined;
  backupKeys: (e?: any) => void;
  balance: number;
  changeAddress: string | undefined;
  changeAddressPath: string | undefined;
  deleteKeys: (e?: any) => void;
  encryptedBackupJson: EncryptedBackupJson | undefined;
  fetchOrdinalUtxosStatus: FetchStatus | undefined;
  fetchUtxosStatus: FetchStatus;
  fundingUtxos: Utxo[] | undefined;
  generateKeys: () => Promise<void>;
  generateStatus: FetchStatus;
  getOrdinalUTXOs: (address: string) => Promise<void>;
  getRawTxById: (id: string) => Promise<string>;
  getUTXOs: (address: string) => Promise<Utxo[]>;
  initialized: boolean;
  loadEncryptedKeys: () => Promise<void>;
  mnemonic: string | undefined;
  ordAddress: string | undefined;
  ordAddressPath: string | undefined;
  ordPk: string | undefined;
  ordUtxos: OrdUtxo[] | undefined;
  passphrase: string | undefined;
  payPk: string | undefined;
  pendingTransaction: PendingTransaction | undefined;
  send: (address: string) => Promise<void>;
  setBackupFile: (backupFile: File) => void;
  setEncryptedBackupJson: (json: EncryptedBackupJson) => void;
  setFetchOrdinalUtxosStatus: (status: FetchStatus) => void;
  setOrdUtxos: (ordUtxos: OrdUtxo[]) => void;
  setPassphrase: (phrase: string) => void;
  setPendingTransaction: (pendingTransaction: PendingTransaction) => void;
  setShowEnterPassphrase: (show: EncryptDecrypt | undefined) => void;
  showEnterPassphrase: EncryptDecrypt | undefined;
  transfer: (ordUtxo: OrdUtxo, toAddress: string) => Promise<void>;
  usdRate: number | undefined;
};

const WalletContext = createContext<ContextValue | undefined>(undefined);

interface Props {
  children?: ReactNode;
}

const WalletProvider: React.FC<Props> = (props) => {
  const { ready, getItem, setItem, decryptData, removeItem, encryptionKey } =
    useStorage(); // Access the storage context values

  // bsv-wasm initialization flag
  const [initialized, setInitialized] = useState<boolean>(false);

  // Fetch status variables
  const [fetchOrdinalUtxosStatus, setFetchOrdinalUtxosStatus] =
    useState<FetchStatus>(FetchStatus.Idle);
  const [fetchUtxosStatus, setFetchUtxosStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

  // Modal control flags
  const [showEnterPassphrase, setShowEnterPassphrase] = useState<
    EncryptDecrypt | undefined
  >();

  // Backup file
  const [backupFile, setBackupFile] = useState<File>();

  // Real-time socket events via SSE
  const { leid, lastEvent } = useSocket();
  const [lastEventId, setLastEventId] = useState<string>();

  // PrendingTransaction is used on the preview broadcast screen
  const [pendingTransaction, setPendingTransaction] = useState<
    PendingTransaction | undefined
  >(undefined);

  // Unspent transaction outputs for funding and ordinal addresses
  const [ordUtxos, setOrdUtxos] = useState<Utxo[] | undefined>(undefined);
  const [fundingUtxos, setFundingUtxos] = useState<Utxo[] | undefined>(
    undefined
  );

  // Local state variables for displaying keys to user
  // and signing transactions / messages
  const [payPk, setPayPk] = useState<string | undefined>(undefined);
  const [ordPk, setOrdPk] = useState<string | undefined>(undefined);
  const [mnemonic, setMnemonic] = useState<string | undefined>(undefined);

  // passphrase is used to encrypt keys
  const [passphrase, setPassphrase] = useState<string | undefined>();

  // The child key deptch for the funding and ordinal addresses
  const [changeAddressPath, setChangeAddressPath] = useState<
    string | undefined
  >(undefined);
  const [ordAddressPath, setOrdAddressPath] = useState<string | undefined>(
    undefined
  );

  // Currency display
  const [usdRate, setUsdRate] = useState<number>(0);
  const { rates } = useRates();

  // Needs to persist so we can decrypt the local keys file
  const [encryptedBackupJson, setEncryptedBackupJson] =
    useLocalStorage<EncryptedBackupJson>("1sebj", undefined);
  const [generateStatus, setGenerateStatus] = useState<FetchStatus>(
    FetchStatus.Idle
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
  }, [ready, getItem, ordPk, payPk, setOrdPk, setPayPk]);

  // The file can be encryptred or not
  // an encrypted file must have a pubKey
  // a non-encrypted file must have a payPk and ordPk
  const loadEncryptedKeys = useCallback(
    async (file?: File) => {
      let json;
      if (file) {
        const jsonString = await file.text();
        json = JSON.parse(jsonString);
      } else {
        const encryptedBackup = await getItem("encryptedBackup", false);
        if (encryptedBackup) {
          const pubKey = await getItem("pubKey", false);
          json = { encryptedBackup, pubKey };
        } else {
          await loadUnencryptedKeys();
        }
      }

      if (json?.encryptedBackup) {
        setEncryptedBackupJson(json as EncryptedBackupJson);
        if (!payPk) {
          setShowEnterPassphrase(EncryptDecrypt.Decrypt);
        }
      } else {
        console.log("Tried to find encrypted keys but none found");
      }
    },
    [loadUnencryptedKeys, getItem, payPk, setEncryptedBackupJson]
  );

  // Once encrypted backup is loaded into json, load the keys
  useEffect(() => {
    if (encryptionKey && encryptedBackupJson?.encryptedBackup) {
      try {
        const encryptedData = encryptedBackupJson.encryptedBackup.slice(
          encryptionPrefix.length
        );

        const str = base64UrlToUint8Array(encryptedData);
        const decryptedBinaryData = decryptData(str, encryptionKey);
        const decryptedBase64Data = btoa(
          new TextDecoder().decode(decryptedBinaryData)
        );
        const decryptedKeys = JSON.parse(atob(decryptedBase64Data));
        const { ordPk: decryptedOrdPk, payPk: decryptedPayPk } = decryptedKeys;

        setOrdPk(decryptedOrdPk);
        setPayPk(decryptedPayPk);
      } catch (error) {
        console.error("Decryption error:", error);
      }
    }
  }, [decryptData, encryptionKey, encryptedBackupJson, setOrdPk, setPayPk]);

  // Load encrypted keys from backup as soon
  // as it is available, or when a file is set
  useEffect(() => {
    if (ready) {
      if (backupFile) {
        loadEncryptedKeys(backupFile);
      } else {
        loadEncryptedKeys();
      }
    }
  }, [ready, backupFile, loadEncryptedKeys]);

  // Set the satoshi price for 1 USD
  // used for displaying USD values
  useEffect(() => {
    if (rates && rates.length > 0) {
      // Gives rate for 1 USD in satoshis
      let usdRate = rates.filter((r) => r.currency === "usd")[0]
        .price_in_satoshis;
      setUsdRate(usdRate);
    }
  }, [rates, usdRate]);

  // Add incoming UTXOs from socket event to ordUtxos
  useEffect(() => {
    if (lastEvent && ordUtxos && leid !== lastEventId) {
      setLastEventId(leid);
      const e = lastEvent as any;
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
          {
            satoshis: e.satoshis,
            txid: e.txid,
            // id: parseInt(e.id),
            vout: e.vout,
            type: e.file?.type,
            origin: e.origin,
            height: e.height,
          } as OrdUtxo,
          ...filteredOrdUtxos,
        ]);
      } else {
        setOrdUtxos(filteredOrdUtxos);
      }
    }
  }, [leid, setLastEventId, ordUtxos, setOrdUtxos, lastEvent, lastEventId]);

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
          oUtxos.push({
            satoshis: 1, // all ord utxos currently 1 satoshi
            txid: a.txid,
            vout: a.vout,
            id: a.id,
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
    if (fundingUtxos) {
      if (fundingUtxos) {
        toast.success(`Found ${fundingUtxos.length} UTXOs`, toastProps);
      } else {
        console.info("No UTXOs. Please make a depot and refresh the page.");
      }
    }
  }, [fundingUtxos]);

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

  // transfer an ordinal to an ordinal address
  const transfer = useCallback(
    async (ordUtxo: OrdUtxo, toOrdAddress: string) => {
      if (!payPk || !ordPk || !ordUtxo || !toOrdAddress || !fundingUtxos) {
        console.error("Can't transfer. Missing parameter", {
          payPk,
          ordPk,
          toOrdAddress,
          ordUtxo,
          fundingUtxos,
        });
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
        const out = tx.get_output(ordUtxo.vout);
        const script = out?.get_script_pub_key();
        if (script) {
          ordUtxo.script = script.to_asm_string();
        }
      }
      const fundingUtxo = head(fundingUtxos);
      if (fundingUtxo && !fundingUtxo.script) {
        const fundingRawTx = await getRawTxById(fundingUtxo.txid);
        const tx = Transaction.from_hex(fundingRawTx);
        const out = tx.get_output(ordUtxo.vout);
        const script = out?.get_script_pub_key();
        if (script) {
          fundingUtxo.script = script.to_asm_string();
        }
      }

      const address = toOrdAddress;
      const satsPerByteFee = 0.125;

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
            setPendingTransaction({
              rawTx,
              size: tx.get_size(),
              fee,
              numInputs: tx.get_ninputs(),
              numOutputs: tx.get_noutputs(),
              txid: tx.get_id_hex(),
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

  const send = useCallback(
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
      tx.add_output(
        new WasmTxOut(
          BigInt(satsOut),
          P2PKHAddress.from_string(address).get_locking_script()
        )
      );

      // build txins from our UTXOs
      let idx = 0;
      for (let u of fundingUtxos || []) {
        const inx = new WasmTxIn(
          Buffer.from(u.txid, "hex"),
          u.vout,
          WasmScript.from_asm_string("")
        );
        inx.set_satoshis(BigInt(u.satoshis));
        tx.add_input(inx);

        const sig = tx.sign(
          paymentPk,
          SigHash.InputOutputs,
          idx,
          WasmScript.from_asm_string(u.script),
          BigInt(u.satoshis)
        );

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
      setPendingTransaction({
        rawTx,
        size: Math.ceil(rawTx.length / 2),
        fee: 20,
        numInputs: tx.get_ninputs(),
        numOutputs: tx.get_noutputs(),
        txid: tx.get_id_hex(),
      });

      Router.push("/preview");
    },
    [setPendingTransaction, payPk, fundingUtxos]
  );

  const deleteKeys = useCallback(async () => {
    const c = confirm(
      "Are you sure you want to clear your keys from the browser? This cannot be undone!"
    );

    if (c) {
      await removeItem("ordPk");
      await removeItem("payPk");
      await removeItem("encryptedBackup");
      setPayPk(undefined);
      setOrdPk(undefined);
      setMnemonic(undefined);
      setFundingUtxos(undefined);
      setBackupFile(undefined);
      setOrdUtxos(undefined);

      setEncryptedBackupJson(undefined);
      setChangeAddressPath(undefined);
      setOrdAddressPath(undefined);

      toast.success("Keys Cleared", toastProps);
      // Router.push("/");
    }
  }, [
    setOrdAddressPath,
    setChangeAddressPath,
    setEncryptedBackupJson,
    removeItem,
    setOrdUtxos,
    setPayPk,
    setOrdPk,
    setFundingUtxos,
    setMnemonic,
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
      try {
        setGenerateStatus(FetchStatus.Loading);
        const { payPk, ordPk, mnemonic, changeAddressPath, ordAddressPath } =
          await randomKeys();
        setGenerateStatus(FetchStatus.Success);

        // store payment public key for encryption salt
        const publicKey = PrivateKey.from_wif(payPk).to_public_key().to_hex();
        setItem("publicKey", publicKey, false);
        setEncryptedBackupJson({
          pubKey: publicKey,
          encryptedBackup: encryptedBackupJson?.encryptedBackup,
          fundingChildKey: changeAddressPath,
          ordChildKey: ordAddressPath,
        });
        setMnemonic(mnemonic);
        // setChangeAddressPath(`m/${changeAddressPath}`);
        // setOrdAddressPath(`m/${ordAddressPath}`);
        setPayPk(payPk);
        setOrdPk(ordPk);
        resolve();
      } catch (e) {
        setGenerateStatus(FetchStatus.Error);
        reject(e);
      }
    });
  }, [
    encryptedBackupJson,
    setChangeAddressPath,
    setOrdAddressPath,
    setGenerateStatus,
    setItem,
    setMnemonic,
    ready,
    setOrdPk,
    setPayPk,
  ]);

  const backupKeys = useCallback(
    (e?: any) => {
      const keysToSave = encryptedBackupJson
        ? encryptedBackupJson
        : { payPk, ordPk };
      var dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(keysToSave));

      const clicker = document.createElement("a");
      clicker.setAttribute("href", dataStr);
      clicker.setAttribute("download", `1sat-${ordAddress}.json`);
      clicker.click();
    },
    [
      encryptionKey,
      payPk,
      ordPk,
      ordAddress,
      encryptedBackupJson,
      encryptionKey,
    ]
  );

  const value = useMemo(
    () => ({
      backupFile,
      backupKeys,
      balance,
      changeAddress,
      deleteKeys,
      fetchOrdinalUtxosStatus,
      fetchUtxosStatus,
      fundingUtxos,
      generateKeys,
      getOrdinalUTXOs,
      getRawTxById,
      getUTXOs,
      initialized,
      ordAddress,
      ordPk,
      ordUtxos,
      payPk,
      pendingTransaction,
      send: send,
      setBackupFile,
      setFetchOrdinalUtxosStatus,
      setOrdUtxos,
      setPendingTransaction,
      transfer,
      usdRate,
      loadEncryptedKeys,
      passphrase,
      setPassphrase,
      showEnterPassphrase,
      setShowEnterPassphrase,
      mnemonic,
      generateStatus,
      ordAddressPath,
      changeAddressPath,
      encryptedBackupJson,
      setEncryptedBackupJson,
    }),
    [
      backupFile,
      backupKeys,
      balance,
      changeAddress,
      deleteKeys,
      fetchOrdinalUtxosStatus,
      fetchUtxosStatus,
      fundingUtxos,
      generateKeys,
      getOrdinalUTXOs,
      getRawTxById,
      getUTXOs,
      initialized,
      ordAddress,
      ordPk,
      ordUtxos,
      payPk,
      pendingTransaction,
      send,
      setBackupFile,
      setFetchOrdinalUtxosStatus,
      setOrdUtxos,
      setPendingTransaction,
      transfer,
      usdRate,
      loadEncryptedKeys,
      passphrase,
      setPassphrase,
      showEnterPassphrase,
      setShowEnterPassphrase,
      mnemonic,
      generateStatus,
      changeAddressPath,
      ordAddressPath,
      encryptedBackupJson,
      setEncryptedBackupJson,
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
