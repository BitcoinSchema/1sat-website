"use client";

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useSyncExternalStore,
} from "react";
import {
	clearDiagnostics,
	getDiagnosticEvents,
	getServerDiagnosticEvents,
	reportDiagnostic,
	subscribeDiagnostics,
} from "@/lib/runtime-diagnostics";
import type {
	SyncEvent,
	WalletEvent,
} from "@/providers/wallet-toolbox-provider";

const EMPTY_WALLET_EVENTS: WalletEvent[] = [];

interface WalletDiagnosticState {
	connectionStatus: string;
	connectionMode: string;
	providerType: string | null;
	isInitialized: boolean;
	initFailed: boolean;
}

export interface WalletDiagnosticsResult {
	syncEvents: SyncEvent[];
	clearSyncEvents: () => void;
	walletEvents: WalletEvent[];
	clearWalletEvents: () => void;
}

export function useWalletDiagnostics(
	state?: WalletDiagnosticState,
): WalletDiagnosticsResult {
	const diagnosticEvents = useSyncExternalStore(
		subscribeDiagnostics,
		getDiagnosticEvents,
		getServerDiagnosticEvents,
	);
	const previousState = useRef<string | null>(null);
	const previousFailure = useRef(false);

	useEffect(() => {
		if (!state) return;
		const serialized = [
			state.connectionStatus,
			state.connectionMode,
			state.providerType,
			state.isInitialized,
		].join(":");
		if (serialized !== previousState.current) {
			previousState.current = serialized;
			reportDiagnostic({
				category: "provider",
				code: "provider.state",
				operation: "wallet.lifecycle",
				recoverable: true,
				context: {
					status: state.connectionStatus,
					mode: state.connectionMode,
					provider: state.providerType,
				},
			});
		}
		if (state.initFailed && !previousFailure.current) {
			reportDiagnostic({
				category: "provider",
				code: "provider.failed",
				operation: "wallet.initialize",
				recoverable: true,
				context: { status: state.connectionStatus, retryable: true },
			});
		}
		previousFailure.current = state.initFailed;
	}, [state]);

	const syncEvents = useMemo<SyncEvent[]>(
		() =>
			diagnosticEvents.map((event) => ({
				id: event.id,
				timestamp: event.timestamp,
				level:
					event.level === "info"
						? "log"
						: event.level === "warning"
							? "warn"
							: "error",
				source: event.category,
				message: event.message,
				correlationId: event.correlationId,
				category: event.category,
				code: event.code,
				operation: event.operation,
				recoverable: event.recoverable,
				context: event.context,
			})),
		[diagnosticEvents],
	);

	const clearSyncEvents = useCallback(() => clearDiagnostics(), []);
	const clearWalletEvents = useCallback(() => undefined, []);

	return {
		syncEvents,
		clearSyncEvents,
		walletEvents: EMPTY_WALLET_EVENTS,
		clearWalletEvents,
	};
}
