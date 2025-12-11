// API Endpoints - use environment variables with fallback to production
export const ORDFS =
	process.env.NEXT_PUBLIC_ORDFS_URL || "https://ordfs.network";
export const API_HOST =
	process.env.NEXT_PUBLIC_API_HOST || "https://ordinals.gorillapool.io";
export const MARKET_API_HOST =
	process.env.NEXT_PUBLIC_MARKET_API_HOST || "https://api.1sat.market";

export enum FetchStatus {
	Idle = "idle",
	Loading = "loading",
	Success = "success",
	Error = "error",
}

export const RESULTS_PER_PAGE = 30;

// Legacy constants for backward compatibility
export const ENCRYPTION_PREFIX = "ENC:";
export const WALLET_STORAGE_KEY = "encryptedBackup";
export const OLD_PAY_PK_KEY = "1satfk";
export const OLD_ORD_PK_KEY = "1satok";

export const PRIVACY_MODE_KEY = "privacy_mode";
export const CURRENCY_KEY = "currency";

export enum Bsv20Status {
	Invalid = -1,
	Pending = 0,
	Valid = 1,
}
