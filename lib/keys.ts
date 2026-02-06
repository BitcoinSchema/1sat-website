"use client";

// SECURITY WARNING: This file contains key management logic.
// It should ONLY be imported and used in Client Components ("use client").
// Never handle raw private keys or mnemonics on the server side.

/**
 * Key derivation utilities - re-exported from @1sat/utils
 *
 * All key derivation logic now lives in the SDK to avoid duplication
 */

// Re-export types
export type { WalletKeys as Keys } from "@1sat/utils";
// Re-export derivation path constants
// Re-export key conversion utilities
// Re-export key derivation functions
export {
	AYM_ORD_PATH,
	AYM_WALLET_PATH,
	deriveIdentityKey,
	deriveKeyFromMnemonic as derivePathFromMnemonic,
	findKeysWithVanityOrdinal as findKeysFromMnemonic,
	generateMnemonic,
	getKeysFromMnemonicAndPaths,
	isValidMnemonic,
	RELAYX_ID_PATH,
	RELAYX_ORD_PATH,
	RELAYX_SWEEP_PATH,
	RELAYX_WALLET_PATH,
	TWETCH_ORD_PATH,
	TWETCH_WALLET_PATH,
	wifToAddress,
	wifToHex as wifToRootKeyHex,
	wifToPublicKey,
	YOURS_ID_PATH,
	YOURS_ORD_PATH,
	YOURS_WALLET_PATH,
} from "@1sat/utils";
