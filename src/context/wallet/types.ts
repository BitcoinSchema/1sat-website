export type ScriptSig = {
  asm: string;
  hex: string;
};

export type VIn = {
  coinbase: string;
  txid: string;
  vout: number;
  scriptSig: ScriptSig;
  sequence: number;
};

export type ScriptPubKey = {
  asm: string;
  hex: string;
  reqSigs: number;
  type: string;
  addresses: string[];
  isTruncated: boolean;
};

export type VOut = {
  value: 6.27138654;
  n: 0;
  scriptPubKey: ScriptPubKey;
};

export type TxDetails = {
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

export type PendingTransaction = {
  rawTx: string;
  size: number;
  fee: number;
  numInputs: number;
  numOutputs: number;
  txid: string;
};

export interface EncryptedBackupJson {
  encryptedBackup?: string;
  pubKey?: string;
  fundingChildKey: number;
  ordChildKey: number;
}

export interface DecryptedBackupJson {
  ordPk?: string;
  payPk?: string;
}

export enum EncryptDecrypt {
  Encrypt,
  Decrypt,
}
