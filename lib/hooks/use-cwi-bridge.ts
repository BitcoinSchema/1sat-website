"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	type BridgeCounterpartyPermissionRequest,
	type BridgeGroupedPermissionRequest,
	type BridgePermissionRequest,
	type BridgeTransportState,
	CWIBridge,
	type WalletStatus,
} from "@/lib/cwi/bridge";

interface CWIBridgeState {
	status: WalletStatus;
	activePermission: BridgePermissionRequest | null;
	activeGroupedPermission: BridgeGroupedPermissionRequest | null;
	activeCounterpartyPermission: BridgeCounterpartyPermissionRequest | null;
	queueLength: number;
	transport: "embed";
	fallbackRecommended: boolean;
	reason?: BridgeTransportState["reason"];
	storageAccessRequired: boolean;
	grantPermission: (requestID: string) => void;
	denyPermission: (requestID: string) => void;
	grantGroupedPermission: (requestID: string, granted: unknown) => void;
	denyGroupedPermission: (requestID: string) => void;
	grantCounterpartyPermission: (requestID: string, granted: unknown) => void;
	denyCounterpartyPermission: (requestID: string) => void;
	grantStorageAccess: () => void;
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
	const [transportState, setTransportState] = useState<BridgeTransportState>({
		transport: "embed",
		fallbackRecommended: false,
	});
	const [permissionQueue, setPermissionQueue] = useState<
		BridgePermissionRequest[]
	>([]);
	const [groupedQueue, setGroupedQueue] = useState<
		BridgeGroupedPermissionRequest[]
	>([]);
	const [counterpartyQueue, setCounterpartyQueue] = useState<
		BridgeCounterpartyPermissionRequest[]
	>([]);
	const [storageAccessRequired, setStorageAccessRequired] = useState(false);

	const activePermission = permissionQueue[0] ?? null;
	const activeGroupedPermission = groupedQueue[0] ?? null;
	const activeCounterpartyPermission = counterpartyQueue[0] ?? null;

	useEffect(() => {
		const bridge = new CWIBridge({
			onStatusChange: setStatus,
			onTransportStateChange: setTransportState,
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
			onGroupedPermissionRequest: (request) => {
				setGroupedQueue((prev) => {
					if (
						prev.some((existing) => existing.requestID === request.requestID)
					) {
						return prev;
					}
					return [...prev, request];
				});
			},
			onCounterpartyPermissionRequest: (request) => {
				setCounterpartyQueue((prev) => {
					if (
						prev.some((existing) => existing.requestID === request.requestID)
					) {
						return prev;
					}
					return [...prev, request];
				});
			},
			onStorageAccessRequired: () => setStorageAccessRequired(true),
		});
		bridge.start();
		bridgeRef.current = bridge;

		return () => {
			bridge.stop();
			bridgeRef.current = null;
			setPermissionQueue([]);
			setGroupedQueue([]);
			setCounterpartyQueue([]);
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

	const grantGroupedPermission = useCallback(
		(requestID: string, granted: unknown) => {
			setGroupedQueue((prev) =>
				prev.filter((request) => request.requestID !== requestID),
			);
			bridgeRef.current?.grantGroupedPermission(requestID, granted);
		},
		[],
	);

	const denyGroupedPermission = useCallback((requestID: string) => {
		setGroupedQueue((prev) =>
			prev.filter((request) => request.requestID !== requestID),
		);
		bridgeRef.current?.denyGroupedPermission(requestID);
	}, []);

	const grantCounterpartyPermission = useCallback(
		(requestID: string, granted: unknown) => {
			setCounterpartyQueue((prev) =>
				prev.filter((request) => request.requestID !== requestID),
			);
			bridgeRef.current?.grantCounterpartyPermission(requestID, granted);
		},
		[],
	);

	const denyCounterpartyPermission = useCallback((requestID: string) => {
		setCounterpartyQueue((prev) =>
			prev.filter((request) => request.requestID !== requestID),
		);
		bridgeRef.current?.denyCounterpartyPermission(requestID);
	}, []);

	const retryStatus = useCallback(() => {
		bridgeRef.current?.requestStatus();
	}, []);

	const grantStorageAccess = useCallback(() => {
		const bridge = bridgeRef.current;
		if (!bridge) return;
		void bridge.retryWithGesture().then((granted) => {
			if (granted) setStorageAccessRequired(false);
		});
	}, []);

	const totalQueue =
		permissionQueue.length + groupedQueue.length + counterpartyQueue.length;

	return {
		status,
		activePermission,
		activeGroupedPermission,
		activeCounterpartyPermission,
		queueLength: totalQueue,
		transport: transportState.transport,
		fallbackRecommended: transportState.fallbackRecommended,
		reason: transportState.reason,
		storageAccessRequired,
		grantPermission,
		denyPermission,
		grantGroupedPermission,
		denyGroupedPermission,
		grantCounterpartyPermission,
		denyCounterpartyPermission,
		grantStorageAccess,
		retryStatus,
	};
}
