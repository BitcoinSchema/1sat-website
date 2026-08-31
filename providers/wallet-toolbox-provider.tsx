"use client";

/**
 * Wallet Toolbox Provider
 *
 * Integrates @1sat/wallet-browser wallet + address sync with receive address
 * rotation and TanStack Query powered balance refresh.
 */

import {
	type Bsv21Balance,
	createContext as createOneSatContext,
	deriveDepositAddresses,
	type OneSatContext,
	type WalletOutput,
} from "@1sat/actions";
import type { OneSatServices } from "@1sat/client";
import {
	connectWallet,
	createWalletSession,
	type WalletSession,
} from "@1sat/connect";
import {
	type AddressManager,
	createWebWallet,
	type WebWalletResult,
} from "@1sat/wallet-browser";
import { Beef, PrivateKey, type WalletInterface } from "@bsv/sdk";
import {
	type PermissionsManagerConfig,
	WalletPermissionsManager,
} from "@bsv/wallet-toolbox-client";
import { useQueryClient } from "@tanstack/react-query";
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
import { useExchangeRate } from "@/hooks/use-exchange-rate";
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
import { reportDiagnostic } from "@/lib/runtime-diagnostics";
import { createStackServices } from "@/lib/stack";
import {
	statusAfterDisconnect,
	type WalletConnectionStatus,
} from "@/lib/wallet-connection-status";
import { loadOrCreateWalletStorageIdentity } from "@/lib/wallet-storage-identity";
import { type SyncTasksState, useSyncEngine } from "./hooks/use-sync-engine";
import { useWalletBalance } from "./hooks/use-wallet-balance";
import { useWalletDiagnostics } from "./hooks/use-wallet-diagnostics";

type Chain = "main" | "test";
export type WalletConnectionMode = "none" | "built-in" | "external";

export const WALLET_CONNECTION_MODE_KEY = "1sat-wallet-connection-mode";

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
	correlationId: string;
	category: "route" | "action" | "provider";
	code: string;
	operation: string;
	recoverable: boolean;
	context: Record<string, string | number | boolean | null>;
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
	wallet: WalletInterface | null;
	permissionsManager: WalletPermissionsManager | null;
	services: OneSatServices | null;
	connectionMode: WalletConnectionMode;
	connectionStatus: WalletConnectionStatus;
	providerType: string | null;
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
	syncTasks: SyncTasksState;
	syncWallet: () => void;
	syncEvents: SyncEvent[];
	clearSyncEvents: () => void;
	walletEvents: WalletEvent[];
	clearWalletEvents: () => void;
	hasActiveSync: boolean;

	oneSatContext: OneSatContext | null;

	balance: WalletBalance | null;
	ordinals: WalletOutput[];
	bsv20Tokens: Bsv21Balance[];
	bsv21Tokens: Bsv21Balance[];
	legacyBalance: number;
	legacyFundingUtxos: {
		outpoint: string;
		satoshis: number;
	}[];
	isBalanceLoading: boolean;
	balanceError: Error | null;

	exchangeRate: number | null;

	initializeWallet: (rootKeyHex: string) => Promise<boolean>;
	connectExternalWallet: () => Promise<boolean>;
	disconnectExternalWallet: () => Promise<void>;
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
	const [wallet, setWallet] = useState<WalletInterface | null>(null);
	const [permissionsManager, setPermissionsManager] =
		useState<WalletPermissionsManager | null>(null);
	const [services, setServices] = useState<OneSatServices | null>(null);
	const [identityKey, setIdentityKey] = useState<string | null>(null);
	const [connectionMode, setConnectionMode] =
		useState<WalletConnectionMode>("none");
	const [connectionStatus, setConnectionStatus] =
		useState<WalletConnectionStatus>("no-wallet");
	const [providerType, setProviderType] = useState<string | null>(null);
	const walletResultRef = useRef<WebWalletResult | null>(null);
	const walletSessionRef = useRef<WalletSession | null>(null);
	const walletSessionCleanupRef = useRef<() => void>(() => {});
	const externalServicesRef = useRef<OneSatServices | null>(null);
	const connectionGenerationRef = useRef(0);
	const teardownPromiseRef = useRef<Promise<void> | null>(null);

	const [isInitialized, setIsInitialized] = useState(false);
	const [isInitializing, setIsInitializing] = useState(false);
	const initGuardRef = useRef(false);
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
	const [initialReceiveState] = useState<ReceiveAddressState>(() =>
		createDefaultReceiveAddressState(RECEIVE_ADDRESS_WINDOW),
	);
	const [initialSeenOutpoints] = useState(() => new Set<string>());
	const [initialRotatingOutpoints] = useState(() => new Set<string>());
	const receiveStateRef = useRef(initialReceiveState);
	const seenOutpointsRef = useRef(initialSeenOutpoints);
	const rotatingOutpointsRef = useRef(initialRotatingOutpoints);
	const [syncRevision, setSyncRevision] = useState(0);

	// -- Diagnostics hook --
	const { syncEvents, clearSyncEvents, walletEvents, clearWalletEvents } =
		useWalletDiagnostics({
			connectionStatus,
			connectionMode,
			providerType,
			isInitialized,
			initFailed: initError !== null,
		});

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
		bsv21Balances,
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
	const _handleQueuedOutpoint = useCallback(
		async (outpoint: string, _score: number) => {
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

			const outputScript = await resolveOutpointScript(outpoint);
			if (!outputScript) {
				return;
			}
			const normalizedOutputScript = outputScript.toLowerCase();

			const currentScript = addressManager.getLockingScriptAtIndex(
				receiveState.currentIndex,
			);
			if (!currentScript) {
				return;
			}
			const normalizedCurrentScript = currentScript.toLowerCase();

			if (normalizedOutputScript !== normalizedCurrentScript) {
				return;
			}

			if (receiveState.lastRotationOutpoint === outpoint) {
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

				setSyncRevision((prev) => prev + 1);
				refreshBalance();
			} catch {
				reportDiagnostic({
					category: "provider",
					code: "provider.failed",
					operation: "wallet.receive.rotate",
					recoverable: true,
					context: { retryable: true },
				});
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
		ownedByWebsite: connectionMode === "built-in",
		wallet,
		services,
		identityKey,
		chain,
		addressManagerReady,
		addressManagerRef,
		syncRevision,
		refreshBalance,
	});
	const { stopSyncWorkers, syncWallet, syncEngineActive, syncTasks } =
		syncEngine;

	const clearIdentityQueries = useCallback(() => {
		queryClient.removeQueries({ queryKey: ["wallet-balance"] });
		queryClient.removeQueries({ queryKey: ["wallet-actions"] });
		queryClient.removeQueries({ queryKey: ["bap-profile"] });
		queryClient.removeQueries({ queryKey: ["opns-names"] });
	}, [queryClient]);

	const resetWalletState = useCallback(
		(status: WalletConnectionStatus) => {
			clearIdentityQueries();

			setWallet(null);
			setPermissionsManager(null);
			setServices(null);
			setIdentityKey(null);
			setConnectionMode("none");
			setConnectionStatus(status);
			setProviderType(null);
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
		},
		[clearIdentityQueries],
	);

	const deriveExternalAddresses = useCallback(
		async (
			externalWallet: WalletInterface,
			externalServices: OneSatServices,
		) => {
			const context = createOneSatContext(externalWallet, {
				services: externalServices,
				chain,
			});
			const { derivations } = await deriveDepositAddresses.execute(context, {
				count: 1,
			});
			return derivations.map(({ address }) => address);
		},
		[chain],
	);

	const teardownWallet = useCallback(
		(status: WalletConnectionStatus): Promise<void> => {
			if (teardownPromiseRef.current) return teardownPromiseRef.current;

			connectionGenerationRef.current += 1;
			initGuardRef.current = false;
			setIsInitializing(false);

			const session = walletSessionRef.current;
			walletSessionRef.current = null;
			walletSessionCleanupRef.current();
			walletSessionCleanupRef.current = () => {};
			if (session?.status === "connected") {
				// This closes only the local transport/session. BRC-100 does not define
				// provider-side grant revocation for a dapp disconnect.
				session.disconnect("manual");
			} else {
				session?.stop();
			}

			const webWallet = walletResultRef.current;
			walletResultRef.current = null;
			externalServicesRef.current?.close();
			externalServicesRef.current = null;
			localStorage.removeItem(WALLET_CONNECTION_MODE_KEY);
			resetWalletState(status);

			const teardown = (async () => {
				await stopSyncWorkers();
				try {
					await webWallet?.destroy();
				} catch {
					reportDiagnostic({
						category: "provider",
						code: "provider.failed",
						operation: "wallet.teardown",
						recoverable: true,
					});
				}
			})().finally(() => {
				if (teardownPromiseRef.current === teardown) {
					teardownPromiseRef.current = null;
				}
			});
			teardownPromiseRef.current = teardown;
			return teardown;
		},
		[resetWalletState, stopSyncWorkers],
	);

	const connectExternalWallet = useCallback(async (): Promise<boolean> => {
		const pendingTeardown = teardownPromiseRef.current;
		if (pendingTeardown) await pendingTeardown;
		if (initGuardRef.current) {
			return false;
		}

		const generation = ++connectionGenerationRef.current;
		initGuardRef.current = true;
		setIsInitializing(true);
		setConnectionStatus("authenticating");
		setInitError(null);

		let pendingResult: Awaited<ReturnType<typeof connectWallet>> = null;
		try {
			const result = await connectWallet({ autoDetect: true });
			pendingResult = result;
			if (generation !== connectionGenerationRef.current) {
				result?.disconnect();
				return false;
			}
			if (!result) {
				localStorage.removeItem(WALLET_CONNECTION_MODE_KEY);
				setConnectionStatus("no-wallet");
				setInitError(
					"No BRC-100 wallet responded. Open 1Sat Wallet Desktop, enable a compatible extension, or use an embedded wallet browser and try again.",
				);
				initGuardRef.current = false;
				return false;
			}

			const externalServices = createStackServices(chain);
			let addresses: string[];
			try {
				addresses = await deriveExternalAddresses(
					result.wallet,
					externalServices,
				);
			} catch (error) {
				externalServices.close();
				result.disconnect();
				throw error;
			}
			if (generation !== connectionGenerationRef.current) {
				externalServices.close();
				result.disconnect();
				return false;
			}
			externalServicesRef.current = externalServices;

			setWallet(result.wallet);
			setServices(externalServices);
			setPermissionsManager(null);
			setIdentityKey(result.identityKey);
			setDepositAddress(addresses[0] ?? null);
			setReceiveAddresses(addresses);
			setTrackedAddresses(addresses);
			setAddressManagerReady(false);
			setConnectionMode("external");
			setConnectionStatus("ready");
			setProviderType(result.provider);
			setIsInitialized(true);

			localStorage.setItem(WALLET_CONNECTION_MODE_KEY, "external");

			const session = createWalletSession(result);
			walletSessionRef.current = session;
			const unsubscribeIdentity = session.on("identityChange", ({ next }) => {
				if (walletSessionRef.current !== session) return;
				const identityGeneration = ++connectionGenerationRef.current;
				clearIdentityQueries();
				setIsInitialized(false);
				setIdentityKey(null);
				setDepositAddress(null);
				setReceiveAddresses([]);
				setTrackedAddresses([]);
				setConnectionStatus("authenticating");
				void deriveExternalAddresses(result.wallet, externalServices)
					.then((nextAddresses) => {
						if (
							identityGeneration !== connectionGenerationRef.current ||
							walletSessionRef.current !== session
						) {
							return;
						}
						setIdentityKey(next);
						setDepositAddress(nextAddresses[0] ?? null);
						setReceiveAddresses(nextAddresses);
						setTrackedAddresses(nextAddresses);
						setConnectionStatus("ready");
						setIsInitialized(true);
						setInitError(null);
					})
					.catch(() => {
						if (identityGeneration !== connectionGenerationRef.current) return;
						setInitError(
							"Wallet identity refresh failed. Reconnect and try again.",
						);
						void teardownWallet("disconnected");
					});
			});
			const unsubscribeDisconnected = session.on(
				"disconnected",
				({ reason }) => {
					if (walletSessionRef.current !== session) return;
					void teardownWallet(statusAfterDisconnect(reason));
				},
			);
			walletSessionCleanupRef.current = () => {
				unsubscribeIdentity();
				unsubscribeDisconnected();
			};
			session.start();

			return true;
		} catch {
			if (generation !== connectionGenerationRef.current) return false;
			connectionGenerationRef.current += 1;
			walletSessionCleanupRef.current();
			walletSessionCleanupRef.current = () => {};
			walletSessionRef.current?.stop();
			walletSessionRef.current = null;
			pendingResult?.disconnect();
			externalServicesRef.current?.close();
			externalServicesRef.current = null;
			localStorage.removeItem(WALLET_CONNECTION_MODE_KEY);
			resetWalletState("disconnected");
			setInitError(
				"Wallet connection failed. Check the provider and try again.",
			);
			setIsInitializing(false);
			initGuardRef.current = false;
			return false;
		} finally {
			if (generation === connectionGenerationRef.current) {
				setIsInitializing(false);
			}
		}
	}, [
		chain,
		clearIdentityQueries,
		deriveExternalAddresses,
		resetWalletState,
		teardownWallet,
	]);

	useEffect(() => {
		if (
			isInitialized ||
			isInitializing ||
			localStorage.getItem(WALLET_CONNECTION_MODE_KEY) !== "external"
		) {
			return;
		}
		void connectExternalWallet();
	}, [connectExternalWallet, isInitialized, isInitializing]);

	// -- Wallet init --
	const initializeWallet = useCallback(
		async (rootKeyHex: string): Promise<boolean> => {
			const pendingTeardown = teardownPromiseRef.current;
			if (pendingTeardown) await pendingTeardown;
			if (initGuardRef.current) {
				return false;
			}
			const generation = ++connectionGenerationRef.current;
			initGuardRef.current = true;

			setIsInitializing(true);
			setConnectionStatus("authenticating");
			let pendingResult: WebWalletResult | null = null;
			try {
				const rootKey = PrivateKey.fromHex(rootKeyHex);
				const newIdentityKey = rootKey.toPublicKey().toString();
				const storageIdentityKey =
					await loadOrCreateWalletStorageIdentity(chain);

				// wallet.1sat.app is the hosted BRC-100 storage server (the old
				// api.1sat.app/1sat/wallet URL 404s, and wallet-browser >=0.0.7x
				// verifies the storage connection eagerly at init)
				const activeRemote =
					process.env.NEXT_PUBLIC_WALLET_STORAGE_URL ||
					(chain === "main" ? "https://wallet.1sat.app" : undefined);
				const result = await createWebWallet({
					privateKey: rootKey,
					chain,
					activeRemote,
					storageIdentityKey,
				});
				pendingResult = result;
				if (generation !== connectionGenerationRef.current) {
					await result.destroy();
					return false;
				}

				const wpm = new WalletPermissionsManager(
					result.wallet,
					ADMIN_ORIGINATOR,
					PERMISSIONS_CONFIG,
				);
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
				if (generation !== connectionGenerationRef.current) {
					await result.destroy();
					return false;
				}

				pendingResult = null;
				walletResultRef.current = result;
				setWallet(result.wallet);
				setServices(result.services);

				setPermissionsManager(wpm);
				setIdentityKey(newIdentityKey);
				setConnectionMode("built-in");
				setConnectionStatus("ready");
				setProviderType("1sat-web");
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
				localStorage.setItem(WALLET_CONNECTION_MODE_KEY, "built-in");

				return true;
			} catch {
				await pendingResult?.destroy();
				if (generation !== connectionGenerationRef.current) return false;
				reportDiagnostic({
					category: "provider",
					code: "provider.failed",
					operation: "wallet.initialize",
					recoverable: true,
					context: { mode: "built-in", retryable: true },
				});
				setInitError(
					"Built-in wallet initialization failed. Lock and unlock the wallet, then try again.",
				);
				setConnectionStatus("disconnected");
				setIsInitialized(false);
				setAddressManagerReady(false);
				initGuardRef.current = false;
				return false;
			} finally {
				if (generation === connectionGenerationRef.current) {
					setIsInitializing(false);
				}
			}
		},
		// guard state lives in initGuardRef so this callback keeps a stable
		// identity — its churn re-fired the WalletBridge init effect
		[chain],
	);

	// -- Wallet destroy --
	const destroyWallet = useCallback(async () => {
		await teardownWallet("disconnected");
	}, [teardownWallet]);

	const disconnectExternalWallet = useCallback(async () => {
		if (connectionMode !== "external") return;
		await destroyWallet();
	}, [connectionMode, destroyWallet]);

	useEffect(() => () => void teardownWallet("disconnected"), [teardownWallet]);

	// -- Compose sync status with init state --
	const syncStatus = useMemo<SyncStatus>(() => {
		const completed = Object.values(syncTasks)
			.map(({ lastRunAt }) => lastRunAt)
			.filter((timestamp): timestamp is number => timestamp !== null);
		const taskError = Object.values(syncTasks).find(
			({ error }) => error !== null,
		)?.error;
		return {
			isSyncing:
				isInitializing || balanceSyncStatus.isSyncing || syncEngineActive,
			progress: null,
			lastSync:
				completed.length > 0
					? new Date(Math.max(...completed))
					: balanceSyncStatus.lastSync,
			error: initError ?? taskError ?? balanceSyncStatus.error,
		};
	}, [
		isInitializing,
		balanceSyncStatus,
		initError,
		syncEngineActive,
		syncTasks,
	]);

	const hasActiveSync =
		isInitializing || balanceSyncStatus.isSyncing || syncEngineActive;

	// -- Context value --
	const value = useMemo<WalletToolboxContextValue>(
		() => ({
			wallet,
			permissionsManager,
			services,
			connectionMode,
			connectionStatus,
			providerType,
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
			syncTasks,
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
			bsv21Tokens: bsv21Balances,
			legacyBalance,
			legacyFundingUtxos,
			isBalanceLoading: isBalanceLoading,
			balanceError: balanceError,
			exchangeRate,
			initializeWallet,
			connectExternalWallet,
			disconnectExternalWallet,
			destroyWallet,
			refreshBalance: refreshBalance,
		}),
		[
			wallet,
			permissionsManager,
			services,
			connectionMode,
			connectionStatus,
			providerType,
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
			syncTasks,
			syncWallet,
			syncEvents,
			clearSyncEvents,
			walletEvents,
			clearWalletEvents,
			hasActiveSync,
			oneSatContext,
			balance,
			ordinals,
			bsv21Balances,
			legacyBalance,
			legacyFundingUtxos,
			isBalanceLoading,
			balanceError,
			exchangeRate,
			initializeWallet,
			connectExternalWallet,
			disconnectExternalWallet,
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
} from "@bsv/wallet-toolbox-client";

export function useWalletToolbox() {
	const context = useContext(WalletToolboxContext);
	if (context === undefined) {
		throw new Error(
			"useWalletToolbox must be used within a WalletToolboxProvider",
		);
	}
	return context;
}
