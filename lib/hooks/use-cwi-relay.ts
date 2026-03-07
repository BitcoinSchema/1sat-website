"use client";

// TODO(cwi): Migrate off internal wallet-toolbox import when stable public exports are available.
import type {
	CounterpartyPermissionEventHandler,
	GroupedPermissionEventHandler,
	PermissionEventHandler,
} from "@bsv/wallet-toolbox/out/src/index.client";
import { useEffect, useRef } from "react";
import type { PermissionScope } from "@/lib/cwi/permission-store";
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
	const {
		wallet: toolboxWallet,
		permissionsManager,
		identityKey,
		chain,
		balance,
		exchangeRate,
	} = useWalletToolbox();
	const { hasWallet } = useWallet();
	const relayRef = useRef<CWIRelay | null>(null);

	// Refs so the relay always reads current state without re-creation
	const walletRef = useRef(permissionsManager);
	walletRef.current = permissionsManager;

	const scopeRef = useRef<PermissionScope | null>(
		identityKey ? { identityKey, chain } : null,
	);
	scopeRef.current = identityKey ? { identityKey, chain } : null;
	const balanceRef = useRef(balance);
	balanceRef.current = balance;
	const exchangeRateRef = useRef(exchangeRate);
	exchangeRateRef.current = exchangeRate;
	const toolboxWalletRef = useRef(toolboxWallet);
	toolboxWalletRef.current = toolboxWallet;

	// Derive status from WPM availability; toolbox unlock state can lag
	// behind the base wallet provider lock flag during import/init.
	const status: "locked" | "unlocked" | "no-wallet" = walletRef.current
		? "unlocked"
		: hasWallet
			? "locked"
			: "no-wallet";
	const statusRef = useRef<"locked" | "unlocked" | "no-wallet">(status);

	// Single relay instance — lives for the lifetime of the component
	useEffect(() => {
		const relay = new CWIRelay({
			getWallet: () => walletRef.current,
			getStatus: () => statusRef.current,
			getPersistenceScope: () => scopeRef.current,
			getBalance: async () => {
				let satoshis = balanceRef.current?.total ?? 0;
				const walletForBalance = toolboxWalletRef.current;
				if (walletForBalance) {
					try {
						satoshis = await walletForBalance.balance();
					} catch {
						// Fall back to the latest cached provider balance.
					}
				}
				const rate = exchangeRateRef.current;
				const usd =
					rate != null
						? Number(((satoshis / 100_000_000) * rate).toFixed(8))
						: undefined;
				return { satoshis, ...(usd !== undefined ? { usd } : {}) };
			},
		});
		relay.start();
		relay.sendStatus();
		relayRef.current = relay;

		return () => {
			relay.stop();
			if (relayRef.current === relay) {
				relayRef.current = null;
			}
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

		const groupedHandler: GroupedPermissionEventHandler = (request) => {
			relay.sendGroupedPermissionRequest(
				request.requestID,
				request.originator,
				request.permissions,
			);
		};
		const groupedId = permissionsManager.bindCallback(
			"onGroupedPermissionRequested",
			groupedHandler,
		);

		const counterpartyHandler: CounterpartyPermissionEventHandler = (
			request,
		) => {
			relay.sendCounterpartyPermissionRequest(
				request.requestID,
				request.originator,
				request.counterparty,
				request.permissions,
			);
		};
		const counterpartyId = permissionsManager.bindCallback(
			"onCounterpartyPermissionRequested",
			counterpartyHandler,
		);

		return () => {
			for (let i = 0; i < events.length; i++) {
				permissionsManager.unbindCallback(events[i], ids[i]);
			}
			permissionsManager.unbindCallback(
				"onGroupedPermissionRequested",
				groupedId,
			);
			permissionsManager.unbindCallback(
				"onCounterpartyPermissionRequested",
				counterpartyId,
			);
		};
	}, [permissionsManager]);

	// Broadcast status changes when wallet state changes
	useEffect(() => {
		statusRef.current = status;
		relayRef.current?.sendStatus();
	}, [status]);
}
