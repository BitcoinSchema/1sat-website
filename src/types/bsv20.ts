import { Bsv20Status } from "@/constants";
import { OrdUtxo } from "./ordinals";

export interface BSV20 extends OrdUtxo {
  max?: string;
  lim?: string;
  dec?: number;
  supply?: string;
  available?: string;
  pct_minted?: string;
  reason?: null;
  pending?: string;
  id?: string;
  p: string;
  op: string;
  tick?: string;
  amt: string;
  status?: Bsv20Status;
}

export interface Ticker extends BSV20 {
  included: boolean;
  fundAddress: string;
  fundBalance: string;
  fundTotal: string;
  fundUsed: string;
  pendingOps: number;
}
export interface Listing extends BSV20 {
  price: string;
  pricePer: string;
  owner: string;
  sale: boolean;
  payout: string; // base64 encoded
  script: string; // base64 encoded
  spend: string;
  spendIdx: string;
  spendHeight: string;
}


type BSV20Counts = {
  confirmed: number;
  pending: number;
};

export type BSV20Balance = {
  tick?: string;
  id?: string;
  all: BSV20Counts;
  listed: BSV20Counts;
  dec: number;
  sym?: string;
  icon?: string;
};