export type BridgeEnvelope =
	| BridgeRequestEnvelope
	| BridgeResponseEnvelope
	| LegacyBridgeEnvelope;

export type LegacyBridgeEnvelope = {
	type: "CHECK_READY" | "READY" | "MIGRATE_KEYS" | "ALREADY_LOGGED_IN";
	payload?: unknown;
};

export type BridgeRequestEnvelope = {
	id: string;
	version: "1sat-bridge@1";
	method: BridgeMethod;
	origin?: string;
	intent?: string;
	params?: unknown;
	meta?: Record<string, unknown>;
};

export type BridgeResponseEnvelope = {
	id: string;
	version: "1sat-bridge@1";
	ok: boolean;
	result?: unknown;
	error?: BridgeError;
	meta?: Record<string, unknown>;
};

export type BridgeError = {
	code: BridgeErrorCode;
	message: string;
	details?: Record<string, unknown>;
};

export type BridgeErrorCode =
	| "bridge_error"
	| "unsupported_method"
	| "wallet_locked"
	| "insufficient_funds"
	| "user_rejected"
	| "invalid_request"
	| "broadcast_failed";

export type BridgeMethod =
	| "wallet.status"
	| "wallet.connect"
	| "wallet.signMessage"
	| "wallet.signTx"
	| "wallet.fundTx"
	| "wallet.encrypt"
	| "wallet.decrypt"
	| "wallet.bapAlias";

export type BridgeStatus = {
	locked: boolean;
	hasKeys: boolean;
	network: "main";
	features: BridgeMethod[];
	addresses?: {
		pay?: string | null;
		ord?: string | null;
	};
};

export type FundTxParams = {
	rawtx: string;
	broadcast?: boolean;
	metadata?: Record<string, unknown>;
	intent?: string;
};

export type FundTxResult = {
	rawtx: string;
	txid: string;
	size: number;
	feeSats: number;
	broadcast: boolean;
};

export type BapAliasParams = {
	rawtx: string;
	network?: "main";
	metadata?: {
		bapId?: string;
		profileFields?: string[];
		intent?: string;
	};
	broadcast?: boolean;
};

