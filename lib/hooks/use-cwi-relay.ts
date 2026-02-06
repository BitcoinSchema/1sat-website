"use client";

import type { PermissionEventHandler } from "@bsv/wallet-toolbox/out/src/index.client";
import { useCallback, useEffect, useRef } from "react";
import { CWIRelay } from "@/lib/cwi/relay";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

/**
 * React hook for the CWI relay — runs in the wallet tab.
 *
 * Mounts the relay when WPM is available, binding permission callbacks
 * so the relay can forward permission requests to the iframe bridge.
 */
export function useCWIRelay(): void {
	const { permissionsManager } = useWalletToolbox();
	const { hasWallet, isWalletLocked } = useWallet();
	const relayRef = useRef<CWIRelay | null>(null);
	const callbackIdsRef = useRef<number[]>([]);

	const getStatus = useCallback((): "locked" | "unlocked" | "no-wallet" => {
		if (!hasWallet) return "no-wallet";
		if (isWalletLocked) return "locked";
		return "unlocked";
	}, [hasWallet, isWalletLocked]);

	useEffect(() => {
		if (!permissionsManager) return;

		const relay = new CWIRelay({
			wallet: permissionsManager,
			getStatus,
		});
		relay.start();
		relayRef.current = relay;

		// Bind WPM permission callbacks to relay forwarding
		const handler: PermissionEventHandler = (request) => {
			relay.sendPermissionRequest(
				request.requestID,
				request.type,
				request.originator ?? "unknown",
				request,
			);
		};

		const events = [
			"onProtocolPermissionRequested",
			"onBasketAccessRequested",
			"onCertificateAccessRequested",
			"onSpendingAuthorizationRequested",
		] as const;

		const ids: number[] = [];
		for (const event of events) {
			ids.push(permissionsManager.bindCallback(event, handler));
		}
		callbackIdsRef.current = ids;

		return () => {
			relay.stop();
			relayRef.current = null;

			// Unbind callbacks
			for (let i = 0; i < events.length; i++) {
				permissionsManager.unbindCallback(events[i], ids[i]);
			}
		};
	}, [permissionsManager, getStatus]);

	// Broadcast status changes when wallet state changes
	useEffect(() => {
		relayRef.current?.sendStatus();
	}, [hasWallet, isWalletLocked]);
}
