import type { InscriptionTab } from "@/components/pages/inscribe/tabs";
import { AssetType, SortBy } from "@/constants";
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

export enum CurrencyDisplay {
  BSV = "BSV",
  USD = "USD",
};

/**
 * Create wallet
 */

export const isCreatingWallet = signal<boolean>(false);
export const createWalletIterations = signal<number>(0);
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
export const migrating = signal<boolean>(false);
/**
 * Unlock Wallet
 */
export const showUnlockWalletModal = signal<boolean>(false);
export const showUnlockWalletButton = signal<boolean>(false);


/**
 * Wallet keys
 */
export const mnemonic = signal<string | null>(null);
export const changeAddressPath = signal<number | string | null>(null);
export const ordAddressPath = signal<number | string | null>(null);
export const payPk = signal<string | null>(null);
export const ordPk = signal<string | null>(null);
export const identityPk = signal<string | null>(null);
export const identityAddressPath = signal<number | string | null>(null);

/**
 * Wallet state
 */
export const pendingTxs = signal<PendingTransaction[] | null>(null);
export const utxos = signal<Utxo[] | null>(null);
export const ordUtxos = signal<OrdUtxo[] | null>(null);
export const bsv20Utxos = signal<OrdUtxo[] | null>(null);
export const bsv20Balances = signal<BSV20Balance[] | null>(null);
export const walletTab = signal<AssetType>(AssetType.Ordinals);
export const usdRate = signal<number>(0);
export const currencyDisplay = signal<string>(CurrencyDisplay.BSV);
export const exchangeRate = signal<number>(0);
export const indexers = signal<IndexerStats | null>(null);
export const chainInfo = signal<ChainInfo | null>(null);
export const inscribeOptions = signal<InscribeOptions | null>(null);

export const showDepositModal = signal<boolean>(false);
/**
 * Import Wallet
 */
export enum ImportWalletTab {
  FromBackupJson = 0,
  FromMnemonic = 1,
  FromFragment = 2,
}

export enum ImportWalletFromBackupJsonStep {
  SelectFile = 0,
  EnterPassphrase = 1,
  Done = 2,
}

export enum ImportWalletFromMnemonicStep {
  EnterMnemonic = 0,
  GenerateWallet = 1,
  EnterPassphrase = 2,
  Done = 3,
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
  Info = 0,
  EnterPassphrase = 1,
  Done = 2,
}

export const protectKeysStep = signal<ProtectKeysStep>(ProtectKeysStep.Info);
export const hasUnprotectedKeys = signal<boolean>(false);
