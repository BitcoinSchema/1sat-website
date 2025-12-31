"use client";

/**
 * Wallet Toolbox Provider
 *
 * This provider integrates @1sat/wallet-toolbox for BRC-100 compliant wallet operations
 * with 1Sat-specific indexing, sync, and ordinal support.
 *
 * Key components:
 * - OneSatWallet: Extended wallet with 1Sat indexers and sync
 * - Wallet + WalletStorageManager: Base BRC-100 wallet from @bsv/wallet-toolbox
 * - IndexedDbSyncQueue: Browser-based sync queue for background processing
 */

import { PrivateKey, KeyDeriver } from "@bsv/sdk";
// Use client-specific imports to avoid server-side dependencies (knex, express, etc.)
import {
	Wallet,
	StorageIdb,
	WalletStorageManager,
	type sdk,
} from "@bsv/wallet-toolbox/out/src/index.client";
import {
	OneSatWallet,
	IndexedDbSyncQueue,
	type OneSatWalletEvents,
} from "@1sat/wallet-toolbox";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import type { Ordinal } from "@/lib/wallet/gorillapool-service";
import { GorillaPoolService } from "@/lib/wallet/gorillapool-service";

type Chain = sdk.Chain;

interface WalletBalance {
	confirmed: number;
	unconfirmed: number;
	total: number;
}

// Sync status for real-time UI updates
interface SyncStatus {
	isSyncing: boolean;
	progress: { pending: number; done: number; failed: number } | null;
	lastSync: Date | null;
	error: string | null;
}

interface WalletToolboxContextValue {
	// Wallet state
	wallet: OneSatWallet | null;
	isInitialized: boolean;
	isInitializing: boolean;
	initError: string | null;
	chain: Chain;
	identityKey: string | null;

	// Sync state
	syncStatus: SyncStatus;
	syncWallet: () => Promise<void>;

	// Balance and assets
	balance: WalletBalance | null;
	ordinals: Ordinal[];
	bsv20Tokens: TokenBalance[];
	bsv21Tokens: TokenBalance[];

	// Actions
	initializeWallet: (
		rootKeyHex: string,
		ordAddress?: string,
		payAddress?: string,
	) => Promise<boolean>;
	destroyWallet: () => Promise<void>;
	refreshBalance: () => Promise<void>;
}

// Token balance interface
interface TokenBalance {
	outpoint: string;
	txid: string;
	vout: number;
	data?: TxoData;
	height?: number;
}

const WalletToolboxContext = createContext<
	WalletToolboxContextValue | undefined
>(undefined);

// Helper to generate random hex string for storage migration
function randomBytesHex(length: number): string {
	const bytes = new Uint8Array(length);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

interface WalletToolboxProviderProps {
	children: ReactNode;
	chain?: Chain;
	databaseName?: string;
	// Optional: auto-initialize with these keys
	autoInitRootKeyHex?: string;
	autoInitOrdAddress?: string;
	autoInitPayAddress?: string;
}

export function WalletToolboxProvider({
	children,
	chain = "main",
	databaseName = "1sat-wallet",
	autoInitRootKeyHex,
	autoInitOrdAddress,
	autoInitPayAddress,
}: WalletToolboxProviderProps) {
	// Core wallet state
	const [wallet, setWallet] = useState<OneSatWallet | null>(null);
	const [identityKey, setIdentityKey] = useState<string | null>(null);

	// UI state
	const [isInitialized, setIsInitialized] = useState(false);
	const [isInitializing, setIsInitializing] = useState(false);
	const [initError, setInitError] = useState<string | null>(null);

	// Sync state
	const [syncStatus, setSyncStatus] = useState<SyncStatus>({
		isSyncing: false,
		progress: null,
		lastSync: null,
		error: null,
	});

	// Balance state
	const [balance, setBalance] = useState<WalletBalance | null>(null);
	const [ordinals, setOrdinals] = useState<Ordinal[]>([]);
	const [bsv20Tokens, setBsv20Tokens] = useState<TokenBalance[]>([]);
	const [bsv21Tokens, setBsv21Tokens] = useState<TokenBalance[]>([]);

	// Store wallet addresses for ordinal and balance lookups
	const [ordAddress, setOrdAddress] = useState<string | null>(null);
	const [payAddress, setPayAddress] = useState<string | null>(null);

	// GorillaPool service for ordinal lookups
	const gorillaPoolRef = useRef(new GorillaPoolService());

	/**
	 * Initialize the wallet with a root key
	 *
	 * Creates OneSatWallet with 1Sat-specific indexers and sync capabilities
	 */
	const initializeWallet = useCallback(
		async (
			rootKeyHex: string,
			ordAddressParam?: string,
			payAddressParam?: string,
		): Promise<boolean> => {
			if (isInitializing || isInitialized) {
				console.warn("[WalletToolbox] Already initializing or initialized");
				return false;
			}

			setIsInitializing(true);
			console.log("[WalletToolbox] Starting wallet initialization...");

			try {
				// 1. Derive identity key from root key
				const rootKey = PrivateKey.fromHex(rootKeyHex);
				const newIdentityKey = rootKey.toPublicKey().toString();

				// 2. Create IndexedDB storage from @bsv/wallet-toolbox
				const storage = new StorageIdb({
					chain,
					commissionSatoshis: 0,
					commissionPubKeyHex: undefined,
					feeModel: { model: "sat/kb", value: 1 },
				});
				await storage.migrate(databaseName, randomBytesHex(33));
				await storage.makeAvailable();

				// 3. Create WalletStorageManager with the storage
				const storageManager = new WalletStorageManager(newIdentityKey, storage);
				await storageManager.makeAvailable();

				// 4. Create key deriver and base Wallet from @bsv/wallet-toolbox
				const keyDeriver = new KeyDeriver(rootKey);
				const baseWallet = new Wallet({
					chain,
					keyDeriver,
					storage: storageManager,
				});

				// 5. Build owner addresses set
				const owners = new Set<string>();
				if (ordAddressParam) owners.add(ordAddressParam);
				if (payAddressParam && payAddressParam !== ordAddressParam) {
					owners.add(payAddressParam);
				}

				// 6. Create sync queue for background processing
				const syncQueue = new IndexedDbSyncQueue(newIdentityKey);

				// 7. Create OneSatWallet wrapping the base wallet
				const newWallet = new OneSatWallet({
					wallet: baseWallet,
					storage: storageManager,
					chain,
					owners,
					syncQueue,
				});

				// 8. Setup sync event listeners
				newWallet.on("sync:start", (event: OneSatWalletEvents["sync:start"]) => {
					console.log("[WalletToolbox] Sync started:", event.addresses);
					setSyncStatus((prev) => ({
						...prev,
						isSyncing: true,
						error: null,
					}));
				});

				newWallet.on("sync:progress", (event: OneSatWalletEvents["sync:progress"]) => {
					console.log("[WalletToolbox] Sync progress:", event);
					setSyncStatus((prev) => ({
						...prev,
						progress: {
							pending: event.pending,
							done: event.done,
							failed: event.failed,
						},
					}));
				});

				newWallet.on("sync:complete", () => {
					console.log("[WalletToolbox] Sync complete");
					setSyncStatus((prev) => ({
						...prev,
						isSyncing: false,
						lastSync: new Date(),
					}));
				});

				newWallet.on("sync:error", (event: OneSatWalletEvents["sync:error"]) => {
					console.error("[WalletToolbox] Sync error:", event.message);
					setSyncStatus((prev) => ({
						...prev,
						isSyncing: false,
						error: event.message,
					}));
				});

				setWallet(newWallet);
				setIdentityKey(newIdentityKey);
				setOrdAddress(ordAddressParam || null);
				setPayAddress(payAddressParam || null);
				setIsInitialized(true);
				setInitError(null);

				console.log("[WalletToolbox] Wallet initialized successfully");
				console.log("[WalletToolbox] Identity Key:", newIdentityKey);

				return true;
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : String(error);
				console.error("[WalletToolbox] Failed to initialize wallet:", error);
				setInitError(errorMessage);
				setIsInitialized(false);
				return false;
			} finally {
				setIsInitializing(false);
			}
		},
		[chain, databaseName, isInitializing, isInitialized],
	);

	// Auto-initialize when keys are provided via props
	useEffect(() => {
		if (autoInitRootKeyHex && !isInitialized && !isInitializing) {
			console.log("[WalletToolbox] Auto-initializing with provided keys...");
			initializeWallet(
				autoInitRootKeyHex,
				autoInitOrdAddress,
				autoInitPayAddress,
			);
		}
	}, [
		autoInitRootKeyHex,
		autoInitOrdAddress,
		autoInitPayAddress,
		isInitialized,
		isInitializing,
		initializeWallet,
	]);

	/**
	 * Destroy the wallet and clear all state
	 */
	const destroyWallet = useCallback(async () => {
		console.log("[WalletToolbox] Destroying wallet...");

		// Close the wallet if it exists
		if (wallet) {
			wallet.close();
		}

		// Clear state
		setWallet(null);
		setIdentityKey(null);
		setOrdAddress(null);
		setPayAddress(null);
		setIsInitialized(false);
		setBalance(null);
		setOrdinals([]);
		setBsv20Tokens([]);
		setBsv21Tokens([]);
		setSyncStatus({
			isSyncing: false,
			progress: null,
			lastSync: null,
			error: null,
		});

		console.log("[WalletToolbox] Wallet destroyed");
	}, [wallet]);

	/**
	 * Sync wallet from 1Sat indexer using queue-based sync
	 */
	const syncWallet = useCallback(async () => {
		if (!wallet || !isInitialized) {
			console.warn("[WalletToolbox] Cannot sync - wallet not initialized");
			return;
		}

		if (syncStatus.isSyncing) {
			console.warn("[WalletToolbox] Sync already in progress");
			return;
		}

		console.log("[WalletToolbox] Starting wallet sync...");
		await wallet.sync();
	}, [wallet, isInitialized, syncStatus.isSyncing]);

	/**
	 * Refresh balance from wallet storage and GorillaPool for ordinals
	 */
	const refreshBalance = useCallback(async () => {
		if (!wallet || !isInitialized) {
			console.warn(
				"[WalletToolbox] Cannot refresh balance - wallet not initialized",
			);
			return;
		}

		try {
			// Get balance from wallet storage (fund basket)
			const fundOutputs = await wallet.listOutputs({
				basket: "fund",
				include: "locking scripts",
			});

			let total = 0;
			if (fundOutputs.outputs) {
				for (const output of fundOutputs.outputs) {
					if (output.spendable) {
						total += output.satoshis || 0;
					}
				}
			}
			setBalance({
				confirmed: total,
				unconfirmed: 0,
				total,
			});
			console.log("[WalletToolbox] Balance from storage:", total);

			// Get ordinals from GorillaPool (more reliable for NFT metadata)
			if (ordAddress) {
				const categorized =
					await gorillaPoolRef.current.getCategorizedUtxos(ordAddress);

				// Also check pay address if different
				if (payAddress && payAddress !== ordAddress) {
					const payUtxos =
						await gorillaPoolRef.current.getCategorizedUtxos(payAddress);
					categorized.ordinals.push(...payUtxos.ordinals);
					categorized.bsv20Tokens.push(...payUtxos.bsv20Tokens);
					categorized.bsv21Tokens.push(...payUtxos.bsv21Tokens);
				}

				setOrdinals(categorized.ordinals);
				setBsv20Tokens(
					categorized.bsv20Tokens.map((o) => ({
						outpoint: o.outpoint,
						txid: o.txid,
						vout: o.vout,
						height: o.height,
						data: o.data,
					})),
				);
				setBsv21Tokens(
					categorized.bsv21Tokens.map((o) => ({
						outpoint: o.outpoint,
						txid: o.txid,
						vout: o.vout,
						height: o.height,
						data: o.data,
					})),
				);

				console.log(
					`[WalletToolbox] Ordinals: ${categorized.ordinals.length}, BSV20: ${categorized.bsv20Tokens.length}, BSV21: ${categorized.bsv21Tokens.length}`,
				);
			}
		} catch (error) {
			console.error("[WalletToolbox] Failed to refresh balance:", error);
		}
	}, [wallet, isInitialized, ordAddress, payAddress]);

	// Auto-sync and refresh when wallet is initialized
	useEffect(() => {
		if (isInitialized && wallet && ordAddress) {
			console.log("[WalletToolbox] Auto-syncing and refreshing...");
			// Start sync, then refresh balance
			syncWallet().then(() => refreshBalance());
		}
	}, [isInitialized, wallet, ordAddress, syncWallet, refreshBalance]);

	const value = useMemo<WalletToolboxContextValue>(
		() => ({
			wallet,
			isInitialized,
			isInitializing,
			initError,
			chain,
			identityKey,
			syncStatus,
			syncWallet,
			balance,
			ordinals,
			bsv20Tokens,
			bsv21Tokens,
			initializeWallet,
			destroyWallet,
			refreshBalance,
		}),
		[
			wallet,
			isInitialized,
			isInitializing,
			initError,
			chain,
			identityKey,
			syncStatus,
			syncWallet,
			balance,
			ordinals,
			bsv20Tokens,
			bsv21Tokens,
			initializeWallet,
			destroyWallet,
			refreshBalance,
		],
	);

	return (
		<WalletToolboxContext.Provider value={value}>
			{children}
		</WalletToolboxContext.Provider>
	);
}

export function useWalletToolbox() {
	const context = useContext(WalletToolboxContext);
	if (context === undefined) {
		throw new Error(
			"useWalletToolbox must be used within a WalletToolboxProvider",
		);
	}
	return context;
}

import type { TxoData } from "@/lib/types/ordinals";
