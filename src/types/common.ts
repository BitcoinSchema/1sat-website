export type BaseTxo = {
  txid: string;
  vout: number;
  height: number;
  idx: number;
};

export type GPFile = {
  hash: string;
  size: number;
  type: string;
};

export type Utxo = {
  satoshis: number;
  txid: string;
  vout: number;
  script: string;
};

export type WocUtxo = {
  height: number;
  tx_hash: string;
  tx_pos: number;
  value: number;
};