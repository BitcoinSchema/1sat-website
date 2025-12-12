import type { TxoData } from "./ordinals";

export interface TradeUtxoRef {
	txid: string;
	vout: number;
	satoshis: number;
}

export interface TradeItem {
	id: string;
	name: string;
	type: "ordinal" | "bsv20" | "satoshis" | "bsv21";
	amount?: string;
	image: string;
	data?: TxoData;
	utxo?: TradeUtxoRef;
}
