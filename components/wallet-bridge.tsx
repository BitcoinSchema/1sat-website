"use client";

/**
 * Wallet Bridge Component
 *
 * This component bridges the legacy wallet provider with the new wallet-toolbox provider.
 * It auto-initializes the toolbox wallet when legacy wallet keys become available.
 */

import { useEffect, useRef } from "react";
import { wifToRootKeyHex } from "@/lib/keys";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

export function WalletBridge({ children }: { children: React.ReactNode }) {
	const wallet = useWallet();
	const toolbox = useWalletToolbox();
	const initAttemptedRef = useRef(false);
	const { hasWallet, isWalletLocked, walletKeys } = wallet;
	const { isInitialized, isInitializing, initializeWallet, destroyWallet } =
		toolbox;

	useEffect(() => {
		// Skip if already initialized or no keys available
		if (isInitialized || isInitializing) {
			return;
		}

		if (!hasWallet || isWalletLocked || !walletKeys?.payPk) {
			// Reset attempt flag when wallet cannot be initialized.
			initAttemptedRef.current = false;
			return;
		}

		// Prevent multiple init attempts
		if (initAttemptedRef.current) {
			return;
		}

		initAttemptedRef.current = true;

		// Initialize toolbox with keys from legacy wallet
		const initToolbox = async () => {
			try {
				const payPk = walletKeys?.payPk;
				if (!payPk) {
					console.warn("[WalletBridge] Missing payPk, skipping init");
					initAttemptedRef.current = false;
					return;
				}

				// Prefer identity key as BRC-100 root, fall back to pay key for legacy wallets
				const identityPk = walletKeys?.identityPk;
				const rootWif = identityPk || payPk;
				const rootKeyHex = wifToRootKeyHex(rootWif);

				console.log("[WalletBridge] Auto-initializing wallet-toolbox...");
				console.log("[WalletBridge] Using identity key:", !!identityPk);
				console.log("[WalletBridge] rootKeyHex length:", rootKeyHex.length);

				const success = await initializeWallet(rootKeyHex);

				if (success) {
					console.log("[WalletBridge] Wallet-toolbox initialized successfully");
				} else {
					console.error("[WalletBridge] Wallet-toolbox initialization failed");
					initAttemptedRef.current = false;
				}
			} catch (error) {
				console.error(
					"[WalletBridge] Error initializing wallet-toolbox:",
					error,
				);
				initAttemptedRef.current = false;
			}
		};

		initToolbox();
	}, [
		hasWallet,
		isWalletLocked,
		walletKeys,
		isInitialized,
		isInitializing,
		initializeWallet,
	]);

	// Clean up toolbox when the source wallet is unavailable.
	useEffect(() => {
		const shouldDestroy = !hasWallet || isWalletLocked || !walletKeys?.payPk;
		if (shouldDestroy && isInitialized) {
			console.log("[WalletBridge] Wallet unavailable, destroying toolbox...");
			void destroyWallet();
			initAttemptedRef.current = false;
		}
	}, [hasWallet, isWalletLocked, walletKeys, isInitialized, destroyWallet]);

	return <>{children}</>;
}
