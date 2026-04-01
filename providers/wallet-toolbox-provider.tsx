"use client";

/**
 * Wallet Toolbox Provider
 *
 * Integrates @1sat/wallet-browser wallet + address sync with receive address
 * rotation and TanStack Query powered balance refresh.
 */

import {
	type OneSatContext,
	type WalletOutput,
	createContext as createOneSatContext,
} from "@1sat/actions";
import {
	type AddressManager,
	createWebWallet,
	type OneSatServices,
	type WebWalletResult,
} from "@1sat/wallet-browser";
import { Beef, PrivateKey } from "@bsv/sdk";
import {
	type PermissionsManagerConfig,
	WalletPermissionsManager,
} from "@bsv/wallet-toolbox/out/src/index.client";
import { useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useMemo,
	useRef,
	useState,
} from "react";
import { useExchangeRate } from "@/hooks/use-exchange-rate";
import { loadLocalPermissions } from "@/lib/cwi/permission-store";
import {
	advanceReceiveAddress,
	buildReceiveAddressManager,
	getActiveReceiveAddresses,
	RECEIVE_ADDRESS_PREFIX,
	RECEIVE_ADDRESS_WINDOW,
} from "@/lib/receive-address-manager";
import {
	createDefaultReceiveAddressState,
	loadReceiveAddressState,
	type ReceiveAddressState,
	saveReceiveAddressState,
} from "@/lib/receive-address-state";
import type { TxoData } from "@/lib/types/ordinals";
import { useSyncEngine } from "./hooks/use-sync-engine";
import { useWalletBalance } from "./hooks/use-wallet-balance";
import { useWalletDiagnostics } from "./hooks/use-wallet-diagnostics";

type Wallet = WebWalletResult["wallet"];

type Chain = "main" | "test";

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
	seekGroupedPermission: true,
	differentiatePrivilegedOperations: true,
};

interface WalletBalance {
	confirmed: number;
	unconfirmed: number;
	total: number;
}

interface TokenBalance {
	outpoint: string;
	txid: string;
	vout: number;
	data?: TxoData;
	height?: number;
}

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

export type WalletEvent =
	| {
			id: number;
			timestamp: number;
			type: "broadcast";
			txid: string;
			status: string;
	  }
	| {
			id: number;
			timestamp: number;
			type: "proven";
			txid: string;
			blockHeight: number;
			blockHash: string;
	  }
	| {
			id: number;
			timestamp: number;
			type: "sync:progress";
			stage: string;
			message: string;
	  }
	| { id: number; timestamp: number; type: "sync:backup"; message: string }
	| {
			id: number;
			timestamp: number;
			type: "task:run";
			taskName: string;
			result: string;
	  }
	| {
			id: number;
			timestamp: number;
			type: "error";
			source: string;
			message: string;
	  }
	| {
			id: number;
			timestamp: number;
			type: "log";
			level: SyncEventLevel;
			source: string;
			message: string;
	  };

interface WalletToolboxContextValue {
	wallet: Wallet | null;
	permissionsManager: WalletPermissionsManager | null;
	services: OneSatServices | null;
	isInitialized: boolean;
	isInitializing: boolean;
	initError: string | null;
	chain: Chain;
	identityKey: string | null;

	depositAddress: string | null;
	receiveAddressIndex: number;
	receiveAddresses: string[];
	addressManagerReady: boolean;
	lastRotationOutpoint: string | null;

	syncStatus: SyncStatus;
	syncWallet: () => void;
	syncEvents: SyncEvent[];
	clearSyncEvents: () => void;
	walletEvents: WalletEvent[];
	clearWalletEvents: () => void;
	hasActiveSync: boolean;

	oneSatContext: OneSatContext | null;

	balance: WalletBalance | null;
	ordinals: WalletOutput[];
	bsv20Tokens: TokenBalance[];
	bsv21Tokens: TokenBalance[];
	legacyBalance: number;
	legacyFundingUtxos: {
		outpoint: string;
		satoshis: number;
		lockingScript: string;
	}[];
	isBalanceLoading: boolean;
	balanceError: Error | null;

	exchangeRate: number | null;

	initializeWallet: (rootKeyHex: string) => Promise<boolean>;
	destroyWallet: () => Promise<void>;
	refreshBalance: () => void;
}

const WalletToolboxContext = createContext<
	WalletToolboxContextValue | undefined
>(undefined);

function parseOutpoint(
	outpoint: string,
): { txid: string; vout: number } | null {
	const underscoreIndex = outpoint.lastIndexOf("_");
	if (underscoreIndex <= 0) {
		return null;
	}
	const txid = outpoint.slice(0, underscoreIndex);
	const voutRaw = outpoint.slice(underscoreIndex + 1);
	const vout = Number.parseInt(voutRaw, 10);
	if (!txid || Number.isNaN(vout) || vout < 0) {
		return null;
	}
	return { txid, vout };
}

interface WalletToolboxProviderProps {
	children: ReactNode;
	chain?: Chain;
}

export function WalletToolboxProvider({
	children,
	chain = "main",
}: WalletToolboxProviderProps) {
	const queryClient = useQueryClient();
	const { rate: exchangeRate } = useExchangeRate();

	// -- Core wallet state --
	const [wallet, setWallet] = useState<Wallet | null>(null);
	const [permissionsManager, setPermissionsManager] =
		useState<WalletPermissionsManager | null>(null);
	const [services, setServices] = useState<OneSatServices | null>(null);
	const [identityKey, setIdentityKey] = useState<string | null>(null);
	const walletResultRef = useRef<WebWalletResult | null>(null);

	const [isInitialized, setIsInitialized] = useState(false);
	const [isInitializing, setIsInitializing] = useState(false);
	const [initError, setInitError] = useState<string | null>(null);

	// -- Receive address state --
	const [depositAddress, setDepositAddress] = useState<string | null>(null);
	const [receiveAddressIndex, setReceiveAddressIndex] = useState(0);
	const [receiveAddresses, setReceiveAddresses] = useState<string[]>([]);
	const [trackedAddresses, setTrackedAddresses] = useState<string[]>([]);
	const [addressManagerReady, setAddressManagerReady] = useState(false);
	const [lastRotationOutpoint, setLastRotationOutpoint] = useState<
		string | null
	>(null);

	const addressManagerRef = useRef<AddressManager | null>(null);
	const receiveStateRef = useRef<ReceiveAddressState>(
		createDefaultReceiveAddressState(RECEIVE_ADDRESS_WINDOW),
	);
	const seenOutpointsRef = useRef(new Set<string>());
	const rotatingOutpointsRef = useRef(new Set<string>());
	const [syncRevision, setSyncRevision] = useState(0);

	// -- Diagnostics hook --
	const { syncEvents, clearSyncEvents, walletEvents, clearWalletEvents } =
		useWalletDiagnostics();

	// -- OneSat action context --
	const oneSatContext = useMemo<OneSatContext | null>(() => {
		if (!wallet) return null;
		return createOneSatContext(wallet, {
			services: services ?? undefined,
			chain,
		});
	}, [wallet, services, chain]);

	// -- Balance hook --
	const balanceResult = useWalletBalance({
		ctx: oneSatContext,
		isInitialized,
		identityKey,
		trackedAddresses,
	});
	const {
		refreshBalance,
		balance,
		ordinals,
		legacyBalance,
		legacyFundingUtxos,
		isBalanceLoading,
		balanceError,
		syncStatus: balanceSyncStatus,
	} = balanceResult;

	// -- Outpoint script resolution --
	const resolveOutpointScript = useCallback(
		async (outpoint: string): Promise<string | null> => {
			if (!services) return null;
			const parsed = parseOutpoint(outpoint);
			if (!parsed) return null;

			const beef = await services.beef.getBeef(parsed.txid);
			if (!beef) return null;

			const beefTx = Beef.fromBinary(Array.from(beef));
			const btx = beefTx.findTxid(parsed.txid);
			const output = btx?.tx?.outputs[parsed.vout];
			if (!output) return null;

			return output.lockingScript.toHex();
		},
		[services],
	);

	// -- Queued outpoint handler (receive address rotation) --
	const handleQueuedOutpoint = useCallback(
		async (outpoint: string, score: number) => {
			const addressManager = addressManagerRef.current;
			const receiveState = receiveStateRef.current;
			if (!wallet || !identityKey || !addressManager || !addressManagerReady) {
				return;
			}

			if (seenOutpointsRef.current.has(outpoint)) {
				return;
			}
			seenOutpointsRef.current.add(outpoint);
			if (seenOutpointsRef.current.size > 2000) {
				const oldest = seenOutpointsRef.current.values().next().value;
				if (oldest) {
					seenOutpointsRef.current.delete(oldest);
				}
			}

			console.log(
				`[WalletToolbox][Receive] queued outpoint ${outpoint} score ${score}`,
			);

			const outputScript = await resolveOutpointScript(outpoint);
			if (!outputScript) {
				console.log(
					`[WalletToolbox][Receive] unable to resolve locking script for ${outpoint}`,
				);
				return;
			}
			const normalizedOutputScript = outputScript.toLowerCase();
			console.log(
				`[WalletToolbox][Receive] resolved script for ${outpoint}: ${outputScript.slice(0, 24)}...`,
			);

			const currentScript = addressManager.getLockingScriptAtIndex(
				receiveState.currentIndex,
			);
			if (!currentScript) {
				console.log(
					`[WalletToolbox][Receive] missing current script at index ${receiveState.currentIndex}`,
				);
				return;
			}
			const normalizedCurrentScript = currentScript.toLowerCase();

			if (normalizedOutputScript !== normalizedCurrentScript) {
				console.log(
					`[WalletToolbox][Receive] ${outpoint} does not match current address index ${receiveState.currentIndex}; no rotation`,
				);
				return;
			}

			if (receiveState.lastRotationOutpoint === outpoint) {
				console.log(
					`[WalletToolbox][Receive] ${outpoint} already triggered a rotation`,
				);
				return;
			}

			if (rotatingOutpointsRef.current.has(outpoint)) {
				return;
			}
			rotatingOutpointsRef.current.add(outpoint);

			try {
				const advanced = await advanceReceiveAddress({
					wallet,
					identityKey,
					state: receiveState,
					addressManager,
					rotationOutpoint: outpoint,
					prefix: RECEIVE_ADDRESS_PREFIX,
					originator: ADMIN_ORIGINATOR,
				});

				receiveStateRef.current = advanced.state;
				addressManagerRef.current = advanced.addressManager;

				saveReceiveAddressState({ chain, identityKey }, advanced.state);

				setReceiveAddressIndex(advanced.state.currentIndex);
				setDepositAddress(advanced.depositAddress);
				setReceiveAddresses(
					getActiveReceiveAddresses(advanced.addressManager, advanced.state),
				);
				setTrackedAddresses(advanced.addressManager.getAddresses());
				setLastRotationOutpoint(advanced.state.lastRotationOutpoint ?? null);

				console.log(
					`[WalletToolbox][Receive] rotated to index ${advanced.state.currentIndex} after ${outpoint}`,
				);

				setSyncRevision((prev) => prev + 1);
				refreshBalance();
			} catch (error) {
				console.error(
					"[WalletToolbox][Receive] failed to rotate address:",
					error,
				);
			} finally {
				rotatingOutpointsRef.current.delete(outpoint);
			}
		},
		[
			wallet,
			identityKey,
			addressManagerReady,
			resolveOutpointScript,
			chain,
			refreshBalance,
		],
	);

	// -- Sync engine hook --
	const syncEngine = useSyncEngine({
		isInitialized,
		wallet,
		services,
		identityKey,
		chain,
		addressManagerReady,
		addressManagerRef,
		syncRevision,
		onQueuedOutpoint: handleQueuedOutpoint,
		refreshBalance,
	});
	const { stopSyncWorkers, syncWallet, syncEngineActive } = syncEngine;

	// -- Wallet init --
	const initializeWallet = useCallback(
		async (rootKeyHex: string): Promise<boolean> => {
			if (isInitializing || isInitialized) {
				console.warn("[WalletToolbox] Already initializing or initialized");
				return false;
			}

			setIsInitializing(true);
			console.log("[WalletToolbox] Starting wallet initialization...");

			try {
				const rootKey = PrivateKey.fromHex(rootKeyHex);
				const newIdentityKey = rootKey.toPublicKey().toString();

				const result = await createWebWallet({
					privateKey: rootKey,
					chain,
					activeRemote:
						chain === "main"
							? "https://api.1sat.app/1sat/wallet"
							: "https://testnet.api.1sat.app/1sat/wallet",
					storageIdentityKey: rootKey.toPublicKey().toString(),
				});

				walletResultRef.current = result;
				setWallet(result.wallet);
				setServices(result.services);

				const wpm = new WalletPermissionsManager(
					result.wallet,
					ADMIN_ORIGINATOR,
					PERMISSIONS_CONFIG,
				);
				try {
					const localPerms = await loadLocalPermissions({
						identityKey: newIdentityKey,
						chain,
					});
					const cache = (
						wpm as unknown as {
							permissionCache: Map<
								string,
								{ expiry: number; cachedAt: number }
							>;
						}
					).permissionCache;
					for (const perm of localPerms) {
						cache.set(perm.key, {
							expiry: perm.expiry,
							cachedAt: Date.now(),
						});
					}
				} catch {
					// IndexedDB unavailable — permissions will re-prompt.
				}

				const loadedState = loadReceiveAddressState(
					{ chain, identityKey: newIdentityKey },
					RECEIVE_ADDRESS_WINDOW,
				);
				const receiveState: ReceiveAddressState = {
					...loadedState,
					windowSize: RECEIVE_ADDRESS_WINDOW,
					maxDerivedIndex: Math.max(
						loadedState.maxDerivedIndex,
						loadedState.currentIndex + RECEIVE_ADDRESS_WINDOW - 1,
					),
				};

				const receiveResult = await buildReceiveAddressManager({
					wallet: result.wallet,
					identityKey: newIdentityKey,
					state: receiveState,
					prefix: RECEIVE_ADDRESS_PREFIX,
					originator: ADMIN_ORIGINATOR,
				});

				setPermissionsManager(wpm);
				setIdentityKey(newIdentityKey);
				setAddressManagerReady(true);
				setReceiveAddressIndex(receiveResult.state.currentIndex);
				setDepositAddress(receiveResult.depositAddress || null);
				setReceiveAddresses(
					getActiveReceiveAddresses(
						receiveResult.addressManager,
						receiveResult.state,
					),
				);
				setTrackedAddresses(receiveResult.addressManager.getAddresses());
				setLastRotationOutpoint(receiveState.lastRotationOutpoint ?? null);
				receiveStateRef.current = receiveResult.state;
				addressManagerRef.current = receiveResult.addressManager;
				saveReceiveAddressState(
					{ chain, identityKey: newIdentityKey },
					receiveResult.state,
				);
				seenOutpointsRef.current = new Set();
				rotatingOutpointsRef.current = new Set();

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
				setAddressManagerReady(false);
				return false;
			} finally {
				setIsInitializing(false);
			}
		},
		[chain, isInitializing, isInitialized],
	);

	// -- Wallet destroy --
	const destroyWallet = useCallback(async () => {
		console.log("[WalletToolbox] Destroying wallet...");

		await stopSyncWorkers();
		if (walletResultRef.current) {
			await walletResultRef.current.destroy();
			walletResultRef.current = null;
		}

		queryClient.removeQueries({ queryKey: ["wallet-balance"] });

		setWallet(null);
		setPermissionsManager(null);
		setServices(null);
		setIdentityKey(null);
		setDepositAddress(null);
		setReceiveAddressIndex(0);
		setReceiveAddresses([]);
		setTrackedAddresses([]);
		setAddressManagerReady(false);
		setLastRotationOutpoint(null);
		setIsInitialized(false);
		setSyncRevision(0);
		addressManagerRef.current = null;
		receiveStateRef.current = createDefaultReceiveAddressState(
			RECEIVE_ADDRESS_WINDOW,
		);
		seenOutpointsRef.current = new Set();
		rotatingOutpointsRef.current = new Set();

		console.log("[WalletToolbox] Wallet destroyed");
	}, [queryClient, stopSyncWorkers]);

	// -- Compose sync status with init state --
	const syncStatus = useMemo<SyncStatus>(
		() => ({
			isSyncing: isInitializing || balanceSyncStatus.isSyncing,
			progress: null,
			lastSync: balanceSyncStatus.lastSync,
			error: initError ?? balanceSyncStatus.error,
		}),
		[isInitializing, balanceSyncStatus, initError],
	);

	const hasActiveSync =
		isInitializing || balanceSyncStatus.isSyncing || syncEngineActive;

	// -- Context value --
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
			depositAddress,
			receiveAddressIndex,
			receiveAddresses,
			addressManagerReady,
			lastRotationOutpoint,
			syncStatus,
			syncWallet: syncWallet,
			syncEvents: syncEvents,
			clearSyncEvents: clearSyncEvents,
			walletEvents: walletEvents,
			clearWalletEvents: clearWalletEvents,
			hasActiveSync,
			oneSatContext,
			balance: balance,
			ordinals: ordinals,
			bsv20Tokens: [],
			bsv21Tokens: [],
			legacyBalance,
			legacyFundingUtxos,
			isBalanceLoading: isBalanceLoading,
			balanceError: balanceError,
			exchangeRate,
			initializeWallet,
			destroyWallet,
			refreshBalance: refreshBalance,
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
			depositAddress,
			receiveAddressIndex,
			receiveAddresses,
			addressManagerReady,
			lastRotationOutpoint,
			syncStatus,
			syncWallet,
			syncEvents,
			clearSyncEvents,
			walletEvents,
			clearWalletEvents,
			hasActiveSync,
			oneSatContext,
			balance,
			ordinals,
			legacyBalance,
			legacyFundingUtxos,
			isBalanceLoading,
			balanceError,
			exchangeRate,
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
