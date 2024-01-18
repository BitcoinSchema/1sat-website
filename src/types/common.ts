export type BaseTxo = {
  txid?: string;
  vout?: 0;
  height?: 792954;
  idx?: 23726;
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