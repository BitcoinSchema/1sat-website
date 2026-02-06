"use client";

import {
	type AddressManager,
	AddressSyncFetcher,
	AddressSyncProcessor,
	AddressSyncQueueIdb,
	type OneSatServices,
	type WebWalletResult,
} from "@1sat/wallet-browser";
import { useCallback, useEffect, useRef, useState } from "react";

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
	const syncQueueRef = useRef<AddressSyncQueueIdb | null>(null);
	const syncFetcherRef = useRef<AddressSyncFetcher | null>(null);
	const syncProcessorRef = useRef<AddressSyncProcessor | null>(null);
	const [syncEngineActive, setSyncEngineActive] = useState(false);

	const stopSyncWorkers = useCallback(async () => {
		syncFetcherRef.current?.stop();
		syncFetcherRef.current = null;

		syncProcessorRef.current?.stop();
		syncProcessorRef.current = null;

		if (syncQueueRef.current) {
			await syncQueueRef.current.close().catch(() => {
				// No-op cleanup failure.
			});
			syncQueueRef.current = null;
		}
		setSyncEngineActive(false);
	}, []);

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
			`[WalletToolbox][Sync] starting workers (revision=${syncRevision})`,
		);

		let cancelled = false;

		const startSyncWorkers = async () => {
			try {
				syncFetcherRef.current?.stop();
				syncProcessorRef.current?.stop();

				if (!syncQueueRef.current) {
					syncQueueRef.current = new AddressSyncQueueIdb(
						`${chain}:${identityKey}`,
					);
				}
				const syncQueue = syncQueueRef.current;
				const addressManager = addressManagerRef.current;
				if (!syncQueue || !addressManager) {
					return;
				}

				const fetcher = new AddressSyncFetcher({
					services,
					syncQueue,
					addressManager,
				});
				const processor = new AddressSyncProcessor({
					wallet,
					services,
					syncQueue,
					addressManager,
					network: chain === "main" ? "mainnet" : "testnet",
				});

				fetcher.on("fetch:queued", ({ outpoint, score }) => {
					void onQueuedOutpoint(outpoint, score);
				});
				fetcher.on("fetch:error", ({ message }) => {
					console.error("[WalletToolbox][SyncFetcher]", message);
				});

				processor.on("process:progress", ({ pending, done, failed }) => {
					console.log(
						`[WalletToolbox][SyncProcessor] pending=${pending} done=${done} failed=${failed}`,
					);
					refreshBalance();
				});
				processor.on("process:complete", () => {
					console.log("[WalletToolbox][SyncProcessor] complete");
					refreshBalance();
				});
				processor.on("process:error", ({ message }) => {
					console.error("[WalletToolbox][SyncProcessor]", message);
				});

				syncFetcherRef.current = fetcher;
				syncProcessorRef.current = processor;
				setSyncEngineActive(true);

				void processor.start().catch((error) => {
					console.error("[WalletToolbox] Processor failed to start:", error);
				});

				const height = await services.chaintracks.currentHeight();
				if (!cancelled) {
					void fetcher.fetch(height).catch((error) => {
						console.error("[WalletToolbox] Fetcher failed:", error);
					});
				}
			} catch (error) {
				console.error("[WalletToolbox] Failed to start sync workers:", error);
			}
		};

		void startSyncWorkers();

		return () => {
			cancelled = true;
			syncFetcherRef.current?.stop();
			syncFetcherRef.current = null;
			syncProcessorRef.current?.stop();
			syncProcessorRef.current = null;
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
		onQueuedOutpoint,
		refreshBalance,
		syncRevision,
	]);

	const syncWallet = useCallback(() => {
		refreshBalance();
		if (!services || !syncFetcherRef.current) return;
		void services.chaintracks
			.currentHeight()
			.then((height) => syncFetcherRef.current?.fetch(height))
			.catch((error) => {
				console.error("[WalletToolbox] Manual sync failed:", error);
			});
	}, [services, refreshBalance]);

	return {
		syncEngineActive,
		syncWallet,
		stopSyncWorkers,
	};
}
