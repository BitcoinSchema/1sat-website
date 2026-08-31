import type {
	CounterpartyPermissions,
	GroupedPermissions,
} from "@bsv/wallet-toolbox-client";
import {
	CWI_CHANNEL_NAME,
	CWI_MAX_PENDING_PER_SESSION,
	type CWIChannelBaseMessage,
	type CWIChannelCounterpartyPermissionRequestMessage,
	type CWIChannelGroupedPermissionRequestMessage,
	type CWIChannelPermissionRequestMessage,
	type CWIChannelRequestMessage,
	type CWIChannelResponseMessage,
	type CWIChannelSessionAcceptMessage,
	type CWIChannelStatusMessage,
	type CWIHandshakeReason,
	type CWIIndividualGrant,
	type CWIRequest,
	type CWIResponse,
	type CWIWalletStatus,
	createSessionBase,
	createSessionEnvelope,
	isCWIStandardMethod,
	isSessionBaseMessage,
	isSessionEnvelope,
	isWithinCWIPayloadLimit,
	parseBrowserOrigin,
} from "./types";

export type WalletStatus = "checking" | "locked" | "unlocked" | "no-wallet";

interface HandshakePolicy {
	maxAttempts: number;
	baseDelayMs: number;
	maxDelayMs: number;
}

const DESKTOP_HANDSHAKE_POLICY: HandshakePolicy = {
	maxAttempts: 4,
	baseDelayMs: 350,
	maxDelayMs: 2_500,
};
const MOBILE_HANDSHAKE_POLICY: HandshakePolicy = {
	maxAttempts: 3,
	baseDelayMs: 220,
	maxDelayMs: 1_000,
};
const SESSION_REFRESH_MS = 4_000;
const LEADER_LEASE_MS = 10_000;

type HandshakeState = "idle" | "probing" | "connected" | "fallback-required";

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const randomCapability = (): string => {
	const bytes = new Uint8Array(32);
	globalThis.crypto.getRandomValues(bytes);
	return btoa(String.fromCharCode(...bytes))
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replace(/=+$/, "");
};

const isLikelyMobileRuntime = (): boolean => {
	if (typeof navigator === "undefined") return false;
	const data = "userAgentData" in navigator ? navigator.userAgentData : null;
	if (typeof data === "object" && data && "mobile" in data) {
		const mobile = (data as { mobile?: unknown }).mobile;
		if (typeof mobile === "boolean") return mobile;
	}
	return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent ?? "");
};

const isChannelResponseMessage = (
	data: unknown,
): data is CWIChannelResponseMessage =>
	isObjectRecord(data) &&
	isSessionEnvelope(data) &&
	data.type === "cwi-response" &&
	typeof data.id === "string" &&
	(data.status === "success" ||
		(data.status === "error" &&
			typeof data.description === "string" &&
			typeof data.code === "number" &&
			Number.isSafeInteger(data.code) &&
			(data.stack === undefined || typeof data.stack === "string")));

const isStatusMessage = (data: unknown): data is CWIChannelStatusMessage =>
	isObjectRecord(data) &&
	isSessionEnvelope(data) &&
	data.type === "cwi-status" &&
	(data.status === "locked" ||
		data.status === "unlocked" ||
		data.status === "no-wallet");

const isPermissionRequest = (
	data: unknown,
): data is CWIChannelPermissionRequestMessage =>
	isObjectRecord(data) &&
	isSessionEnvelope(data) &&
	data.type === "cwi-permission-request" &&
	typeof data.requestID === "string" &&
	typeof data.permissionType === "string";

const isGroupedPermissionRequest = (
	data: unknown,
): data is CWIChannelGroupedPermissionRequestMessage =>
	isObjectRecord(data) &&
	isSessionEnvelope(data) &&
	data.type === "cwi-grouped-permission-request" &&
	typeof data.requestID === "string";

const isCounterpartyPermissionRequest = (
	data: unknown,
): data is CWIChannelCounterpartyPermissionRequestMessage =>
	isObjectRecord(data) &&
	isSessionEnvelope(data) &&
	data.type === "cwi-counterparty-permission-request" &&
	typeof data.requestID === "string" &&
	typeof data.counterparty === "string";

export interface BridgePermissionRequest {
	requestID: string;
	permissionType: string;
	originator: string;
	details: unknown;
}
export interface BridgeGroupedPermissionRequest {
	requestID: string;
	originator: string;
	permissions: GroupedPermissions;
}
export interface BridgeCounterpartyPermissionRequest {
	requestID: string;
	originator: string;
	counterparty: string;
	permissions: CounterpartyPermissions;
}
export interface BridgeTransportState {
	transport: "embed";
	fallbackRecommended: boolean;
	reason?: CWIHandshakeReason;
}
export interface CWIBridgeCallbacks {
	onStatusChange: (status: WalletStatus) => void;
	onPermissionRequest: (request: BridgePermissionRequest) => void;
	onGroupedPermissionRequest?: (
		request: BridgeGroupedPermissionRequest,
	) => void;
	onCounterpartyPermissionRequest?: (
		request: BridgeCounterpartyPermissionRequest,
	) => void;
	onTransportStateChange?: (state: BridgeTransportState) => void;
	onStorageAccessRequired?: () => void;
	onSessionReset?: () => void;
}

interface PendingDAppRequest {
	request: CWIRequest;
	source: WindowProxy;
	origin: string;
	sent: boolean;
}

/** Keyless iframe transport between one parent dApp and the elected wallet tab. */
export class CWIBridge {
	private channel: BroadcastChannel | null = null;
	private messageHandler: ((event: MessageEvent) => void) | null = null;
	private channelHandler: ((event: MessageEvent) => void) | null = null;
	private pendingRequests = new Map<string, PendingDAppRequest>();
	private readonly callbacks: CWIBridgeCallbacks;
	private statusTimeout: ReturnType<typeof setTimeout> | null = null;
	private refreshTimer: ReturnType<typeof setInterval> | null = null;
	private leaderLeaseTimer: ReturnType<typeof setTimeout> | null = null;
	private handshakeState: HandshakeState = "idle";
	private handshakeAttempt = 0;
	private isStopped = false;
	private readonly sessionId = crypto.randomUUID();
	private readonly sessionToken = randomCapability();
	private leaderId: string | null = null;
	private browserOrigin: string | null = null;
	private originator: string | null = null;
	private readonly handshakePolicy: HandshakePolicy;

	constructor(callbacks: CWIBridgeCallbacks) {
		this.callbacks = callbacks;
		this.handshakePolicy = isLikelyMobileRuntime()
			? MOBILE_HANDSHAKE_POLICY
			: DESKTOP_HANDSHAKE_POLICY;
		if (typeof document !== "undefined" && document.referrer) {
			const identity = parseBrowserOrigin(document.referrer);
			if (identity) {
				this.browserOrigin = identity.browserOrigin;
				this.originator = identity.originator;
			}
		}
	}

	start(): void {
		if (this.messageHandler) return;
		this.isStopped = false;
		this.messageHandler = (event) => this.handleDAppMessage(event);
		window.addEventListener("message", this.messageHandler);
		void this.acquireChannel();
	}

	async retryWithGesture(): Promise<boolean> {
		const channel = await this.tryStorageAccess();
		if (!channel) return false;
		this.attachChannel(channel);
		this.requestStatus();
		return true;
	}

	stop(): void {
		if (this.leaderId) this.postOwned("cwi-session-close");
		this.failPending("Wallet bridge stopped; retry the request");
		if (this.messageHandler)
			window.removeEventListener("message", this.messageHandler);
		if (this.channelHandler)
			this.channel?.removeEventListener("message", this.channelHandler);
		this.messageHandler = null;
		this.channelHandler = null;
		this.isStopped = true;
		this.clearTimers();
		this.channel?.close();
		this.channel = null;
		this.leaderId = null;
		this.handshakeState = "idle";
		this.handshakeAttempt = 0;
	}

	requestStatus(): void {
		if (this.isStopped || !this.channel) {
			this.callbacks.onStatusChange("no-wallet");
			this.markFallback("channel_unavailable");
			return;
		}
		if (!this.browserOrigin || !this.originator) {
			this.callbacks.onStatusChange("checking");
			return;
		}
		this.handshakeState = "probing";
		this.handshakeAttempt = 0;
		this.callbacks.onStatusChange("checking");
		this.emitTransportState({ transport: "embed", fallbackRecommended: false });
		this.runHandshakeAttempt();
	}

	grantPermission(requestID: string, grant?: CWIIndividualGrant): boolean {
		return this.postOwned("cwi-permission-grant", { requestID, grant });
	}
	denyPermission(requestID: string): boolean {
		return this.postOwned("cwi-permission-deny", { requestID });
	}
	grantGroupedPermission(
		requestID: string,
		granted: Partial<GroupedPermissions>,
		expiry?: number,
	): boolean {
		return this.postOwned("cwi-grouped-permission-grant", {
			requestID,
			granted,
			expiry,
		});
	}
	denyGroupedPermission(requestID: string): boolean {
		return this.postOwned("cwi-grouped-permission-deny", { requestID });
	}
	grantCounterpartyPermission(
		requestID: string,
		granted: Partial<CounterpartyPermissions>,
		expiry?: number,
	): boolean {
		return this.postOwned("cwi-counterparty-permission-grant", {
			requestID,
			granted,
			expiry,
		});
	}
	denyCounterpartyPermission(requestID: string): boolean {
		return this.postOwned("cwi-counterparty-permission-deny", { requestID });
	}

	private attachChannel(channel: BroadcastChannel): void {
		this.channel = channel;
		this.channelHandler = (event) => this.handleChannelMessage(event);
		this.channel.addEventListener("message", this.channelHandler);
		this.refreshTimer = setInterval(
			() => this.postSessionOpen(),
			SESSION_REFRESH_MS,
		);
	}

	private async acquireChannel(): Promise<void> {
		if (this.isThirdPartyContext()) {
			const channel = await this.tryStorageAccess();
			if (channel) {
				this.attachChannel(channel);
				this.requestStatus();
				return;
			}
			this.callbacks.onStorageAccessRequired?.();
			return;
		}
		if (typeof BroadcastChannel !== "undefined") {
			this.attachChannel(new BroadcastChannel(CWI_CHANNEL_NAME));
			this.requestStatus();
			return;
		}
		this.callbacks.onStatusChange("no-wallet");
		this.markFallback("channel_unavailable");
	}

	private async tryStorageAccess(): Promise<BroadcastChannel | null> {
		try {
			const request = document.requestStorageAccess.bind(
				document,
			) as unknown as (types: {
				BroadcastChannel: boolean;
			}) => Promise<{ BroadcastChannel: (name: string) => BroadcastChannel }>;
			const handle = await request({ BroadcastChannel: true });
			return handle.BroadcastChannel(CWI_CHANNEL_NAME);
		} catch {
			return null;
		}
	}

	private isThirdPartyContext(): boolean {
		try {
			if (window.self === window.top) return false;
			const parentOrigin = document.referrer
				? new URL(document.referrer).origin
				: null;
			return parentOrigin !== window.location.origin;
		} catch {
			return true;
		}
	}

	private handleDAppMessage(event: MessageEvent): void {
		if (
			!event.isTrusted ||
			event.source !== window.parent ||
			event.origin === "null"
		)
			return;
		const identity = parseBrowserOrigin(event.origin);
		if (!identity) return;
		if (!this.browserOrigin) {
			this.browserOrigin = identity.browserOrigin;
			this.originator = identity.originator;
			this.requestStatus();
		}
		if (
			identity.browserOrigin !== this.browserOrigin ||
			identity.originator !== this.originator
		)
			return;

		const data = event.data;
		if (
			!isObjectRecord(data) ||
			data.type !== "CWI" ||
			data.isInvocation !== true ||
			typeof data.id !== "string" ||
			data.id.length === 0 ||
			data.id.length > 128 ||
			typeof data.call !== "string"
		)
			return;
		const request = data as unknown as CWIRequest;
		const source = event.source as WindowProxy;
		if (!isCWIStandardMethod(request.call)) {
			this.respondError(
				source,
				event.origin,
				request.id,
				2,
				`Unknown method: ${request.call}`,
			);
			return;
		}
		if (!isWithinCWIPayloadLimit(request)) {
			this.respondError(
				source,
				event.origin,
				request.id,
				2,
				"Request payload exceeds bridge limit",
			);
			return;
		}
		if (this.pendingRequests.has(request.id)) {
			this.respondError(
				source,
				event.origin,
				request.id,
				2,
				"Duplicate request id",
			);
			return;
		}
		if (this.pendingRequests.size >= CWI_MAX_PENDING_PER_SESSION) {
			this.respondError(
				source,
				event.origin,
				request.id,
				1,
				"Bridge request limit reached",
			);
			return;
		}
		this.pendingRequests.set(request.id, {
			request,
			source,
			origin: event.origin,
			sent: false,
		});
		if (this.leaderId) this.forwardPending(request.id);
		else this.postSessionOpen();
	}

	private handleChannelMessage(event: MessageEvent): void {
		const data = event.data;
		if (!isSessionBaseMessage(data) || !this.matchesSession(data)) return;
		if (data.type === "cwi-session-accept") {
			if (isSessionEnvelope(data))
				this.acceptLeader(data as CWIChannelSessionAcceptMessage);
			return;
		}
		if (!isSessionEnvelope(data) || data.leaderId !== this.leaderId) return;
		this.resetLeaderLease();
		switch (data.type) {
			case "cwi-leader-lost":
				this.leaderId = null;
				this.failPending("Wallet tab leader changed; retry the request");
				this.callbacks.onSessionReset?.();
				this.requestStatus();
				break;
			case "cwi-response":
				if (isChannelResponseMessage(data)) this.forwardResponse(data);
				break;
			case "cwi-status":
				if (isStatusMessage(data)) this.onStatusReceived(data.status);
				break;
			case "cwi-permission-request":
				if (isPermissionRequest(data)) {
					this.callbacks.onPermissionRequest({
						requestID: data.requestID,
						permissionType: data.permissionType,
						originator: data.originator,
						details: data.details,
					});
				}
				break;
			case "cwi-grouped-permission-request":
				if (isGroupedPermissionRequest(data)) {
					this.callbacks.onGroupedPermissionRequest?.({
						requestID: data.requestID,
						originator: data.originator,
						permissions: data.permissions,
					});
				}
				break;
			case "cwi-counterparty-permission-request":
				if (isCounterpartyPermissionRequest(data)) {
					this.callbacks.onCounterpartyPermissionRequest?.({
						requestID: data.requestID,
						originator: data.originator,
						counterparty: data.counterparty,
						permissions: data.permissions,
					});
				}
				break;
		}
	}

	private acceptLeader(message: CWIChannelSessionAcceptMessage): void {
		this.leaderId = message.leaderId;
		this.resetLeaderLease();
		for (const id of this.pendingRequests.keys()) this.forwardPending(id);
		this.postOwned("cwi-status-request");
	}

	private forwardPending(id: string): void {
		const pending = this.pendingRequests.get(id);
		if (!pending || pending.sent || !this.leaderId) return;
		const message: CWIChannelRequestMessage = {
			...this.ownedEnvelope(),
			type: "cwi-request",
			id,
			call: pending.request.call,
			args: pending.request.args,
		};
		pending.sent = this.postToChannel(message);
		if (!pending.sent) {
			this.pendingRequests.delete(id);
			this.respondError(
				pending.source,
				pending.origin,
				id,
				1,
				"Bridge channel unavailable",
			);
		}
	}

	private forwardResponse(data: CWIChannelResponseMessage): void {
		const pending = this.pendingRequests.get(data.id);
		if (!pending) return;
		this.pendingRequests.delete(data.id);
		const response: CWIResponse =
			data.status === "error"
				? {
						type: "CWI",
						isInvocation: false,
						id: data.id,
						status: "error",
						description: data.description,
						code: data.code,
						...(data.stack ? { stack: data.stack } : {}),
					}
				: {
						type: "CWI",
						isInvocation: false,
						id: data.id,
						status: "success",
						...(data.result !== undefined ? { result: data.result } : {}),
					};
		pending.source.postMessage(response, pending.origin);
	}

	private runHandshakeAttempt(): void {
		if (this.isStopped || !this.channel) return;
		this.handshakeAttempt += 1;
		this.postSessionOpen();
		const delay = Math.min(
			this.handshakePolicy.baseDelayMs * 2 ** (this.handshakeAttempt - 1),
			this.handshakePolicy.maxDelayMs,
		);
		if (this.statusTimeout) clearTimeout(this.statusTimeout);
		this.statusTimeout = setTimeout(() => {
			this.statusTimeout = null;
			if (this.isStopped || this.handshakeState !== "probing") return;
			if (this.handshakeAttempt >= this.handshakePolicy.maxAttempts) {
				this.callbacks.onStatusChange("no-wallet");
				this.markFallback("wallet_tab_unreachable");
				return;
			}
			this.runHandshakeAttempt();
		}, delay);
	}

	private postSessionOpen(): boolean {
		if (!this.browserOrigin || !this.originator) return false;
		return this.postToChannel({
			...createSessionBase({
				sessionId: this.sessionId,
				sessionToken: this.sessionToken,
				browserOrigin: this.browserOrigin,
				originator: this.originator,
			}),
			type: "cwi-session-open",
		});
	}

	private postOwned(
		type: string,
		extra: Record<string, unknown> = {},
	): boolean {
		if (!this.leaderId || !isWithinCWIPayloadLimit(extra)) return false;
		return this.postToChannel({ ...this.ownedEnvelope(), type, ...extra });
	}

	private ownedEnvelope() {
		if (!this.browserOrigin || !this.originator || !this.leaderId)
			throw new Error("CWI session is not owned");
		return createSessionEnvelope({
			sessionId: this.sessionId,
			sessionToken: this.sessionToken,
			browserOrigin: this.browserOrigin,
			originator: this.originator,
			leaderId: this.leaderId,
		});
	}

	private matchesSession(message: CWIChannelBaseMessage): boolean {
		return (
			message.sessionId === this.sessionId &&
			message.sessionToken === this.sessionToken &&
			message.browserOrigin === this.browserOrigin &&
			message.originator === this.originator
		);
	}

	private onStatusReceived(status: CWIWalletStatus): void {
		if (this.statusTimeout) clearTimeout(this.statusTimeout);
		this.statusTimeout = null;
		this.handshakeState = "connected";
		this.callbacks.onStatusChange(status);
		if (status === "locked") this.markFallback("wallet_locked");
		else
			this.emitTransportState({
				transport: "embed",
				fallbackRecommended: false,
			});
	}

	private resetLeaderLease(): void {
		if (this.leaderLeaseTimer) clearTimeout(this.leaderLeaseTimer);
		this.leaderLeaseTimer = setTimeout(() => {
			this.leaderId = null;
			this.failPending(
				"Wallet tab leader became unreachable; retry the request",
			);
			this.callbacks.onSessionReset?.();
			this.requestStatus();
		}, LEADER_LEASE_MS);
	}

	private failPending(description: string): void {
		for (const [id, pending] of this.pendingRequests) {
			this.respondError(pending.source, pending.origin, id, 1, description);
		}
		this.pendingRequests.clear();
	}

	private respondError(
		source: WindowProxy,
		origin: string,
		id: string,
		code: number,
		description: string,
	): void {
		source.postMessage(
			{
				type: "CWI",
				isInvocation: false,
				id,
				status: "error",
				code,
				description,
			},
			origin,
		);
	}
	private markFallback(reason: CWIHandshakeReason): void {
		this.handshakeState = "fallback-required";
		this.emitTransportState({
			transport: "embed",
			fallbackRecommended: true,
			reason,
		});
	}
	private emitTransportState(state: BridgeTransportState): void {
		this.callbacks.onTransportStateChange?.(state);
	}
	private clearTimers(): void {
		if (this.statusTimeout) clearTimeout(this.statusTimeout);
		if (this.refreshTimer) clearInterval(this.refreshTimer);
		if (this.leaderLeaseTimer) clearTimeout(this.leaderLeaseTimer);
		this.statusTimeout = null;
		this.refreshTimer = null;
		this.leaderLeaseTimer = null;
	}
	private postToChannel(message: CWIChannelBaseMessage): boolean {
		if (this.isStopped || !this.channel) return false;
		try {
			this.channel.postMessage(message);
			return true;
		} catch {
			return false;
		}
	}
}
