export type GPFile = {
	hash: string;
	size: number;
	type: string;
};

export interface Inscription {
	json?: unknown;
	text?: string;
	words?: string[];
	file: GPFile;
}

export type BaseTxo = {
	txid: string;
	vout: number;
	height: number;
	idx: number;
	satoshis: number;
};

export interface TxoData extends BaseTxo {
	types?: string[];
	insc?: Inscription;
	map?: { [key: string]: unknown };
	list?: {
		price: number;
		payout: string;
	};
}

export type Origin = {
	data?: TxoData;
	num?: string;
	outpoint: string;
	map?: { [key: string]: unknown };
	inum?: number;
};

export interface OrdUtxo {
	txid: string;
	vout: number;
	outpoint: string;
	satoshis: number;
	script: string;
	origin?: Origin;
	height: number;
	idx: number;
	data?: TxoData;
}
