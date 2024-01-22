import { AssetType } from "@/constants";
import { BSV20Balance } from "@/types/bsv20";
import { Utxo } from "@/types/common";
import { PendingTransaction } from "@/types/preview";
import { signal } from "@preact/signals-react";

export let payPk = signal<string | null>(null);
export let ordPk = signal<string | null>(null);
export let pendingTxs = signal<PendingTransaction[] | null>(null);
export const bsvWasmReady = signal<boolean>(false);
export const utxos = signal<Utxo[] | null>(null);
export const bsv20Balances = signal<BSV20Balance[] | null>(null);
export const walletTab = signal<AssetType>(AssetType.Ordinals);

