"use client";

/**
 * Wallet Toolbox Provider
 *
 * This provider integrates @1sat/wallet-toolbox for BRC-100 compliant wallet operations
 * with 1Sat-specific indexing, sync, and ordinal support.
 *
 * Uses TanStack Query for network request state management.
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import type { Ordinal } from "@/lib/wallet/gorillapool-service";
import { GorillaPoolService } from "@/lib/wallet/gorillapool-service";
import type { TxoData } from "@/lib/types/ordinals";

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

// Token balance interface
interface TokenBalance {
	outpoint: string;
	txid: string;
	vout: number;
	data?: TxoData;
	height?: number;
}

// Query result for balance/assets
interface BalanceQueryResult {
	balance: WalletBalance;
	ordinals: Ordinal[];
	bsv20Tokens: TokenBalance[];
	bsv21Tokens: TokenBalance[];
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
	syncWallet: () => void;
	isSyncPending: boolean;

	// Balance and assets (from query)
	balance: WalletBalance | null;
	ordinals: Ordinal[];
	bsv20Tokens: TokenBalance[];
	bsv21Tokens: TokenBalance[];
	isBalanceLoading: boolean;
	balanceError: Error | null;

	// Actions
	initializeWallet: (
		rootKeyHex: string,
		ordAddress?: string,
		payAddress?: string,
	) => Promise<boolean>;
	destroyWallet: () => Promise<void>;
	refreshBalance: () => void;
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

// Query keys
const QUERY_KEYS = {
	balance: (ordAddress: string | null, payAddress: string | null) =>
		["wallet-balance", ordAddress, payAddress] as const,
};

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
	const queryClient = useQueryClient();

	// Core wallet state
	const [wallet, setWallet] = useState<OneSatWallet | null>(null);
	const [identityKey, setIdentityKey] = useState<string | null>(null);

	// UI state
	const [isInitialized, setIsInitialized] = useState(false);
	const [isInitializing, setIsInitializing] = useState(false);
	const [initError, setInitError] = useState<string | null>(null);

	// Sync state (managed via events from wallet)
	const [syncStatus, setSyncStatus] = useState<SyncStatus>({
		isSyncing: false,
		progress: null,
		lastSync: null,
		error: null,
	});

	// Store wallet addresses for queries
	const [ordAddress, setOrdAddress] = useState<string | null>(null);
	const [payAddress, setPayAddress] = useState<string | null>(null);

	// GorillaPool service for ordinal lookups
	const gorillaPoolRef = useRef(new GorillaPoolService());

	// Balance query - fetches from GorillaPool
	const balanceQuery = useQuery({
		queryKey: QUERY_KEYS.balance(ordAddress, payAddress),
		queryFn: async (): Promise<BalanceQueryResult> => {
			if (!wallet || !isInitialized || !ordAddress) {
				throw new Error("Wallet not initialized");
			}

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

			// Get ordinals from GorillaPool
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

			console.log(
				`[WalletToolbox] Balance: ${total}, Ordinals: ${categorized.ordinals.length}, BSV20: ${categorized.bsv20Tokens.length}, BSV21: ${categorized.bsv21Tokens.length}`,
			);

			return {
				balance: { confirmed: total, unconfirmed: 0, total },
				ordinals: categorized.ordinals,
				bsv20Tokens: categorized.bsv20Tokens.map((o) => ({
					outpoint: o.outpoint,
					txid: o.txid,
					vout: o.vout,
					height: o.height,
					data: o.data,
				})),
				bsv21Tokens: categorized.bsv21Tokens.map((o) => ({
					outpoint: o.outpoint,
					txid: o.txid,
					vout: o.vout,
					height: o.height,
					data: o.data,
				})),
			};
		},
		enabled: isInitialized && !!wallet && !!ordAddress,
		staleTime: 30_000, // Consider data fresh for 30s
		gcTime: 5 * 60_000, // Keep in cache for 5 minutes
	});

	// Sync mutation
	const syncMutation = useMutation({
		mutationFn: async () => {
			if (!wallet || !isInitialized) {
				throw new Error("Wallet not initialized");
			}
			console.log("[WalletToolbox] Starting wallet sync...");
			await wallet.sync();
		},
		onSuccess: () => {
			// Invalidate balance query after sync completes
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.balance(ordAddress, payAddress),
			});
		},
	});

	/**
	 * Initialize the wallet with a root key
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

				newWallet.on(
					"sync:progress",
					(event: OneSatWalletEvents["sync:progress"]) => {
						setSyncStatus((prev) => ({
							...prev,
							progress: {
								pending: event.pending,
								done: event.done,
								failed: event.failed,
							},
						}));
					},
				);

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

				// Trigger initial sync
				setTimeout(() => {
					newWallet.sync().catch(console.error);
				}, 100);

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

	/**
	 * Destroy the wallet and clear all state
	 */
	const destroyWallet = useCallback(async () => {
		console.log("[WalletToolbox] Destroying wallet...");

		// Close the wallet if it exists
		if (wallet) {
			wallet.close();
		}

		// Clear query cache for this wallet
		queryClient.removeQueries({
			queryKey: QUERY_KEYS.balance(ordAddress, payAddress),
		});

		// Clear state
		setWallet(null);
		setIdentityKey(null);
		setOrdAddress(null);
		setPayAddress(null);
		setIsInitialized(false);
		setSyncStatus({
			isSyncing: false,
			progress: null,
			lastSync: null,
			error: null,
		});

		console.log("[WalletToolbox] Wallet destroyed");
	}, [wallet, queryClient, ordAddress, payAddress]);

	const value = useMemo<WalletToolboxContextValue>(
		() => ({
			wallet,
			isInitialized,
			isInitializing,
			initError,
			chain,
			identityKey,
			syncStatus,
			syncWallet: () => syncMutation.mutate(),
			isSyncPending: syncMutation.isPending,
			balance: balanceQuery.data?.balance ?? null,
			ordinals: balanceQuery.data?.ordinals ?? [],
			bsv20Tokens: balanceQuery.data?.bsv20Tokens ?? [],
			bsv21Tokens: balanceQuery.data?.bsv21Tokens ?? [],
			isBalanceLoading: balanceQuery.isLoading,
			balanceError: balanceQuery.error,
			initializeWallet,
			destroyWallet,
			refreshBalance: () =>
				queryClient.invalidateQueries({
					queryKey: QUERY_KEYS.balance(ordAddress, payAddress),
				}),
		}),
		[
			wallet,
			isInitialized,
			isInitializing,
			initError,
			chain,
			identityKey,
			syncStatus,
			syncMutation,
			balanceQuery.data,
			balanceQuery.isLoading,
			balanceQuery.error,
			initializeWallet,
			destroyWallet,
			queryClient,
			ordAddress,
			payAddress,
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
