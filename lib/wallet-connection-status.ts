import type { DisconnectReason } from "@1sat/connect";

export type WalletConnectionStatus =
	| "no-wallet"
	| "locked"
	| "authenticating"
	| "ready"
	| "disconnected";

export function statusAfterDisconnect(
	reason: DisconnectReason,
): WalletConnectionStatus {
	return reason === "unauthenticated" ? "locked" : "disconnected";
}
