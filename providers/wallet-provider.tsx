"use client";

import { useRouter } from "next/navigation";

import * as React from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
} from "react";
import { useExchangeRate } from "@/hooks/use-exchange-rate";
import { WALLET_STORAGE_KEY } from "@/lib/constants";
import { findKeysFromMnemonic } from "@/lib/keys";
import type { Keys } from "@/lib/types";
import type {
	UTXO,
	WalletBalance,
	WalletTransaction,
} from "@/lib/wallet/types";
import { WalletService } from "@/lib/wallet/wallet-service";
import {
	clearSessionKeys,
	loadEncryptedWallet,
	loadSessionKeys,
	saveEncryptedWallet,
	saveSessionKeys,
} from "@/lib/wallet-storage";

interface WalletContextType {
	hasWallet: boolean;
	isWalletLocked: boolean;
	isWalletInitialized: boolean;
	isSyncing: boolean;
	walletKeys: Keys | null;
	walletService: WalletService | null;
	balance: WalletBalance | null;
	exchangeRate: number | null;
	transactions: WalletTransaction[];
	utxos: UTXO[];
	unlockWallet: (passphrase: string) => Promise<boolean>;
	lockWallet: () => void;
	createWallet: (mnemonic: string, passphrase: string) => Promise<boolean>;
	importWallet: (keys: Keys, passphrase: string) => Promise<boolean>;
	deleteWallet: () => void;
	refreshBalance: () => Promise<void>;
	syncWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
	const router = useRouter();
	const { rate: exchangeRate } = useExchangeRate();
	const [hasWallet, setHasWallet] = useState(false);
	const [isWalletLocked, setIsWalletLocked] = useState(true);
	const [isWalletInitialized, setIsWalletInitialized] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const [walletKeys, setWalletKeys] = useState<Keys | null>(null);
	const [walletService, setWalletService] = useState<WalletService | null>(
		null,
	);
	const [balance, setBalance] = useState<WalletBalance | null>(null);
	const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
	const [utxos, setUTXOs] = useState<UTXO[]>([]);

	useEffect(() => {
		const handleStorageChange = (event: StorageEvent) => {
			if (event.key === WALLET_STORAGE_KEY) {
				setHasWallet(!!event.newValue);
				if (!event.newValue) {
					setIsWalletLocked(true);
					setWalletKeys(null);
				}
			}
		};
		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, []);

	// Helper to refresh wallet data
	const refreshWalletData = useCallback(async (service: WalletService) => {
		try {
			const [newBalance, newTransactions, newUTXOs] = await Promise.all([
				service.getBalance(),
				service.getTransactionHistory(),
				service.getUTXOs(),
			]);
			setBalance(newBalance);
			setTransactions(newTransactions);
			setUTXOs(newUTXOs);
		} catch (error) {
			console.error("Error refreshing wallet data:", error);
		}
	}, []);

	// Load wallet on mount
	useEffect(() => {
		// Check if an encrypted wallet exists in localStorage
		const encryptedWalletExists =
			typeof window !== "undefined" &&
			!!localStorage.getItem(WALLET_STORAGE_KEY);
		setHasWallet(encryptedWalletExists);

		// Check if keys are in session storage (auto-unlock)
		const sessionKeys = loadSessionKeys();
		if (sessionKeys.payPk && sessionKeys.ordPk) {
			const keys: Keys = {
				payPk: sessionKeys.payPk,
				ordPk: sessionKeys.ordPk,
				mnemonic: "", // Mnemonic might not be in session, but PKs are enough for most ops
			};
			setWalletKeys(keys);
			setIsWalletLocked(false);
			setIsSyncing(true);

			const service = new WalletService();
			service.initialize(keys).then(() => {
				setWalletService(service);
				refreshWalletData(service).then(() => {
					setIsSyncing(false);
				});
			});
		} else {
			setIsWalletLocked(encryptedWalletExists); // If it exists and not in session, it starts locked
		}
		setIsWalletInitialized(true);
	}, [refreshWalletData]);

	const unlockWallet = useCallback(
		async (passphrase: string): Promise<boolean> => {
			try {
				const keys = await loadEncryptedWallet(passphrase);
				if (keys) {
					setWalletKeys(keys);
					setIsWalletLocked(false);
					setIsSyncing(true);

					// Initialize wallet service
					const service = new WalletService();
					await service.initialize(keys);
					setWalletService(service);

					// Load wallet data
					await refreshWalletData(service);
					setIsSyncing(false);

					// Save to session storage
					saveSessionKeys(keys.payPk, keys.ordPk);

					return true;
				}
			} catch (error) {
				console.error("Unlock failed:", error);
				setIsSyncing(false);
			}
			return false;
		},
		[refreshWalletData],
	);
	const lockWallet = useCallback(async () => {
		// Close wallet service
		if (walletService) {
			await walletService.close();
			setWalletService(null);
		}

		setWalletKeys(null);
		setIsWalletLocked(true);
		setBalance(null);
		setTransactions([]);
		setUTXOs([]);

		clearSessionKeys();

		// Optionally redirect to home or lock screen
		router.push("/");
	}, [router, walletService]);

	const createWallet = useCallback(
		async (mnemonic: string, passphrase: string): Promise<boolean> => {
			try {
				const keys = await findKeysFromMnemonic(mnemonic); // Use findKeysFromMnemonic to derive paths
				const success = await saveEncryptedWallet(keys, passphrase);
				if (success) {
					setWalletKeys(keys);
					setHasWallet(true);
					setIsWalletLocked(false);
					setIsSyncing(true);

					// Initialize wallet service
					const service = new WalletService();
					await service.initialize(keys);
					setWalletService(service);

					// Load initial wallet data
					await refreshWalletData(service);
					setIsSyncing(false);

					// Save to session storage
					saveSessionKeys(keys.payPk, keys.ordPk);

					router.push("/wallet");
					return true;
				}
			} catch (error) {
				console.error("Create wallet failed:", error);
				setIsSyncing(false);
			}
			return false;
		},
		[router, refreshWalletData],
	);

	const importWallet = useCallback(
		async (keys: Keys, passphrase: string): Promise<boolean> => {
			try {
				const success = await saveEncryptedWallet(keys, passphrase);
				if (success) {
					setWalletKeys(keys);
					setHasWallet(true);
					setIsWalletLocked(false);
					setIsSyncing(true);

					// Initialize wallet service
					const service = new WalletService();
					await service.initialize(keys);
					setWalletService(service);

					// Load initial wallet data
					await refreshWalletData(service);
					setIsSyncing(false);

					// Save to session storage
					saveSessionKeys(keys.payPk, keys.ordPk);

					router.push("/wallet");
					return true;
				}
			} catch (error) {
				console.error("Import wallet failed:", error);
				setIsSyncing(false);
			}
			return false;
		},
		[router, refreshWalletData],
	);

	const deleteWallet = useCallback(async () => {
		if (typeof window !== "undefined") {
			localStorage.removeItem(WALLET_STORAGE_KEY);
			window.dispatchEvent(
				new StorageEvent("storage", {
					key: WALLET_STORAGE_KEY,
					newValue: null,
				}),
			);
		}

		clearSessionKeys();

		// Close wallet service
		if (walletService) {
			await walletService.close();
			setWalletService(null);
		}

		setWalletKeys(null);
		setHasWallet(false);
		setIsWalletLocked(false); // Technically not locked if it doesn't exist, or irrelevant
		setBalance(null);
		setTransactions([]);
		setUTXOs([]);

		router.push("/");
	}, [router, walletService]);

	// Refresh balance
	const refreshBalance = useCallback(async () => {
		if (walletService) {
			try {
				const newBalance = await walletService.getBalance();
				setBalance(newBalance);
			} catch (error) {
				console.error("Error refreshing balance:", error);
			}
		}
	}, [walletService]);

	// Sync wallet with blockchain
	const syncWallet = useCallback(async () => {
		if (walletService) {
			setIsSyncing(true);
			try {
				await walletService.sync();
				await refreshWalletData(walletService);
			} catch (error) {
				console.error("Error syncing wallet:", error);
			} finally {
				setIsSyncing(false);
			}
		}
	}, [walletService, refreshWalletData]);

	const value = React.useMemo(
		() => ({
			hasWallet,
			isWalletLocked,
			isWalletInitialized,
			isSyncing,
			walletKeys,
			walletService,
			balance,
			exchangeRate,
			transactions,
			utxos,
			unlockWallet,
			lockWallet,
			createWallet,
			importWallet,
			deleteWallet,
			refreshBalance,
			syncWallet,
		}),
		[
			hasWallet,
			isWalletLocked,
			isWalletInitialized,
			isSyncing,
			walletKeys,
			walletService,
			balance,
			exchangeRate,
			transactions,
			utxos,
			unlockWallet,
			lockWallet,
			createWallet,
			importWallet,
			deleteWallet,
			refreshBalance,
			syncWallet,
		],
	);

	return (
		<WalletContext.Provider value={value}>{children}</WalletContext.Provider>
	);
}

export function useWallet() {
	const context = useContext(WalletContext);
	if (context === undefined) {
		throw new Error("useWallet must be used within a WalletProvider");
	}
	return context;
}
