"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
	SyncEvent,
	WalletEvent,
} from "@/providers/wallet-toolbox-provider";

type SyncEventLevel = "log" | "warn" | "error";

const SYNC_EVENT_LIMIT = 500;

const WALLET_LOG_PATTERNS = [
	/\[WalletBridge\]/,
	/\[WalletToolbox\]/,
	/\[createWebWallet\]/,
	/\[GorillaPool\]/,
	/\[ChaintracksClient\]/,
	/\[Receive\]/,
	/\bTaskNewHeader\b/,
	/\bTaskMonitor[A-Za-z]+\b/,
];

const stringifyConsoleArg = (arg: unknown): string => {
	if (typeof arg === "string") return arg;
	if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
	if (typeof arg === "bigint") return `${arg.toString()}n`;
	if (arg === undefined) return "undefined";
	if (arg === null) return "null";
	if (typeof arg === "object") {
		try {
			return JSON.stringify(arg);
		} catch {
			return String(arg);
		}
	}
	return String(arg);
};

const serializeConsoleArgs = (args: unknown[]): string =>
	args
		.map((arg) => stringifyConsoleArg(arg))
		.join(" ")
		.trim();

const trimLogMessage = (message: string, maxLength = 1200): string => {
	if (message.length <= maxLength) return message;
	return `${message.slice(0, maxLength)}...`;
};

const shouldCaptureWalletLog = (message: string): boolean =>
	WALLET_LOG_PATTERNS.some((pattern) => pattern.test(message));

const detectWalletLogSource = (message: string): string => {
	const bracketSource = message.match(/\[([^[\]]+)\]/)?.[1];
	if (bracketSource) return bracketSource;
	if (message.includes("TaskNewHeader")) return "TaskNewHeader";
	if (message.includes("TaskMonitorCallHistory")) {
		return "TaskMonitorCallHistory";
	}
	if (message.includes("TaskMonitor")) return "TaskMonitor";
	return "Wallet";
};

export interface WalletDiagnosticsResult {
	syncEvents: SyncEvent[];
	clearSyncEvents: () => void;
	walletEvents: WalletEvent[];
	clearWalletEvents: () => void;
}

export function useWalletDiagnostics(): WalletDiagnosticsResult {
	const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([]);
	const syncEventIdRef = useRef(0);
	const [walletEvents, setWalletEvents] = useState<WalletEvent[]>([]);

	const appendSyncEvent = useCallback(
		(level: SyncEventLevel, source: string, message: string) => {
			setSyncEvents((prev) => {
				const next = [
					...prev,
					{
						id: ++syncEventIdRef.current,
						timestamp: Date.now(),
						level,
						source,
						message: trimLogMessage(message),
					},
				];
				if (next.length <= SYNC_EVENT_LIMIT) return next;
				return next.slice(next.length - SYNC_EVENT_LIMIT);
			});
		},
		[],
	);

	const clearSyncEvents = useCallback(() => {
		setSyncEvents([]);
	}, []);

	const clearWalletEvents = useCallback(() => {
		setWalletEvents([]);
	}, []);

	// Console interception effect
	useEffect(() => {
		type ConsoleMethod = (...data: unknown[]) => void;

		const originalLog = console.log.bind(console) as ConsoleMethod;
		const originalWarn = console.warn.bind(console) as ConsoleMethod;
		const originalError = console.error.bind(console) as ConsoleMethod;

		const createCapturedMethod =
			(level: SyncEventLevel, originalMethod: ConsoleMethod): ConsoleMethod =>
			(...args: unknown[]) => {
				originalMethod(...args);
				const message = serializeConsoleArgs(args);
				if (!message || !shouldCaptureWalletLog(message)) return;
				appendSyncEvent(level, detectWalletLogSource(message), message);
			};

		console.log = createCapturedMethod(
			"log",
			originalLog,
		) as typeof console.log;
		console.warn = createCapturedMethod(
			"warn",
			originalWarn,
		) as typeof console.warn;
		console.error = createCapturedMethod(
			"error",
			originalError,
		) as typeof console.error;

		return () => {
			console.log = originalLog as typeof console.log;
			console.warn = originalWarn as typeof console.warn;
			console.error = originalError as typeof console.error;
		};
	}, [appendSyncEvent]);

	return {
		syncEvents,
		clearSyncEvents,
		walletEvents,
		clearWalletEvents,
	};
}
