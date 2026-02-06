"use client";

/**
 * Wallet Toolbox Provider
 *
 * This provider integrates @1sat/wallet-toolbox for BRC-100 compliant wallet operations
 * with 1Sat-specific indexing and ordinal support.
 *
 * Uses TanStack Query for network request state management.
 */

import {
	createWebWallet,
	type OneSatServices,
	type WebWalletResult,
} from "@1sat/wallet-browser";
import { PrivateKey } from "@bsv/sdk";
import {
	type PermissionsManagerConfig,
	WalletPermissionsManager,
} from "@bsv/wallet-toolbox/out/src/index.client";

type Wallet = WebWalletResult["wallet"];

const ADMIN_ORIGINATOR =
	typeof window !== "undefined"
		? window.location.origin
		: "https://1satwallet.com";

const PERMISSIONS_CONFIG: PermissionsManagerConfig = {
	seekProtocolPermissionsForSigning: true,
	seekProtocolPermissionsForEncrypting: true,
	seekProtocolPermissionsForHMAC: true,
	seekPermissionsForKeyLinkageRevelation: true,
	seekPermissionsForPublicKeyRevelation: false,
	seekPermissionsForIdentityKeyRevelation: true,
	seekPermissionsForIdentityResolution: true,
	seekBasketInsertionPermissions: true,
	seekBasketRemovalPermissions: true,
	seekBasketListingPermissions: false,
	seekPermissionWhenApplyingActionLabels: false,
	seekPermissionWhenListingActionsByLabel: false,
	seekCertificateDisclosurePermissions: true,
	seekCertificateAcquisitionPermissions: true,
	seekCertificateRelinquishmentPermissions: true,
	seekCertificateListingPermissions: false,
	encryptWalletMetadata: true,
	seekSpendingPermissions: true,
	seekGroupedPermission: false,
	differentiatePrivilegedOperations: true,
};

import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import type { TxoData } from "@/lib/types/ordinals";
import type { Ordinal } from "@/lib/wallet/gorillapool-service";
import { GorillaPoolService } from "@/lib/wallet/gorillapool-service";

type Chain = "main" | "test";

interface WalletBalance {
	confirmed: number;
	unconfirmed: number;
	total: number;
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

// Sync status for UI components
interface SyncStatus {
	isSyncing: boolean;
	progress: null;
	lastSync: Date | null;
	error: string | null;
}

type SyncEventLevel = "log" | "warn" | "error";

export interface SyncEvent {
	id: number;
	timestamp: number;
	level: SyncEventLevel;
	source: string;
	message: string;
}

interface WalletToolboxContextValue {
	// Wallet state
	wallet: Wallet | null;
	permissionsManager: WalletPermissionsManager | null;
	services: OneSatServices | null;
	isInitialized: boolean;
	isInitializing: boolean;
	initError: string | null;
	chain: Chain;
	identityKey: string | null;

	// Sync state (driven by balance query)
	syncStatus: SyncStatus;
	syncWallet: () => void;
	syncEvents: SyncEvent[];
	clearSyncEvents: () => void;
	hasActiveSync: boolean;

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

const SYNC_EVENT_LIMIT = 500;

const WALLET_LOG_PATTERNS = [
	/\[WalletBridge\]/,
	/\[WalletToolbox\]/,
	/\[createWebWallet\]/,
	/\[GorillaPool\]/,
	/\[ChaintracksClient\]/,
	/\bTaskNewHeader\b/,
	/\bTaskMonitor[A-Za-z]+\b/,
];

const stringifyConsoleArg = (arg: unknown): string => {
	if (typeof arg === "string") return arg;
	if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
	if (typeof arg === "bigint") return `${arg.toString()}n`;
	if (arg === undefined) return "undefined";
	if (arg === null) return "null";
	if (typeof arg === "object") {
		try {
			return JSON.stringify(arg);
		} catch {
			return String(arg);
		}
	}
	return String(arg);
};

const serializeConsoleArgs = (args: unknown[]): string =>
	args
		.map((arg) => stringifyConsoleArg(arg))
		.join(" ")
		.trim();

const trimLogMessage = (message: string, maxLength = 1200): string => {
	if (message.length <= maxLength) return message;
	return `${message.slice(0, maxLength)}...`;
};

const shouldCaptureWalletLog = (message: string): boolean =>
	WALLET_LOG_PATTERNS.some((pattern) => pattern.test(message));

const detectWalletLogSource = (message: string): string => {
	const bracketSource = message.match(/\[([^[\]]+)\]/)?.[1];
	if (bracketSource) return bracketSource;
	if (message.includes("TaskNewHeader")) return "TaskNewHeader";
	if (message.includes("TaskMonitorCallHistory"))
		return "TaskMonitorCallHistory";
	if (message.includes("TaskMonitor")) return "TaskMonitor";
	return "Wallet";
};

// Query keys
const QUERY_KEYS = {
	balance: (ordAddress: string | null, payAddress: string | null) =>
		["wallet-balance", ordAddress, payAddress] as const,
};

interface WalletToolboxProviderProps {
	children: ReactNode;
	chain?: Chain;
}

export function WalletToolboxProvider({
	children,
	chain = "main",
}: WalletToolboxProviderProps) {
	const queryClient = useQueryClient();

	// Core wallet state
	const [wallet, setWallet] = useState<Wallet | null>(null);
	const [permissionsManager, setPermissionsManager] =
		useState<WalletPermissionsManager | null>(null);
	const [services, setServices] = useState<OneSatServices | null>(null);
	const [identityKey, setIdentityKey] = useState<string | null>(null);
	const walletResultRef = useRef<WebWalletResult | null>(null);

	// UI state
	const [isInitialized, setIsInitialized] = useState(false);
	const [isInitializing, setIsInitializing] = useState(false);
	const [initError, setInitError] = useState<string | null>(null);

	// Store wallet addresses for queries
	const [ordAddress, setOrdAddress] = useState<string | null>(null);
	const [payAddress, setPayAddress] = useState<string | null>(null);

	// GorillaPool service for ordinal lookups
	const gorillaPoolRef = useRef(new GorillaPoolService());
	const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([]);
	const syncEventIdRef = useRef(0);

	const appendSyncEvent = useCallback(
		(level: SyncEventLevel, source: string, message: string) => {
			setSyncEvents((prev) => {
				const next = [
					...prev,
					{
						id: ++syncEventIdRef.current,
						timestamp: Date.now(),
						level,
						source,
						message: trimLogMessage(message),
					},
				];
				if (next.length <= SYNC_EVENT_LIMIT) return next;
				return next.slice(next.length - SYNC_EVENT_LIMIT);
			});
		},
		[],
	);

	const clearSyncEvents = useCallback(() => {
		setSyncEvents([]);
	}, []);

	useEffect(() => {
		type ConsoleMethod = (...data: unknown[]) => void;

		const originalLog = console.log.bind(console) as ConsoleMethod;
		const originalWarn = console.warn.bind(console) as ConsoleMethod;
		const originalError = console.error.bind(console) as ConsoleMethod;

		const createCapturedMethod =
			(level: SyncEventLevel, originalMethod: ConsoleMethod): ConsoleMethod =>
			(...args: unknown[]) => {
				originalMethod(...args);
				const message = serializeConsoleArgs(args);
				if (!message || !shouldCaptureWalletLog(message)) return;
				appendSyncEvent(level, detectWalletLogSource(message), message);
			};

		console.log = createCapturedMethod(
			"log",
			originalLog,
		) as typeof console.log;
		console.warn = createCapturedMethod(
			"warn",
			originalWarn,
		) as typeof console.warn;
		console.error = createCapturedMethod(
			"error",
			originalError,
		) as typeof console.error;

		return () => {
			console.log = originalLog as typeof console.log;
			console.warn = originalWarn as typeof console.warn;
			console.error = originalError as typeof console.error;
		};
	}, [appendSyncEvent]);

	// Balance query - fetches from GorillaPool
	const balanceQuery = useQuery({
		queryKey: QUERY_KEYS.balance(ordAddress, payAddress),
		queryFn: async (): Promise<BalanceQueryResult> => {
			if (!wallet || !isInitialized || !ordAddress) {
				throw new Error("Wallet not initialized");
			}

			console.log("[WalletToolbox] Starting wallet scan request...");

			const gp = gorillaPoolRef.current;

			// Fetch fund outputs and categorized utxos in parallel
			const utxoPromises: Promise<
				Awaited<ReturnType<typeof gp.getCategorizedUtxos>>
			>[] = [gp.getCategorizedUtxos(ordAddress)];
			console.log(
				`[WalletToolbox] Scanning ordinals address ${ordAddress.slice(0, 10)}...`,
			);
			if (payAddress && payAddress !== ordAddress) {
				utxoPromises.push(gp.getCategorizedUtxos(payAddress));
				console.log(
					`[WalletToolbox] Scanning payment address ${payAddress.slice(0, 10)}...`,
				);
			}

			const [fundOutputs, ...utxoResults] = await Promise.all([
				wallet.listOutputs({ basket: "fund", include: "locking scripts" }),
				...utxoPromises,
			]);
			console.log(
				`[WalletToolbox] listOutputs returned ${fundOutputs.outputs?.length ?? 0} outputs`,
			);

			let total = 0;
			if (fundOutputs.outputs) {
				for (const output of fundOutputs.outputs) {
					if (output.spendable) {
						total += output.satoshis || 0;
					}
				}
			}

			// Merge categorized utxo results
			const categorized = utxoResults[0];
			for (let i = 1; i < utxoResults.length; i++) {
				categorized.ordinals.push(...utxoResults[i].ordinals);
				categorized.bsv20Tokens.push(...utxoResults[i].bsv20Tokens);
				categorized.bsv21Tokens.push(...utxoResults[i].bsv21Tokens);
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
				// Derive identity key from root key
				const rootKey = PrivateKey.fromHex(rootKeyHex);
				const newIdentityKey = rootKey.toPublicKey().toString();

				// Create wallet using factory
				const result = await createWebWallet({
					privateKey: rootKey,
					chain,
					storageIdentityKey: newIdentityKey,
				});

				// Start the monitor for tx lifecycle management
				result.monitor.startTasks();

				walletResultRef.current = result;
				setWallet(result.wallet);
				setServices(result.services);

				// Wrap wallet with WalletPermissionsManager for external dApp access
				const wpm = new WalletPermissionsManager(
					result.wallet,
					ADMIN_ORIGINATOR,
					PERMISSIONS_CONFIG,
				);
				setPermissionsManager(wpm);

				setIdentityKey(newIdentityKey);
				setOrdAddress(ordAddressParam || null);
				setPayAddress(payAddressParam || null);
				setIsInitialized(true);
				setInitError(null);

				console.log("[WalletToolbox] Wallet initialized successfully");
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
		[chain, isInitializing, isInitialized],
	);

	/**
	 * Destroy the wallet and clear all state
	 */
	const destroyWallet = useCallback(async () => {
		console.log("[WalletToolbox] Destroying wallet...");

		// Use the factory's destroy function (stops monitor + destroys wallet)
		if (walletResultRef.current) {
			await walletResultRef.current.destroy();
			walletResultRef.current = null;
		}

		// Clear query cache for this wallet
		queryClient.removeQueries({
			queryKey: QUERY_KEYS.balance(ordAddress, payAddress),
		});

		// Clear state
		setWallet(null);
		setPermissionsManager(null);
		setServices(null);
		setIdentityKey(null);
		setOrdAddress(null);
		setPayAddress(null);
		setIsInitialized(false);

		console.log("[WalletToolbox] Wallet destroyed");
	}, [queryClient, ordAddress, payAddress]);

	// Track last successful fetch time for sync status
	const [lastSync, setLastSync] = useState<Date | null>(null);
	const wasFetchingRef = useRef(false);
	useEffect(() => {
		if (
			wasFetchingRef.current &&
			!balanceQuery.isFetching &&
			balanceQuery.isSuccess
		) {
			setLastSync(new Date());
		}
		wasFetchingRef.current = balanceQuery.isFetching;
	}, [balanceQuery.isFetching, balanceQuery.isSuccess]);

	const refreshBalance = useCallback(
		() =>
			queryClient.invalidateQueries({
				queryKey: QUERY_KEYS.balance(ordAddress, payAddress),
			}),
		[queryClient, ordAddress, payAddress],
	);

	const syncStatus = useMemo<SyncStatus>(
		() => ({
			isSyncing: isInitializing || balanceQuery.isFetching,
			progress: null,
			lastSync,
			error: initError ?? balanceQuery.error?.message ?? null,
		}),
		[
			isInitializing,
			balanceQuery.isFetching,
			initError,
			balanceQuery.error,
			lastSync,
		],
	);

	const hasActiveSync = isInitializing || balanceQuery.isFetching;

	const value = useMemo<WalletToolboxContextValue>(
		() => ({
			wallet,
			permissionsManager,
			services,
			isInitialized,
			isInitializing,
			initError,
			chain,
			identityKey,
			syncStatus,
			syncWallet: refreshBalance,
			syncEvents,
			clearSyncEvents,
			hasActiveSync,
			balance: balanceQuery.data?.balance ?? null,
			ordinals: balanceQuery.data?.ordinals ?? [],
			bsv20Tokens: balanceQuery.data?.bsv20Tokens ?? [],
			bsv21Tokens: balanceQuery.data?.bsv21Tokens ?? [],
			isBalanceLoading: balanceQuery.isLoading,
			balanceError: balanceQuery.error,
			initializeWallet,
			destroyWallet,
			refreshBalance,
		}),
		[
			wallet,
			permissionsManager,
			services,
			isInitialized,
			isInitializing,
			initError,
			chain,
			identityKey,
			syncStatus,
			syncEvents,
			clearSyncEvents,
			hasActiveSync,
			refreshBalance,
			balanceQuery.data,
			balanceQuery.isLoading,
			balanceQuery.error,
			initializeWallet,
			destroyWallet,
		],
	);

	return (
		<WalletToolboxContext.Provider value={value}>
			{children}
		</WalletToolboxContext.Provider>
	);
}

export type {
	PermissionEventHandler,
	PermissionRequest,
} from "@bsv/wallet-toolbox/out/src/index.client";

export function useWalletToolbox() {
	const context = useContext(WalletToolboxContext);
	if (context === undefined) {
		throw new Error(
			"useWalletToolbox must be used within a WalletToolboxProvider",
		);
	}
	return context;
}
