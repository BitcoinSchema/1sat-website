import type { MAP } from "js-1sat-ord";
import type { TokenUtxo, Utxo } from "js-1sat-ord";

export type PendingTransaction = {
	rawTx: string;
	size: number;
	fee: number;
	numInputs: number;
	numOutputs: number;
	txid: string;
	spentOutpoints: string[];
  payChange?: Utxo, 
  tokenChange?: TokenUtxo,
	contentType?: string;
	price?: number;
	marketFee?: number;
	iterations?: number;
	metadata?: MAP;
	returnTo?: string;
};
