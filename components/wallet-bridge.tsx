"use client";

/**
 * Wallet Bridge Component
 *
 * This component bridges the legacy wallet provider with the new wallet-toolbox provider.
 * It auto-initializes the toolbox wallet when legacy wallet keys become available.
 */

import { useEffect, useRef } from "react";
import { wifToAddress, wifToRootKeyHex } from "@/lib/keys";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

export function WalletBridge({ children }: { children: React.ReactNode }) {
	const wallet = useWallet();
	const toolbox = useWalletToolbox();
	const initAttemptedRef = useRef(false);

	useEffect(() => {
		// Skip if already initialized or no keys available
		if (toolbox.isInitialized || toolbox.isInitializing) {
			return;
		}

		if (wallet.isWalletLocked || !wallet.walletKeys?.payPk) {
			// Reset attempt flag when wallet is locked
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
				const payPk = wallet.walletKeys?.payPk;
				if (!payPk) {
					console.warn("[WalletBridge] Missing payPk, skipping init");
					initAttemptedRef.current = false;
					return;
				}

				const rootKeyHex = wifToRootKeyHex(payPk);
				const ordPk = wallet.walletKeys?.ordPk;
				const ordAddress = ordPk ? wifToAddress(ordPk) : undefined;
				const payAddress = wifToAddress(payPk);

				console.log("[WalletBridge] Auto-initializing wallet-toolbox...");
				console.log("[WalletBridge] rootKeyHex length:", rootKeyHex.length);
				console.log(
					"[WalletBridge] ordAddress:",
					`${ordAddress?.slice(0, 10)}...`,
				);
				console.log(
					"[WalletBridge] payAddress:",
					`${payAddress?.slice(0, 10)}...`,
				);

				const success = await toolbox.initializeWallet(
					rootKeyHex,
					ordAddress,
					payAddress,
				);

				if (success) {
					console.log("[WalletBridge] Wallet-toolbox initialized successfully");
				} else {
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
		wallet.isWalletLocked,
		wallet.walletKeys,
		toolbox.isInitialized,
		toolbox.isInitializing,
		toolbox.initializeWallet,
	]);

	// Clean up toolbox when wallet is locked
	useEffect(() => {
		if (wallet.isWalletLocked && toolbox.isInitialized) {
			console.log("[WalletBridge] Wallet locked, destroying toolbox...");
			toolbox.destroyWallet();
			initAttemptedRef.current = false;
		}
	}, [wallet.isWalletLocked, toolbox.isInitialized, toolbox.destroyWallet]);

	return <>{children}</>;
}
