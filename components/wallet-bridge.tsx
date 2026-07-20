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
	// Tracks the payPk an init attempt was made for. A failed attempt is NOT
	// retried for the same keys — unbounded retry here previously looped
	// forever when initialization failed consistently (e.g. storage endpoint
	// unreachable). The attempt resets only when the keys change or the
	// wallet locks.
	const initAttemptKeyRef = useRef<string | null>(null);
	const { hasWallet, isWalletLocked, walletKeys } = wallet;
	const { isInitialized, isInitializing, initializeWallet, destroyWallet } =
		toolbox;

	useEffect(() => {
		// Skip if already initialized or no keys available
		if (isInitialized || isInitializing) {
			return;
		}

		if (!hasWallet || isWalletLocked || !walletKeys?.payPk) {
			// Reset attempt tracking when wallet cannot be initialized.
			initAttemptKeyRef.current = null;
			return;
		}

		// One attempt per key set — success or failure
		if (initAttemptKeyRef.current === walletKeys.payPk) {
			return;
		}

		initAttemptKeyRef.current = walletKeys.payPk;

		// Initialize toolbox with keys from legacy wallet
		const initToolbox = async () => {
			try {
				const payPk = walletKeys?.payPk;
				if (!payPk) {
					console.warn("[WalletBridge] Missing payPk, skipping init");
					initAttemptKeyRef.current = null;
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
					// Do NOT reset the attempt key — the provider surfaces
					// initError; retry happens on lock/unlock or key change.
					console.error("[WalletBridge] Wallet-toolbox initialization failed");
				}
			} catch (error) {
				console.error(
					"[WalletBridge] Error initializing wallet-toolbox:",
					error,
				);
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
			initAttemptKeyRef.current = null;
		}
	}, [hasWallet, isWalletLocked, walletKeys, isInitialized, destroyWallet]);

	return <>{children}</>;
}
