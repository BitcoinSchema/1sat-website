import { addressFromWif } from "@/utils/address";
import { randomKeys } from "@/utils/keys";
import { useLocalStorage } from "@/utils/storage";
import { P2PKHAddress, PrivateKey, PublicKey } from "bsv-wasm-web";
import { Utxo } from "js-1sat-ord";
import { head } from "lodash";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import QRCode from "react-qr-code";
import sb from "satoshi-bitcoin";
import styled from "styled-components";
const Input = styled.input`
  padding: 0.5rem;
  border-radius: 0.25rem;
  margin: 0.5rem 0 0.5rem 0;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
`;

type WalletProps = {
  onKeysGenerated: ({ payPk, ordPk }: { payPk: string; ordPk: string }) => void;
  onInputTxidChange: (inputTxid: string) => void;
  onUtxoChange: (utxo: Utxo) => void;
  payPk: string | undefined;
  ordPk: string | undefined;
  initialized: boolean;
};

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

const Wallet: React.FC<WalletProps> = ({
  onKeysGenerated,
  payPk,
  ordPk,
  onInputTxidChange,
  onUtxoChange,
  initialized,
}) => {
  const [currentTxId, setCurrentTxId] = useLocalStorage<string>("1satctx");

  const [file, setFile] = useState<File>();

  // const [fundingUtxo, setFundingUtxo] = useState<Utxo>();

  const getTxById = async (txid: string): Promise<TxDetails> => {
    const r = await fetch(
      `https://api.whatsonchain.com/v1/bsv/main/tx/${txid}`
    );
    const utxo = (await r.json()) as TxDetails;
    // let utxo = res.find((u: any) => u.value > 1);
    // TODO: How to get script?

    return utxo;
  };

  const getInscriptionUTXO = async (scripthash: string) => {
    const r = await fetch(
      `https://api.whatsonchain.com/v1/bsv/main/scripthash/${scripthash}/unspent`
    );
    const u = await r.json();

    // TODO: How to get script?
    return {
      satoshis: u.value,
      vout: u.tx_pos,
      txid: u.tx_hash,
      // script: Script.from_string(address)
      //   .get_locking_script()
      //   .to_asm_string(),
    };
  };

  const getUTXOs = async (address: string): Promise<Utxo[]> => {
    const r = await fetch(
      `https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent`
    );
    const utxos = await r.json();

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
  };

  const receiverAddress = useMemo(() => {
    console.log({ initialized });
    if (initialized && ordPk) {
      const wif = PrivateKey.from_wif(ordPk);
      const pk = PublicKey.from_private_key(wif);
      return wif && pk && payPk && P2PKHAddress.from_pubkey(pk).to_string();
    }
  }, [initialized, ordPk]);

  const changeAddress = useMemo(() => {
    if (initialized && payPk) {
      return addressFromWif(payPk);
    }
  }, [initialized, payPk]);

  const handleGenerate = async () => {
    console.log("callback");
    onKeysGenerated(randomKeys());
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
      // TODO: fetch the tx
      // populate the utxo

      let outPoint: OutPoint = {
        txid,
        vout: 0,
      };
      let found: boolean = false;
      // figute out the vout
      for (let out of txDetails.vout) {
        if (
          changeAddress &&
          out.scriptPubKey.addresses.includes(changeAddress)
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

  const handleFileChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const jsonString = await e.target.files[0].text();
        console.log({ jsonString });
        if (jsonString) {
          onKeysGenerated(JSON.parse(jsonString));
          setFile(e.target.files[0]);
        }
      }
    },
    []
  );

  const handleUploadClick = useCallback(() => {
    if (!file) {
      const el = document.getElementById("backupFile");
      el?.click();
      return;
    }

    // file.type
    // file.size
    console.log({ file });
  }, []);

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto">
      {(!ordPk || !payPk) && (
        <>
          <div className="w-full">
            <p>Import a wallet from existing backup</p>
            <button
              type="submit"
              onClick={handleUploadClick}
              className="w-full bg-teal-600 text-xl rounded my-4 text-white"
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
              className="w-full bg-yellow-600 text-xl rounded my-4 text-white"
            >
              Generate Wallets
            </button>
          </div>
        </>
      )}
      {changeAddress && receiverAddress && (
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
          <button
            className="p-2 bg-[#222] cursor-pointer rounded my-4"
            onClick={() => {
              if (currentTxId) {
                done(currentTxId);
              }
            }}
          >
            Done
          </button>
          <button
            className="ml-2 cursor-pointer p-2 bg-[#222] rounded my-4"
            onClick={async () => {
              if (currentTxId) {
                const utxos = await getUTXOs(changeAddress);

                const utxo = head(utxos);

                if (utxo) {
                  onUtxoChange(utxo);
                  toast(`Found ${utxos.length} UTXOs`);
                } else {
                  toast(`Found ${0} UTXOs`);
                }
              }
            }}
          >
            Fetch Outputs
          </button>
        </div>
      )}
      <input
        accept=".json"
        className="hidden"
        id="backupFile"
        onChange={handleFileChange}
        type="file"
      />
    </div>
  );
};

export default Wallet;
