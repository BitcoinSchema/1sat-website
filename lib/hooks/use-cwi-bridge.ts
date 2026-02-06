"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	type BridgePermissionRequest,
	CWIBridge,
	type WalletStatus,
} from "@/lib/cwi/bridge";

interface CWIBridgeState {
	status: WalletStatus;
	activePermission: BridgePermissionRequest | null;
	queueLength: number;
	grantPermission: (requestID: string) => void;
	denyPermission: (requestID: string) => void;
	retryStatus: () => void;
}

/**
 * React hook for the CWI iframe bridge.
 *
 * No wallet dependency — self-contained. Communicates with the wallet tab
 * via BroadcastChannel through the CWIBridge class.
 */
export function useCWIBridge(): CWIBridgeState {
	const bridgeRef = useRef<CWIBridge | null>(null);
	const [status, setStatus] = useState<WalletStatus>("checking");
	const [permissionQueue, setPermissionQueue] = useState<
		BridgePermissionRequest[]
	>([]);

	const activePermission = permissionQueue[0] ?? null;

	useEffect(() => {
		const bridge = new CWIBridge({
			onStatusChange: setStatus,
			onPermissionRequest: (request) => {
				setPermissionQueue((prev) => {
					if (
						prev.some((existing) => existing.requestID === request.requestID)
					) {
						return prev;
					}
					return [...prev, request];
				});
			},
		});
		bridge.start();
		bridgeRef.current = bridge;

		return () => {
			bridge.stop();
			bridgeRef.current = null;
			setPermissionQueue([]);
		};
	}, []);

	const grantPermission = useCallback((requestID: string) => {
		setPermissionQueue((prev) =>
			prev.filter((request) => request.requestID !== requestID),
		);
		bridgeRef.current?.grantPermission(requestID);
	}, []);

	const denyPermission = useCallback((requestID: string) => {
		setPermissionQueue((prev) =>
			prev.filter((request) => request.requestID !== requestID),
		);
		bridgeRef.current?.denyPermission(requestID);
	}, []);

	const retryStatus = useCallback(() => {
		bridgeRef.current?.requestStatus();
	}, []);

	return {
		status,
		activePermission,
		queueLength: permissionQueue.length,
		grantPermission,
		denyPermission,
		retryStatus,
	};
}
