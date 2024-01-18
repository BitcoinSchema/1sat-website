
export type PendingTransaction = {
  rawTx: string;
  size: number;
  fee: number;
  numInputs: number;
  numOutputs: number;
  txid: string;
  inputTxid: string;
  contentType?: string;
  price?: number;
  marketFee?: number;
  iterations?: number;
  metadata?: any; // MAP;
};