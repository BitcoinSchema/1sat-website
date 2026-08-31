import WalletWireCalls, {
	type CallType,
} from "@bsv/sdk/wallet/substrates/WalletWireCalls";
import type {
	CounterpartyPermissions,
	GroupedPermissions,
} from "@bsv/wallet-toolbox-client";

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

interface CWIResponseBase {
	type: "CWI";
	isInvocation: false;
	id: string;
}

export interface CWIErrorFields {
	description: string;
	code: number;
	stack?: string;
}

export type CWIResult =
	| {
			status: "success";
			result?: unknown;
			description?: never;
			code?: never;
			stack?: never;
	  }
	| ({ status: "error"; result?: never } & CWIErrorFields);

export type CWIResponse = CWIResponseBase & CWIResult;

/** Canonical BRC-100 method registry exported by the installed SDK. */
export const CWI_STANDARD_METHODS = Object.freeze(
	Object.keys(WalletWireCalls).filter(
		(call): call is CallType =>
			typeof WalletWireCalls[call as keyof typeof WalletWireCalls] === "number",
	),
);

export const isCWIStandardMethod = (call: string): call is CallType =>
	typeof WalletWireCalls[call as keyof typeof WalletWireCalls] === "number";

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

/** Convert an unknown thrown value to the stable BRC-100 wire error shape. */
export const toCWIErrorFields = (
	error: unknown,
	includeStack: boolean,
): CWIErrorFields => {
	const record = isObjectRecord(error) ? error : undefined;
	const rawCode = record?.code;
	const code =
		typeof rawCode === "number" && Number.isSafeInteger(rawCode) ? rawCode : 1;
	const rawDescription = record?.description ?? record?.message;
	const description =
		typeof rawDescription === "string"
			? rawDescription
			: error instanceof Error
				? error.message
				: String(error);
	const stack = record?.stack;

	return {
		description,
		code,
		...(includeStack && typeof stack === "string" && stack.length > 0
			? { stack }
			: {}),
	};
};

export const CWI_CHANNEL_NAME = "1sat-cwi";
export const CWI_CHANNEL_VERSION = 3 as const;
export const CWI_MAX_PAYLOAD_BYTES = 1024 * 1024;
export const CWI_MAX_PENDING_PER_SESSION = 8;
export const CWI_MAX_PENDING_GLOBAL = 32;
export const CWI_MAX_REQUEST_IDS_PER_SESSION = 4096;

export type CWIHandshakeReason =
	| "channel_unavailable"
	| "wallet_tab_unreachable"
	| "wallet_locked";

export type CWIWalletStatus = "locked" | "unlocked" | "no-wallet";

export interface CWIChannelBaseMessage {
	type: string;
	version: typeof CWI_CHANNEL_VERSION;
	sessionId: string;
	sessionToken: string;
	browserOrigin: string;
	originator: string;
}

export interface CWISessionEnvelope extends CWIChannelBaseMessage {
	leaderId: string;
}

export interface CWIChannelSessionOpenMessage extends CWIChannelBaseMessage {
	type: "cwi-session-open";
}

export interface CWIChannelSessionAcceptMessage extends CWISessionEnvelope {
	type: "cwi-session-accept";
}

export interface CWIChannelSessionCloseMessage extends CWISessionEnvelope {
	type: "cwi-session-close";
}

export interface CWIChannelLeaderLostMessage extends CWISessionEnvelope {
	type: "cwi-leader-lost";
}

export interface CWIChannelRequestMessage extends CWISessionEnvelope {
	type: "cwi-request";
	id: string;
	call: string;
	args?: unknown;
}

export interface CWIChannelGrantPermissionMessage extends CWISessionEnvelope {
	type: "cwi-permission-grant";
	requestID: string;
	grant?: CWIIndividualGrant;
}

export interface CWIChannelDenyPermissionMessage extends CWISessionEnvelope {
	type: "cwi-permission-deny";
	requestID: string;
}

export interface CWIChannelStatusRequestMessage extends CWISessionEnvelope {
	type: "cwi-status-request";
}

export interface CWIChannelStatusMessage extends CWISessionEnvelope {
	type: "cwi-status";
	status: CWIWalletStatus;
}

export interface CWIChannelPermissionRequestMessage extends CWISessionEnvelope {
	type: "cwi-permission-request";
	requestID: string;
	permissionType: string;
	details: unknown;
}

export interface CWIIndividualGrant {
	ephemeral: boolean;
	amount?: number;
	expiry?: number;
}

export interface CWIChannelGroupedPermissionRequestMessage
	extends CWISessionEnvelope {
	type: "cwi-grouped-permission-request";
	requestID: string;
	permissions: GroupedPermissions;
}

export interface CWIChannelGrantGroupedPermissionMessage
	extends CWISessionEnvelope {
	type: "cwi-grouped-permission-grant";
	requestID: string;
	granted: Partial<GroupedPermissions>;
	expiry?: number;
}

export interface CWIChannelDenyGroupedPermissionMessage
	extends CWISessionEnvelope {
	type: "cwi-grouped-permission-deny";
	requestID: string;
}

export interface CWIChannelCounterpartyPermissionRequestMessage
	extends CWISessionEnvelope {
	type: "cwi-counterparty-permission-request";
	requestID: string;
	counterparty: string;
	permissions: CounterpartyPermissions;
}

export interface CWIChannelGrantCounterpartyPermissionMessage
	extends CWISessionEnvelope {
	type: "cwi-counterparty-permission-grant";
	requestID: string;
	granted: Partial<CounterpartyPermissions>;
	expiry?: number;
}

export interface CWIChannelDenyCounterpartyPermissionMessage
	extends CWISessionEnvelope {
	type: "cwi-counterparty-permission-deny";
	requestID: string;
}

interface CWIChannelResponseBase extends CWISessionEnvelope {
	type: "cwi-response";
	id: string;
}

export type CWIChannelResponseMessage = CWIChannelResponseBase & CWIResult;

const isBoundedString = (value: unknown, max: number): value is string =>
	typeof value === "string" && value.length > 0 && value.length <= max;

export const isSessionBaseMessage = (
	message: unknown,
): message is CWIChannelBaseMessage =>
	isObjectRecord(message) &&
	message.version === CWI_CHANNEL_VERSION &&
	isBoundedString(message.type, 64) &&
	isBoundedString(message.sessionId, 128) &&
	isBoundedString(message.sessionToken, 256) &&
	isBoundedString(message.browserOrigin, 2048) &&
	isBoundedString(message.originator, 253);

export const isSessionEnvelope = (
	message: unknown,
): message is CWISessionEnvelope =>
	isSessionBaseMessage(message) &&
	isObjectRecord(message) &&
	isBoundedString(message.leaderId, 128);

export const createSessionBase = (session: {
	sessionId: string;
	sessionToken: string;
	browserOrigin: string;
	originator: string;
}) => ({ version: CWI_CHANNEL_VERSION, ...session });

export const createSessionEnvelope = (session: {
	sessionId: string;
	sessionToken: string;
	browserOrigin: string;
	originator: string;
	leaderId: string;
}) => ({ version: CWI_CHANNEL_VERSION, ...session });

/** BRC-100 receives a canonical host; postMessage retains the full origin. */
export const parseBrowserOrigin = (
	value: string,
): { browserOrigin: string; originator: string } | null => {
	try {
		const url = new URL(value);
		const host = url.hostname.toLowerCase().replace(/\.$/, "");
		const isLocal =
			host === "localhost" || host === "127.0.0.1" || host === "[::1]";
		if (url.protocol !== "https:" && !(url.protocol === "http:" && isLocal)) {
			return null;
		}
		if (!host || host.length > 253 || url.origin === "null") return null;
		return { browserOrigin: url.origin, originator: host };
	} catch {
		return null;
	}
};

/** Conservative structured-clone size guard; stops once the limit is crossed. */
export const isWithinCWIPayloadLimit = (
	value: unknown,
	limit = CWI_MAX_PAYLOAD_BYTES,
): boolean => {
	let size = 0;
	const seen = new Set<object>();
	const visit = (item: unknown): void => {
		if (size > limit) return;
		if (typeof item === "string") size += item.length * 3;
		else if (typeof item === "number") size += 8;
		else if (typeof item === "bigint") size += item.toString().length;
		else if (typeof item === "boolean") size += 4;
		else if (item instanceof ArrayBuffer) size += item.byteLength;
		else if (ArrayBuffer.isView(item)) size += item.byteLength;
		else if (typeof Blob !== "undefined" && item instanceof Blob)
			size += item.size;
		else if (item instanceof Map) {
			for (const [key, child] of item) {
				visit(key);
				visit(child);
			}
		} else if (item instanceof Set) {
			for (const child of item) visit(child);
		} else if (typeof item === "object" && item !== null) {
			if (seen.has(item)) return;
			seen.add(item);
			for (const [key, child] of Object.entries(item)) {
				size += key.length * 3;
				visit(child);
			}
		}
	};
	visit(value);
	return size <= limit;
};
