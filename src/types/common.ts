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

export interface IndexerStats {
  "bsv20-deploy": number,
  bsv20: number,
  "market-spends": number,
  locks: number,
  opns: number,
  market: number,
  ord: number
}

export type ChainInfo = {
  chain: string;
  blocks: number;
  headers: number;
  bestblockhash: string;
  difficulty: number;
  mediantime: number;
  verificationprogress: number;
  pruned: boolean;
  chainwork: string;
};

export enum OutpointTab {
  Timeline = "timeline",
  Inscription = "inscription",
  Token = "token",
  Listing = "listing",
  Collection = "collection",
  Owner = "owner"
}