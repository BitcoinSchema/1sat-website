"use client";

import {
	createContext as createActionContext,
	syncAddresses,
	syncCosignDeliveries,
	syncMessages,
} from "@1sat/actions";
import type { AddressManager, OneSatServices } from "@1sat/wallet-browser";
import type { WalletInterface } from "@bsv/sdk";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RECEIVE_ADDRESS_PREFIX } from "@/lib/receive-address-manager";

export type SyncTaskName = "addresses" | "payments" | "cosignDeliveries";
export type SyncTaskStatus =
	| "idle"
	| "running"
	| "succeeded"
	| "failed"
	| "provider-managed";

export interface SyncTaskState {
	status: SyncTaskStatus;
	lastRunAt: number | null;
	processed: number | null;
	failed: number | null;
	error: string | null;
}

export type SyncTasksState = Record<SyncTaskName, SyncTaskState>;

interface SyncTaskResult {
	processed: number;
	failed: number;
}

type SyncJobs = Record<SyncTaskName, () => Promise<SyncTaskResult>>;

const TASK_NAMES: SyncTaskName[] = [
	"addresses",
	"payments",
	"cosignDeliveries",
];

export function createSyncTasksState(
	status: SyncTaskStatus = "idle",
): SyncTasksState {
	return Object.fromEntries(
		TASK_NAMES.map((name) => [
			name,
			{
				status,
				lastRunAt: null,
				processed: null,
				failed: null,
				error: null,
			},
		]),
	) as SyncTasksState;
}

export function shouldRunOwnedSync(input: {
	isInitialized: boolean;
	ownedByWebsite: boolean;
	isVisible: boolean;
	hasWallet: boolean;
	hasServices: boolean;
	hasIdentity: boolean;
	hasAddressManager: boolean;
}): boolean {
	return Object.values(input).every(Boolean);
}

export interface SyncCoordinator {
	run: (jobs: SyncJobs) => { promise: Promise<boolean>; started: boolean };
	reset: (status?: SyncTaskStatus) => void;
	stop: () => Promise<void>;
}

/** Coordinates the three upstream one-shot actions without overlapping runs. */
export function createSyncCoordinator(
	onChange: (state: SyncTasksState) => void,
	now: () => number = Date.now,
): SyncCoordinator {
	let state = createSyncTasksState();
	let generation = 0;
	let active: Promise<boolean> | null = null;

	const emit = (next: SyncTasksState) => {
		state = next;
		onChange(next);
	};

	const update = (name: SyncTaskName, task: SyncTaskState) => {
		emit({ ...state, [name]: task });
	};

	return {
		run(jobs) {
			if (active) return { promise: active, started: false };

			const runGeneration = generation;
			active = (async () => {
				for (const name of TASK_NAMES) {
					if (runGeneration !== generation) return false;
					update(name, { ...state[name], status: "running", error: null });
					try {
						const result = await jobs[name]();
						if (runGeneration !== generation) return false;
						update(name, {
							status: result.failed > 0 ? "failed" : "succeeded",
							lastRunAt: now(),
							processed: result.processed,
							failed: result.failed,
							error:
								result.failed > 0
									? `${result.failed} item${result.failed === 1 ? "" : "s"} failed`
									: null,
						});
					} catch {
						if (runGeneration !== generation) return false;
						update(name, {
							status: "failed",
							lastRunAt: now(),
							processed: null,
							failed: null,
							error: "Sync task failed. Try again.",
						});
					}
				}
				return runGeneration === generation;
			})();
			const startedPromise = active;
			void startedPromise.finally(() => {
				if (active === startedPromise) active = null;
			});
			return { promise: startedPromise, started: true };
		},
		reset(status = "idle") {
			generation += 1;
			emit(createSyncTasksState(status));
		},
		async stop() {
			generation += 1;
			const pending = active;
			if (pending) await pending;
			if (active === pending) active = null;
		},
	};
}

interface UseSyncEngineOptions {
	isInitialized: boolean;
	ownedByWebsite: boolean;
	wallet: WalletInterface | null;
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
	syncTasks: SyncTasksState;
	syncWallet: () => void;
	stopSyncWorkers: () => Promise<void>;
}

export function useSyncEngine({
	isInitialized,
	ownedByWebsite,
	wallet,
	services,
	identityKey,
	chain,
	addressManagerReady,
	addressManagerRef,
	syncRevision,
	refreshBalance,
}: UseSyncEngineOptions): SyncEngineResult {
	const [syncTasks, setSyncTasks] = useState(createSyncTasksState);
	const [isVisible, setIsVisible] = useState(
		typeof document === "undefined" || document.visibilityState !== "hidden",
	);
	const coordinatorRef = useRef<SyncCoordinator | null>(null);
	if (!coordinatorRef.current) {
		coordinatorRef.current = createSyncCoordinator(setSyncTasks);
	}
	const coordinator = coordinatorRef.current;

	const canRun = shouldRunOwnedSync({
		isInitialized,
		ownedByWebsite,
		isVisible,
		hasWallet: !!wallet,
		hasServices: !!services,
		hasIdentity: !!identityKey,
		hasAddressManager: addressManagerReady && !!addressManagerRef.current,
	});

	const runSync = useCallback(() => {
		const addressManager = addressManagerRef.current;
		if (!canRun || !wallet || !services || !identityKey || !addressManager) {
			return;
		}

		const ctx = createActionContext(wallet, { chain, services });
		const count = addressManager.getAddresses().length || 5;
		const { promise, started } = coordinator.run({
			addresses: () =>
				syncAddresses.execute(ctx, {
					prefix: RECEIVE_ADDRESS_PREFIX,
					count,
				}),
			payments: () => syncMessages.execute(ctx, {}),
			cosignDeliveries: () => syncCosignDeliveries.execute(ctx, {}),
		});

		if (started) {
			void promise.then((isCurrentIdentity) => {
				if (isCurrentIdentity) refreshBalance();
			});
		}
	}, [
		addressManagerRef,
		canRun,
		wallet,
		services,
		identityKey,
		chain,
		coordinator,
		refreshBalance,
	]);

	useEffect(() => {
		const onVisibilityChange = () =>
			setIsVisible(document.visibilityState !== "hidden");
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () =>
			document.removeEventListener("visibilitychange", onVisibilityChange);
	}, []);

	useEffect(() => {
		coordinator.reset(
			isInitialized && identityKey && !ownedByWebsite
				? "provider-managed"
				: "idle",
		);
	}, [coordinator, identityKey, isInitialized, ownedByWebsite]);

	useEffect(() => {
		if (!canRun) return;
		void syncRevision;
		runSync();
	}, [canRun, runSync, syncRevision]);

	const stopSyncWorkers = useCallback(() => coordinator.stop(), [coordinator]);

	const syncWallet = useCallback(() => {
		refreshBalance();
		runSync();
	}, [runSync, refreshBalance]);

	const syncEngineActive = useMemo(
		() => TASK_NAMES.some((name) => syncTasks[name].status === "running"),
		[syncTasks],
	);

	return {
		syncEngineActive,
		syncTasks,
		syncWallet,
		stopSyncWorkers,
	};
}
