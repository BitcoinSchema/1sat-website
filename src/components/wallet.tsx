import { FetchStatus } from "@/pages";
import { addressFromWif } from "@/utils/address";
import { randomKeys } from "@/utils/keys";
import { useLocalStorage } from "@/utils/storage";

import init, {
  P2PKHAddress,
  PrivateKey,
  PublicKey,
  Transaction,
} from "bsv-wasm-web";
import { Inscription, Utxo } from "js-1sat-ord";
import { head } from "lodash";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import QRCode from "react-qr-code";
import sb from "satoshi-bitcoin";
import styled from "styled-components";

export const PROTOCOL_START_HEIGHT = 783968;

const Input = styled.input`
  padding: 0.5rem;
  border-radius: 0.25rem;
  margin: 0.5rem 0 0.5rem 0;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
`;

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

type WalletProps = {
  onKeysGenerated: ({ payPk, ordPk }: { payPk: string; ordPk: string }) => void;
  onInputTxidChange: (inputTxid: string) => void;
  onUtxoChange: (utxo: Utxo) => void;
  onFileChange: (utxo: Utxo) => void;
  onArtifactsChange: ({
    artifacts,
    inscribedUtxos,
  }: {
    artifacts: Inscription[];
    inscribedUtxos: Utxo[];
  }) => void;
  payPk: string | undefined;
  ordPk: string | undefined;
  fundingUtxo: Utxo | undefined;
  file: File | undefined;
};

const Wallet: React.FC<WalletProps> = ({
  onKeysGenerated,
  payPk,
  ordPk,
  onInputTxidChange,
  onUtxoChange,
  onArtifactsChange,
  fundingUtxo,
  file,
  onFileChange,
}) => {
  const [artifacts, setArtifacts] = useState<Inscription[]>();
  const [currentTxId, setCurrentTxId] = useLocalStorage<string>("1satctx");
  const [inscriptionUtxos, setInscriptionUtxos] =
    useLocalStorage<Utxo[]>("1satiut");
  const [inscriptions, setInscriptions] =
    useLocalStorage<Inscription[]>("1satins");
  const [showKeys, setShowKeys] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);
  const [fetchUtxosStatus, setFetchUtxosStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );
  const [fetchOrdinalUtxosStatus, setFetchOrdinalUtxosStatus] =
    useState<FetchStatus>(FetchStatus.Idle);
  const [fetchHistoryStatus, setFetchHistoryStatus] = useState<FetchStatus>(
    FetchStatus.Idle
  );

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

  const getUTXOs = async (address: string): Promise<Utxo[]> => {
    setFetchUtxosStatus(FetchStatus.Loading);
    try {
      const r = await fetch(
        `https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent`
      );
      const utxos = await r.json();

      setFetchUtxosStatus(FetchStatus.Success);
      return utxos.map((utxo: any) => {
        return {
          satoshis: utxo.value,
          vout: utxo.tx_pos,
          txid: utxo.tx_hash,
          script: P2PKHAddress.from_string(address)
            .get_locking_script()
            .to_asm_string(),
        } as Utxo;
      });
    } catch (e) {
      setFetchUtxosStatus(FetchStatus.Error);
      throw e;
    }
  };
  type HistoryItem = {
    tx_hash: string;
    height: number;
  };

  const getArtifacts = async (
    address: string
  ): Promise<{ artifacts: Inscription[]; inscribedUtxos: Utxo[] }> => {
    setFetchHistoryStatus(FetchStatus.Loading);
    try {
      const r = await fetch(
        `https://api.whatsonchain.com/v1/bsv/main/address/${address}/history`
      );
      const history: HistoryItem[] = await r.json();

      let iUtxos: Utxo[] = [];
      let artifacts: Inscription[] = [];
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
      setFetchHistoryStatus(FetchStatus.Success);
      setInscriptionUtxos(iUtxos);
      return { artifacts, inscribedUtxos: iUtxos };
      // return history.map((utxo: any) => {
      //   return {
      //     satoshis: utxo.value,
      //     vout: utxo.tx_pos,
      //     txid: utxo.tx_hash,
      //     script: P2PKHAddress.from_string(address)
      //       .get_locking_script()
      //       .to_asm_string(),
      //   } as Utxo;
      // });
    } catch (e) {
      setFetchHistoryStatus(FetchStatus.Error);
      throw e;
    }
  };

  useEffect(() => {
    const fire = async () => {
      await init();
      setInitialized(true);
    };
    if (!initialized) {
      fire();
    }
  }, [initialized, setInitialized]);

  const receiverAddress = useMemo(() => {
    console.log({ initialized });
    if (initialized && ordPk) {
      const wif = PrivateKey.from_wif(ordPk);
      const pk = PublicKey.from_private_key(wif);
      return wif && pk && P2PKHAddress.from_pubkey(pk).to_string();
    }
  }, [initialized, ordPk]);

  const changeAddress = useMemo(() => {
    if (initialized && payPk) {
      return addressFromWif(payPk);
    }
  }, [initialized, payPk]);

  const handleConfirm = async () => {
    console.log("callback confirm");
    setShowKeys(false);
  };

  const handleGenerate = async () => {
    console.log("callback");
    onKeysGenerated(randomKeys());

    setShowKeys(true);
  };

  const readFileAsBase64 = (file: any) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = (reader?.result as string).split(",")[1];
        resolve(result);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const done = useCallback(
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
      onUtxoChange({
        txid: outPoint.txid,
        satoshis: sb.toSatoshi(txDetails.vout[outPoint.vout].value),
        vout: outPoint.vout,
        script: txDetails.vout[outPoint.vout].scriptPubKey.asm,
      });
    },
    [onUtxoChange, changeAddress]
  );

  useEffect(() => {
    const fire2 = async (a: string) => {
      const { artifacts, inscribedUtxos } = await getArtifacts(a);
      // const ordinalUtxos = await getOrdinalUTXOs(a);
      setArtifacts(artifacts);
      console.log({ artifacts });
      toast(`Got ${artifacts.length} artifacts`);
      onArtifactsChange({ artifacts, inscribedUtxos });
    };
    if (changeAddress && fetchHistoryStatus === FetchStatus.Idle) {
      fire2(changeAddress);
    }
  }, [fetchHistoryStatus, setArtifacts, changeAddress]);

  useEffect(() => {
    const fire = async (a: string) => {
      const utxos = await getUTXOs(a);
      const utxo = head(
        utxos.sort((a, b) => (a.satoshis > b.satoshis ? -1 : 1))
      );
      if (utxo) {
        onUtxoChange(utxo);
        setCurrentTxId(utxo.txid);
        toast(`Found ${utxos.length} UTXOs`);
      } else {
        toast(`Found ${0} UTXOs`);
      }
    };

    if (changeAddress && fetchUtxosStatus === FetchStatus.Idle) {
      fire(changeAddress);
    }
  }, [fetchUtxosStatus, setCurrentTxId, onUtxoChange, changeAddress]);

  const handleUploadClick = useCallback(() => {
    if (!file) {
      const el = document.getElementById("backupFile");
      el?.click();
      return;
    }
    console.log({ file });
  }, [file]);

  if (fetchUtxosStatus === FetchStatus.Loading) {
    return <div className="flex flex-col w-full max-w-4xl mx-auto"></div>;
  }

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto">
      {(!ordPk || !payPk) && (
        <>
          <div className="w-full">
            <p>Import a wallet from existing backup</p>
            <button
              type="submit"
              onClick={handleUploadClick}
              className="w-full cursor-pointer p-2 bg-teal-600 text-xl rounded my-4 text-white"
            >
              Import Wallets
            </button>
          </div>
          <div className="w-full">
            <p>
              This will generate 2 local wallets. 1 for sats, and 1 for
              ordinals.
            </p>
            <button
              type="submit"
              onClick={handleGenerate}
              className="w-full cursor-pointer p-2 bg-yellow-600 text-xl rounded my-4 text-white"
            >
              Generate Wallets
            </button>
          </div>
        </>
      )}
      {showKeys && (
        <div>
          <div className="w-full">
            <p>These are your keys. Keep them safe.</p>
            <pre>{payPk}</pre>
            <pre>{ordPk}</pre>
            <button
              type="submit"
              onClick={handleConfirm}
              className="w-full p-1 bg-yellow-600 text-xl cursor-pointer rounded my-4 text-white"
            >
              I Backed Them Up
            </button>
          </div>
        </div>
      )}
      {!showKeys && changeAddress && receiverAddress && (
        <div className="w-full max-w-md">
          <div className="text-center">
            <h1 className="text-2xl text-white">Funding Wallet</h1>
          </div>
          <div className="bg-[#222] rounded p-2 w-full mt-4">
            Please make a deposit to the funding address. You can refund your
            balance when you are done.
          </div>
          <div className="flex items-center justify-center my-8">
            <QRCode value={changeAddress || ""} size={420} />
          </div>
          <div className="my-4">
            <div className="flex justify-between">
              <div>Funding Address:</div>
              <div>{changeAddress}</div>
            </div>
            <div className="flex justify-between">
              <div>Ordinal Address:</div>
              <div>{receiverAddress}</div>
            </div>
          </div>

          <div className="mt-4">
            <Label>
              Deposit TxID
              <Input
                type="text"
                className="w-full"
                value={currentTxId}
                onChange={(e) => {
                  setCurrentTxId(e.target.value);
                  onInputTxidChange(e.target.value);
                }}
              />
            </Label>
          </div>
          <div className="flex items-center justify-between">
            <button
              className="p-2 bg-[#222] cursor-pointer rounded my-4"
              onClick={() => {
                if (currentTxId) {
                  done(currentTxId);
                }
              }}
            >
              Fetch By TxID
            </button>
            {fundingUtxo && (
              <button
                className="p-2 bg-[#222] cursor-pointer rounded m-4"
                onClick={() => {
                  onUtxoChange(fundingUtxo);
                }}
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
