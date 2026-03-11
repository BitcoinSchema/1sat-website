"use client";

import {
	type AddressManager,
	type OneSatServices,
	type RemoteWalletResult,
} from "@1sat/wallet-remote";
import { syncAddresses, createContext as createActionContext } from "@1sat/actions";
import { RECEIVE_ADDRESS_PREFIX } from "@/lib/receive-address-manager";
import { useCallback, useEffect, useRef, useState } from "react";

type Wallet = RemoteWalletResult["wallet"];

interface UseSyncEngineOptions {
	isInitialized: boolean;
	wallet: Wallet | null;
	services: OneSatServices | null;
	identityKey: string | null;
	chain: "main" | "test";
	addressManagerReady: boolean;
	addressManagerRef: React.RefObject<AddressManager | null>;
	syncRevision: number;
	onQueuedOutpoint: (outpoint: string, score: number) => void;
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
	onQueuedOutpoint,
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
			const result = await syncAddresses.execute(ctx, {
				prefix: RECEIVE_ADDRESS_PREFIX,
				count,
			});

			if (!abortRef.current) {
				console.log(
					`[WalletToolbox][Sync] complete: processed=${result.processed} failed=${result.failed}`,
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
		chain,
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
