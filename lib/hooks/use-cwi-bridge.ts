"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	CWIBridge,
	type BridgePermissionRequest,
	type WalletStatus,
} from "@/lib/cwi/bridge";

interface CWIBridgeState {
	status: WalletStatus;
	pendingPermission: BridgePermissionRequest | null;
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
	const [pendingPermission, setPendingPermission] =
		useState<BridgePermissionRequest | null>(null);

	useEffect(() => {
		const bridge = new CWIBridge({
			onStatusChange: setStatus,
			onPermissionRequest: setPendingPermission,
		});
		bridge.start();
		bridgeRef.current = bridge;

		return () => {
			bridge.stop();
			bridgeRef.current = null;
		};
	}, []);

	const grantPermission = useCallback((requestID: string) => {
		setPendingPermission(null);
		bridgeRef.current?.grantPermission(requestID);
	}, []);

	const denyPermission = useCallback((requestID: string) => {
		setPendingPermission(null);
		bridgeRef.current?.denyPermission(requestID);
	}, []);

	const retryStatus = useCallback(() => {
		bridgeRef.current?.requestStatus();
	}, []);

	return {
		status,
		pendingPermission,
		grantPermission,
		denyPermission,
		retryStatus,
	};
}
