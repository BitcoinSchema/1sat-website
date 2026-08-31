export enum FetchStatus {
	Idle = "idle",
	Loading = "loading",
	Success = "success",
	Error = "error",
}

// Legacy constants for backward compatibility
export const ENCRYPTION_PREFIX = "ENC:";
export const WALLET_STORAGE_KEY = "encryptedBackup";
export const OLD_PAY_PK_KEY = "1satfk";
export const OLD_ORD_PK_KEY = "1satok";
export const OLD_IDENTITY_PK_KEY = "1satik";

export const PRIVACY_MODE_KEY = "privacy_mode";
export const CURRENCY_KEY = "currency";
