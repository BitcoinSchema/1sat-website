"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import { WALLET_STORAGE_KEY } from "@/lib/constants";
import { deriveIdentityKey, findKeysFromMnemonic } from "@/lib/keys";
import { reportDiagnostic } from "@/lib/runtime-diagnostics";
import type { Keys } from "@/lib/types";
import {
	clearCachedEncryptionKey,
	loadEncryptedWallet,
	saveEncryptedWallet,
} from "@/lib/wallet-storage";

interface WalletContextType {
	hasWallet: boolean;
	isWalletLocked: boolean;
	isWalletInitialized: boolean;
	walletKeys: Keys | null;
	unlockWallet: (passphrase: string) => Promise<boolean>;
	lockWallet: () => void;
	createWallet: (mnemonic: string, passphrase: string) => Promise<boolean>;
	importWallet: (keys: Keys, passphrase: string) => Promise<boolean>;
	deleteWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const [hasWallet, setHasWallet] = useState(false);
	const [isWalletLocked, setIsWalletLocked] = useState(true);
	const [isWalletInitialized, setIsWalletInitialized] = useState(false);
	const [walletKeys, setWalletKeys] = useState<Keys | null>(null);

	useEffect(() => {
		const handleStorageChange = (event: StorageEvent) => {
			if (event.key === WALLET_STORAGE_KEY) {
				setHasWallet(!!event.newValue);
				if (!event.newValue) {
					setIsWalletLocked(false);
					setWalletKeys(null);
					clearCachedEncryptionKey();
				}
			}
		};
		window.addEventListener("storage", handleStorageChange);
		return () => window.removeEventListener("storage", handleStorageChange);
	}, []);

	// Load wallet on mount
	useEffect(() => {
		const encryptedWalletExists =
			typeof window !== "undefined" &&
			!!localStorage.getItem(WALLET_STORAGE_KEY);
		setHasWallet(encryptedWalletExists);

		if (!encryptedWalletExists) {
			clearCachedEncryptionKey();
			setWalletKeys(null);
			setIsWalletLocked(false);
		} else {
			setIsWalletLocked(true);
		}
		setIsWalletInitialized(true);
	}, []);

	const unlockWallet = useCallback(
		async (passphrase: string): Promise<boolean> => {
			try {
				const keys = await loadEncryptedWallet(passphrase);
				if (keys) {
					setWalletKeys(keys);
					setIsWalletLocked(false);
					return true;
				}
			} catch {
				reportDiagnostic({
					category: "action",
					code: "action.failed",
					operation: "wallet.unlock",
					recoverable: true,
					context: { retryable: true },
				});
			}
			return false;
		},
		[],
	);

	const lockWallet = useCallback(() => {
		setWalletKeys(null);
		setIsWalletLocked(true);
		clearCachedEncryptionKey();
		router.push("/");
	}, [router]);

	const createWallet = useCallback(
		async (mnemonic: string, passphrase: string): Promise<boolean> => {
			try {
				const keys = await findKeysFromMnemonic(mnemonic);
				const identityKey = deriveIdentityKey(keys.payPk, keys.ordPk);
				keys.identityPk = identityKey.toWif();
				keys.identityAddressPath = "derived";
				const success = await saveEncryptedWallet(keys, passphrase);
				if (success) {
					setWalletKeys(keys);
					setHasWallet(true);
					setIsWalletLocked(false);

					router.push("/wallet");
					return true;
				}
			} catch {
				reportDiagnostic({
					category: "action",
					code: "action.failed",
					operation: "wallet.create",
					recoverable: true,
					context: { retryable: true },
				});
			}
			return false;
		},
		[router],
	);

	const importWallet = useCallback(
		async (keys: Keys, passphrase: string): Promise<boolean> => {
			try {
				if (!keys.identityPk && keys.payPk && keys.ordPk) {
					const identityKey = deriveIdentityKey(keys.payPk, keys.ordPk);
					keys.identityPk = identityKey.toWif();
					keys.identityAddressPath = "derived";
				}
				const success = await saveEncryptedWallet(keys, passphrase);
				if (success) {
					setWalletKeys(keys);
					setHasWallet(true);
					setIsWalletLocked(false);

					router.push("/wallet");
					return true;
				}
			} catch {
				reportDiagnostic({
					category: "action",
					code: "action.failed",
					operation: "wallet.import",
					recoverable: true,
					context: { retryable: true },
				});
			}
			return false;
		},
		[router],
	);

	const deleteWallet = useCallback(() => {
		if (typeof window !== "undefined") {
			localStorage.removeItem(WALLET_STORAGE_KEY);
			window.dispatchEvent(
				new StorageEvent("storage", {
					key: WALLET_STORAGE_KEY,
					newValue: null,
				}),
			);
		}
		clearCachedEncryptionKey();
		setWalletKeys(null);
		setHasWallet(false);
		setIsWalletLocked(false);
	}, []);

	const value = useMemo(
		() => ({
			hasWallet,
			isWalletLocked,
			isWalletInitialized,
			walletKeys,
			unlockWallet,
			lockWallet,
			createWallet,
			importWallet,
			deleteWallet,
		}),
		[
			hasWallet,
			isWalletLocked,
			isWalletInitialized,
			walletKeys,
			unlockWallet,
			lockWallet,
			createWallet,
			importWallet,
			deleteWallet,
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
