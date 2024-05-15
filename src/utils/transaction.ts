import { API_HOST } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import { customFetch } from "@/utils/httpClient";
import { Utxo } from "@/utils/js-1sat-ord";
import {
  P2PKHAddress,
  PrivateKey,
  Script,
  SigHash,
  Transaction,
  TxIn,
  TxOut,
} from "bsv-wasm-web";

export const signPayment = (
  tx: Transaction,
  paymentPK: PrivateKey,
  inputIdx: number,
  paymentUtxo: Utxo,
  utxoIn: TxIn
) => {
  const sig2 = tx.sign(
    paymentPK,
    SigHash.NONE | SigHash.ANYONECANPAY | SigHash.FORKID,
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

  // get total satoshis out
  const outs = tx.get_noutputs();
  let totalSatoshisOut = 0n;
  for (let i = 0; i < outs; i++) {
    const out = tx.get_output(i);
    totalSatoshisOut += out?.get_satoshis() || BigInt(0);
  }
  const changeaddr = P2PKHAddress.from_string(changeAddress);
  const changeScript = changeaddr.get_locking_script();
  const emptyOut = new TxOut(BigInt(1), changeScript);
  const fee = Math.ceil(
    SAT_FEE_PER_BYTE * (tx.get_size() + emptyOut.to_bytes().byteLength)
  );
  const change = BigInt(paymentSatoshis) - totalSatoshisOut - BigInt(fee);
  const changeOut = new TxOut(change, changeScript);
  return changeOut;
};

export const fetchOrdinal = async (outpoint: string) => {
  const { promise } = customFetch<OrdUtxo>(
    `${API_HOST}/api/inscriptions/${outpoint}?script=true`
  );
  return await promise;
};

export const SAT_FEE_PER_BYTE = 0.065;
