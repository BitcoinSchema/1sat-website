import type { InscriptionTab } from "@/components/pages/inscribe/tabs";
import { AssetType } from "@/constants";
import type { BSV20Balance } from "@/types/bsv20";
import type { ChainInfo, IndexerStats, Utxo } from "@/types/common";
import type { OrdUtxo } from "@/types/ordinals";
import type { PendingTransaction } from "@/types/preview";
import { CreateWalletStep } from "@/types/wallet";
import { signal } from "@preact/signals-react";

export type InscribeOptions = {
	tab: InscriptionTab;
	tick: string;
	op: string;
};

/**
 * Create wallet
 */

export const isCreatingWallet = signal<boolean>(false);
export const createWalletStep = signal<CreateWalletStep>(
	CreateWalletStep.Create
);

/**
 * Wallet password
 */
export const showEnterPassphrase = signal<string | null>(null);
export const encryptedBackup = signal<string | null>(null);
export const encryptionKey = signal<Uint8Array | null>(null);
export const passphrase = signal<string | null>("");

/**
 * Unlock Wallet
 */
export const showUnlockWalletModal = signal<boolean>(false);

/**
 * Wallet keys
 */
export const mnemonic = signal<string | null>(null);
export const changeAddressPath = signal<number | null>(null);
export const ordAddressPath = signal<number | null>(null);
export const payPk = signal<string | null>(null);
export const ordPk = signal<string | null>(null);

/**
 * Wallet state
 */
export const pendingTxs = signal<PendingTransaction[] | null>(null);
export const bsvWasmReady = signal<boolean>(false);
export const utxos = signal<Utxo[] | null>(null);
export const ordUtxos = signal<OrdUtxo[] | null>(null);
export const bsv20Utxos = signal<OrdUtxo[] | null>(null);
export const bsv20Balances = signal<BSV20Balance[] | null>(null);
export const walletTab = signal<AssetType>(AssetType.Ordinals);
export const usdRate = signal<number>(0);
export const exchangeRate = signal<number>(0);
export const indexers = signal<IndexerStats | null>(null);
export const chainInfo = signal<ChainInfo | null>(null);
export const inscribeOptions = signal<InscribeOptions | null>(null);

export const showDepositModal = signal<boolean>(false);

/**
 * Import Wallet
 */
export enum ImportWalletTab {
	FromBackupJson,
	FromMnemonic,
}

export enum ImportWalletFromBackupJsonStep {
	SelectFile,
	EnterPassphrase,
	Done,
}

export enum ImportWalletFromMnemonicStep {
	EnterMnemonic,
	GenerateWallet,
	EnterPassphrase,
	Done,
}

export const importWalletTab = signal<ImportWalletTab | null>(null);
export const importWalletFromBackupJsonStep =
	signal<ImportWalletFromBackupJsonStep>(
		ImportWalletFromBackupJsonStep.SelectFile
	);
export const importWalletFromMnemonicStep =
	signal<ImportWalletFromMnemonicStep>(
		ImportWalletFromMnemonicStep.EnterMnemonic
	);

export const selectedBackupJson = signal<string | null>(null);

/**
 * Protect keys
 */
export enum ProtectKeysStep {
	Info,
	EnterPassphrase,
	Done,
}

export const protectKeysStep = signal<ProtectKeysStep>(ProtectKeysStep.Info);
export const hasUnprotectedKeys = signal<boolean>(false);
