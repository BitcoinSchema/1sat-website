/**
 * XDM (Cross-Document Messaging) types matching @bsv/sdk's XDMSubstrate protocol.
 *
 * Request:  dApp → iframe (isInvocation: true)
 * Response: iframe → dApp (isInvocation: false)
 */

export interface CWIRequest {
	type: "CWI";
	isInvocation: true;
	id: string;
	call: string;
	args: unknown;
}

export interface CWIResponse {
	type: "CWI";
	isInvocation: false;
	id: string;
	result?: unknown;
	status?: "error";
	description?: string;
	code?: number;
}

/**
 * Internal channel protocol between the iframe bridge and wallet-tab relay.
 * Version/session fields are optional in type definitions to preserve
 * compatibility with legacy v1 messages during rollout.
 */
export const CWI_CHANNEL_NAME = "1sat-cwi";
export const CWI_CHANNEL_VERSION = 2 as const;

export type CWIHandshakeReason =
	| "channel_unavailable"
	| "wallet_tab_unreachable"
	| "wallet_locked";

export type CWIWalletStatus = "locked" | "unlocked" | "no-wallet";

export interface CWIChannelBaseMessage {
	type: string;
	version?: number;
	sessionId?: string;
}

export interface CWIChannelRequestMessage extends CWIChannelBaseMessage {
	type: "cwi-request";
	id: string;
	call: string;
	args?: unknown;
	originator: string;
}

export interface CWIChannelGrantPermissionMessage
	extends CWIChannelBaseMessage {
	type: "cwi-permission-grant";
	requestID: string;
}

export interface CWIChannelDenyPermissionMessage extends CWIChannelBaseMessage {
	type: "cwi-permission-deny";
	requestID: string;
}

export interface CWIChannelStatusRequestMessage extends CWIChannelBaseMessage {
	type: "cwi-status-request";
}

export interface CWIChannelStatusMessage extends CWIChannelBaseMessage {
	type: "cwi-status";
	status: CWIWalletStatus;
}

export interface CWIChannelPermissionRequestMessage
	extends CWIChannelBaseMessage {
	type: "cwi-permission-request";
	requestID: string;
	permissionType: string;
	originator: string;
	details: unknown;
}

export interface CWIChannelResponseMessage extends CWIChannelBaseMessage {
	type: "cwi-response";
	id: string;
	result?: unknown;
	status?: "error";
	description?: string;
	code?: number;
}

export const isV2ChannelMessage = (
	message: CWIChannelBaseMessage,
): message is CWIChannelBaseMessage & {
	version: typeof CWI_CHANNEL_VERSION;
	sessionId: string;
} =>
	message.version === CWI_CHANNEL_VERSION &&
	typeof message.sessionId === "string" &&
	message.sessionId.length > 0;

export const createChannelEnvelope = (sessionId: string) => ({
	version: CWI_CHANNEL_VERSION,
	sessionId,
});
