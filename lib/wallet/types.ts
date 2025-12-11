import type { Transaction } from "@bsv/sdk";

// BRC-100 compliant types
export interface CreateActionResult {
	txid?: string;
	tx?: Transaction;
	rawTx?: string;
	inputBEEF?: string;
	noSendChange?: Array<{
		vout: number;
		satoshis: number;
		lockingScript: string;
	}>;
	sendWithoutChange?: boolean;
	log?: string;
}

export interface SignActionResult {
	txid?: string;
	tx?: Transaction;
	rawTx?: string;
	inputBEEF?: string;
	log?: string;
}

export interface CreateActionOptions {
	description?: string;
	labels?: string[];
	outputs?: Array<{
		satoshis: number;
		script: string;
		description?: string;
	}>;
	inputs?: Array<{
		txid: string;
		vout: number;
		satoshis: number;
		lockingScript: string;
	}>;
	lockTime?: number;
	version?: number;
	sequenceNumber?: number;
	changeAddress?: string;
	feePerKb?: number;
	skipFeeValidation?: boolean;
}

export interface SignActionOptions {
	peerServHost?: string;
	buildDescription?: string;
	signDescription?: string;
}

export interface UTXO {
	txid: string;
	vout: number;
	satoshis: number;
	lockingScript: string;
	spendable: boolean;
	change?: boolean;
	labels?: string[];
	description?: string;
	spentTxid?: string;
	spentAt?: Date;
	createdAt?: Date;
	blockHeight?: number;
}

export interface WalletBalance {
	confirmed: number;
	unconfirmed: number;
	total: number;
}

export interface WalletTransaction {
	txid: string;
	rawTx?: string;
	inputBEEF?: string;
	status: "pending" | "confirmed" | "failed";
	satoshis: number;
	fee?: number;
	blockHeight?: number;
	blockHash?: string;
	timestamp: Date;
	labels?: string[];
	description?: string;
}

export interface WalletOutput {
	txid: string;
	vout: number;
	satoshis: number;
	lockingScript: string;
	spendable: boolean;
	change: boolean;
	labels?: string[];
	description?: string;
	createdAt: Date;
	spentTxid?: string;
	spentAt?: Date;
	data?: any;
	blockHeight?: number;
}

export interface WalletCertificate {
	type: string;
	serialNumber: string;
	certifier: string;
	subject: string;
	fields?: Record<string, string | number | boolean>;
	signature?: string;
	createdAt: Date;
}

export interface ChainInfo {
	height: number;
	hash: string;
	time: number;
}

export interface FeeRate {
	standard: number;
	data: number;
}

export interface WalletConfig {
	network: "mainnet" | "testnet";
	feePerKb?: number;
	dustLimit?: number;
	changeThreshold: number;
	maxUtxosToUse?: number;
	defaultLabels?: string[];
}

export interface WalletState {
	keys: {
		payPk: string;
		ordPk: string;
		identityPk?: string;
	};
	balance: WalletBalance;
	outputs: WalletOutput[];
	transactions: WalletTransaction[];
	certificates: WalletCertificate[];
	lastSync?: Date;
	config: WalletConfig;
}
