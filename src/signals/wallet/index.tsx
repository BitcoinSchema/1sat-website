import { InscriptionTab } from "@/components/pages/inscribe/tabs";
import { AssetType } from "@/constants";
import { BSV20Balance } from "@/types/bsv20";
import { ChainInfo, IndexerStats, Utxo } from "@/types/common";
import { OrdUtxo } from "@/types/ordinals";
import { PendingTransaction } from "@/types/preview";
import { signal } from "@preact/signals-react";

export type InscribeOptions ={
  tab: InscriptionTab;
  tick: string;
  op: string;
};

export const payPk = signal<string | null>(null);
export const ordPk = signal<string | null>(null);
export const pendingTxs = signal<PendingTransaction[] | null>(null);
export const bsvWasmReady = signal<boolean>(false);
export const utxos = signal<Utxo[] | null>(null);
export const ordUtxos = signal<OrdUtxo[] | null>(null);
export const bsv20Utxos = signal<OrdUtxo[] | null>(null);
export const bsv20Balances = signal<BSV20Balance[] | null>(null);
export const walletTab = signal<AssetType>(AssetType.Ordinals);
export const usdRate = signal<number>(0);
export const indexers = signal<IndexerStats | null>(null);
export const chainInfo = signal<ChainInfo | null>(null);
export const inscribeOptions = signal<InscribeOptions | null>(null);

export const showDepositModal = signal<boolean>(false);
