import { API_HOST, OrdUtxo } from "@/context/ordinals";
import {
  P2PKHAddress,
  PrivateKey,
  Script,
  SigHash,
  Transaction,
  TxIn,
  TxOut,
} from "bsv-wasm-web";
import { Utxo } from "js-1sat-ord";
import { customFetch } from "./httpClient";

export const signPayment = (
  tx: Transaction,
  paymentPK: PrivateKey,
  inputIdx: number,
  paymentUtxo: Utxo,
  utxoIn: TxIn
) => {
  const sig2 = tx.sign(
    paymentPK,
    SigHash.ALL | SigHash.FORKID,
    inputIdx,
    Script.from_asm_string(paymentUtxo.script),
    BigInt(paymentUtxo.satoshis)
  );
  utxoIn.set_unlocking_script(
    Script.from_asm_string(
      `${sig2.to_hex()} ${paymentPK.to_public_key().to_hex()}`
    )
  );
  return utxoIn;
};

export const createChangeOutput = (
  tx: Transaction,
  changeAddress: string,
  paymentSatoshis: number
) => {
  const changeaddr = P2PKHAddress.from_string(changeAddress);
  const changeScript = changeaddr.get_locking_script();
  const emptyOut = new TxOut(BigInt(1), changeScript);
  const fee = Math.ceil(
    SAT_FEE_PER_BYTE * (tx.get_size() + emptyOut.to_bytes().byteLength)
  );
  const change = paymentSatoshis - fee;
  const changeOut = new TxOut(BigInt(change), changeScript);
  return changeOut;
};

export const fetchOrdinal = async (outpoint: string) => {
  const { promise } = customFetch<OrdUtxo>(
    `${API_HOST}/api/inscriptions/${outpoint}/latest`
  );
  return await promise;
};

export const SAT_FEE_PER_BYTE = 0.065;
