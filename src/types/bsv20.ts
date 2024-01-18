import { Bsv20Status } from "@/constants";
import { BaseTxo } from "./common";

export interface BSV20 extends BaseTxo {
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
  accounts: number;
  included: boolean;
  fundAddress: string;
  fundBalance: string;
  fundTotal: string;
  fundUsed: string;
  pendingOps: string;
}

