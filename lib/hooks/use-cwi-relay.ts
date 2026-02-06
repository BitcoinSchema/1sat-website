"use client";

// TODO(cwi): Migrate off internal wallet-toolbox import when stable public exports are available.
import type { PermissionEventHandler } from "@bsv/wallet-toolbox/out/src/index.client";
import { useEffect, useRef } from "react";
import { CWIRelay } from "@/lib/cwi/relay";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

/**
 * React hook for the CWI relay — runs in the wallet tab.
 *
 * Creates a single relay instance on mount and uses refs so it always
 * reads the latest wallet/status without needing to be re-created.
 * Permission callbacks are bound/unbound as permissionsManager changes.
 */
export function useCWIRelay(): void {
	const { permissionsManager } = useWalletToolbox();
	const { hasWallet, isWalletLocked } = useWallet();
	const relayRef = useRef<CWIRelay | null>(null);

	// Refs so the relay always reads current state without re-creation
	const walletRef = useRef(permissionsManager);
	walletRef.current = permissionsManager;

	const statusRef = useRef<() => "locked" | "unlocked" | "no-wallet">(
		() => "no-wallet",
	);
	statusRef.current = () => {
		if (!hasWallet) return "no-wallet";
		if (isWalletLocked) return "locked";
		return "unlocked";
	};

	// Single relay instance — lives for the lifetime of the component
	useEffect(() => {
		const relay = new CWIRelay({
			getWallet: () => walletRef.current,
			getStatus: () => statusRef.current(),
		});
		relay.start();
		relayRef.current = relay;

		return () => {
			relay.stop();
			relayRef.current = null;
		};
	}, []);

	// Bind/unbind permission callbacks when permissionsManager changes
	useEffect(() => {
		if (!permissionsManager) return;

		const relay = relayRef.current;
		if (!relay) return;

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

		return () => {
			for (let i = 0; i < events.length; i++) {
				permissionsManager.unbindCallback(events[i], ids[i]);
			}
		};
	}, [permissionsManager]);

	// Broadcast status changes when wallet state changes
	useEffect(() => {
		relayRef.current?.sendStatus();
	}, [hasWallet, isWalletLocked]);
}
