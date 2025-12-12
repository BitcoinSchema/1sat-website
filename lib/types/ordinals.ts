import type { JsonObject, JsonValue } from "./json";

export type GPFile = {
	hash: string;
	size: number;
	type: string;
	content?: number[];
};

export interface Inscription {
	json?: JsonValue;
	text?: string;
	words?: string[];
	num?: number;
	inum?: number;
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
	map?: JsonObject;
	bsv20?: Bsv20TokenData;
	bsv21?: Bsv21TokenData;
	list?: {
		price: number;
		payout: string;
	};
}

export type Origin = {
	outpoint: string;
	nonce?: number;
	insc?: Inscription;
	data?: TxoData;
	num?: string;
	map?: JsonObject;
	sigma?: JsonValue[];
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

export interface WalletOrdinal extends OrdUtxo {
	owner: string;
}

export interface Bsv20TokenData {
	tick?: string;
	sym?: string;
	amt?: string;
	dec?: number;
	id?: string;
	data?: Bsv20TokenData;
}

export interface Bsv21TokenData {
	tick?: string;
	sym?: string;
	amt?: string;
	dec?: number;
	id?: string;
	data?: Bsv21TokenData;
}
