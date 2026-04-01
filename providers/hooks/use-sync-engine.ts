"use client";

import {
	type AddressManager,
	type OneSatServices,
	type WebWalletResult,
} from "@1sat/wallet-browser";
import { syncAddresses, syncMessages, createContext as createActionContext } from "@1sat/actions";
import { RECEIVE_ADDRESS_PREFIX } from "@/lib/receive-address-manager";
import { useCallback, useEffect, useRef, useState } from "react";
import { RECEIVE_ADDRESS_PREFIX } from "@/lib/receive-address-manager";

type Wallet = WebWalletResult["wallet"];

interface UseSyncEngineOptions {
	isInitialized: boolean;
	wallet: Wallet | null;
	services: OneSatServices | null;
	identityKey: string | null;
	chain: "main" | "test";
	addressManagerReady: boolean;
	addressManagerRef: React.RefObject<AddressManager | null>;
	syncRevision: number;
	refreshBalance: () => void;
}

export interface SyncEngineResult {
	syncEngineActive: boolean;
	syncWallet: () => void;
	stopSyncWorkers: () => Promise<void>;
}

export function useSyncEngine({
	isInitialized,
	wallet,
	services,
	identityKey,
	chain,
	addressManagerReady,
	addressManagerRef,
	syncRevision,
	refreshBalance,
}: UseSyncEngineOptions): SyncEngineResult {
	const [syncEngineActive, setSyncEngineActive] = useState(false);
	const abortRef = useRef(false);

	const stopSyncWorkers = useCallback(async () => {
		abortRef.current = true;
		setSyncEngineActive(false);
	}, []);

	const runSync = useCallback(async () => {
		if (!wallet || !services) return;

		const addressManager = addressManagerRef.current;
		if (!addressManager) return;

		const count = addressManager.getAddresses().length || 5;

		const ctx = createActionContext(wallet, { chain, services });
		setSyncEngineActive(true);
		abortRef.current = false;

		try {
			// Sync message box payments (paymail) and address deposits in parallel
			const [msgResult, addrResult] = await Promise.all([
				syncMessages.execute(ctx, {}).catch((err) => {
					console.error("[WalletToolbox][MsgSync] failed:", err);
					return { processed: 0, failed: 0 };
				}),
				syncAddresses.execute(ctx, {
					prefix: RECEIVE_ADDRESS_PREFIX,
					count,
				}),
			]);

			if (!abortRef.current) {
				console.log(
					`[WalletToolbox][Sync] complete: addresses=${addrResult.processed}/${addrResult.failed} messages=${msgResult.processed}/${msgResult.failed}`,
				);
				refreshBalance();
			}
		} catch (error) {
			if (!abortRef.current) {
				console.error("[WalletToolbox][Sync] failed:", error);
			}
		} finally {
			if (!abortRef.current) {
				setSyncEngineActive(false);
			}
		}
	}, [wallet, services, chain, addressManagerRef, refreshBalance]);

	useEffect(() => {
		if (
			!isInitialized ||
			!wallet ||
			!services ||
			!identityKey ||
			!addressManagerReady ||
			!addressManagerRef.current
		) {
			return;
		}

		console.log(
			`[WalletToolbox][Sync] starting sync (revision=${syncRevision})`,
		);

		abortRef.current = false;
		void runSync();

		return () => {
			abortRef.current = true;
			setSyncEngineActive(false);
		};
	}, [
		isInitialized,
		wallet,
		services,
		identityKey,
		addressManagerReady,
		addressManagerRef,
		syncRevision,
		runSync,
	]);

	const syncWallet = useCallback(() => {
		refreshBalance();
		void runSync();
	}, [runSync, refreshBalance]);

	return {
		syncEngineActive,
		syncWallet,
		stopSyncWorkers,
	};
}
