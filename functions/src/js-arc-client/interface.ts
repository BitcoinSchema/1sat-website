export interface Client {
  serverUrl: string;
  apiKey?: string;
  bearer?: string;
  authorization?: string;
  debug?: boolean;
}

export interface ClientOptions {
  apiKey?: string;
  bearer?: string;
  authorization?: string;
  version?: string;
  debug?: boolean;
}

export enum TxStatus {
  ANNOUNCED_TO_NETWORK = "ANNOUNCED_TO_NETWORK",
  CONFIRMED = "CONFIRMED",
  MINED = "MINED",
  RECEIVED = "RECEIVED",
  REJECTED = "REJECTED",
  SEEN_ON_NETWORK = "SEEN_ON_NETWORK",
  SENT_TO_NETWORK = "SENT_TO_NETWORK",
  STORED = "STORED",
  UNKNOWN = "UNKNOWN",
}

export interface TransactionStatus {
  blockHash?: string;
  blockHeight?: number;
  timestamp: string;
  txStatus?: TxStatus;
  status: number;
  txid: string;
}

export interface TransactionError {
  detail: string;
  extraInfo?: string;
  instance?: string;
  status: number;
  title: string;
  txid?: string;
  type: string;
}

export enum FeeFeeType {
  FeeTypeStandard = "standard",
  FeeTypeData = "data",
}

export interface FeeAmount {
  bytes: number;
  satoshis: number;
}

export interface Fee {
  feeType: FeeFeeType;
  miningFee: FeeAmount;
  relayFee: FeeAmount;
}

export interface Policy {
  policy: any;
  timestamp: string;
}

export interface HTTPOptions {
  method?: string;
  body?: string | Buffer;
  headers?: {
    "Accept"?: string;
    "Content-Type"?: string;
    "X-API-KEY"?: string;
    Authorization?: string;
  };
}
