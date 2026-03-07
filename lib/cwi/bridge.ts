import {
	CWI_CHANNEL_NAME,
	type CWIChannelBaseMessage,
	type CWIChannelCounterpartyPermissionRequestMessage,
	type CWIChannelDenyCounterpartyPermissionMessage,
	type CWIChannelDenyGroupedPermissionMessage,
	type CWIChannelDenyPermissionMessage,
	type CWIChannelGrantCounterpartyPermissionMessage,
	type CWIChannelGrantGroupedPermissionMessage,
	type CWIChannelGrantPermissionMessage,
	type CWIChannelGroupedPermissionRequestMessage,
	type CWIChannelPermissionRequestMessage,
	type CWIChannelRequestMessage,
	type CWIChannelResponseMessage,
	type CWIChannelStatusMessage,
	type CWIChannelStatusRequestMessage,
	type CWIHandshakeReason,
	type CWIRequest,
	type CWIResponse,
	type CWIWalletStatus,
	createChannelEnvelope,
	isV2ChannelMessage,
} from "./types";

/**
 * Valid WalletInterface method names that can be called via CWI.
 * Client-side validation before forwarding to wallet tab.
 */
const VALID_METHODS = new Set([
	"createAction",
	"signAction",
	"abortAction",
	"listActions",
	"internalizeAction",
	"listOutputs",
	"relinquishOutput",
	"getPublicKey",
	"revealCounterpartyKeyLinkage",
	"revealSpecificKeyLinkage",
	"encrypt",
	"decrypt",
	"createHmac",
	"verifyHmac",
	"createSignature",
	"verifySignature",
	"acquireCertificate",
	"listCertificates",
	"proveCertificate",
	"relinquishCertificate",
	"discoverByIdentityKey",
	"discoverByAttributes",
	"isAuthenticated",
	"waitForAuthentication",
	"getHeight",
	"getHeaderForHeight",
	"getNetwork",
	"getVersion",
	"getBalance",
]);

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

type HandshakeState = "idle" | "probing" | "connected" | "fallback-required";

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const isLikelyMobileRuntime = (): boolean => {
	if (typeof navigator === "undefined") return false;
	if (
		"userAgentData" in navigator &&
		typeof navigator.userAgentData === "object" &&
		navigator.userAgentData !== null &&
		"mobile" in navigator.userAgentData
	) {
		const maybeMobile = (
			navigator.userAgentData as unknown as { mobile?: unknown }
		).mobile;
		if (typeof maybeMobile === "boolean") {
			return maybeMobile;
		}
	}
	const userAgent = navigator.userAgent ?? "";
	return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
};

const isChannelBaseMessage = (data: unknown): data is CWIChannelBaseMessage =>
	isObjectRecord(data) && typeof data.type === "string";

const createSessionId = (): string => {
	if (
		typeof crypto !== "undefined" &&
		typeof crypto.randomUUID === "function"
	) {
		return crypto.randomUUID();
	}
	return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

const isChannelResponseMessage = (
	data: unknown,
): data is CWIChannelResponseMessage =>
	isObjectRecord(data) &&
	data.type === "cwi-response" &&
	typeof data.id === "string";

const isChannelStatusMessage = (
	data: unknown,
): data is CWIChannelStatusMessage =>
	isObjectRecord(data) &&
	data.type === "cwi-status" &&
	typeof data.status === "string";

const isChannelPermissionRequestMessage = (
	data: unknown,
): data is CWIChannelPermissionRequestMessage =>
	isObjectRecord(data) &&
	data.type === "cwi-permission-request" &&
	typeof data.requestID === "string" &&
	typeof data.permissionType === "string" &&
	typeof data.originator === "string";

const isChannelGroupedPermissionRequestMessage = (
	data: unknown,
): data is CWIChannelGroupedPermissionRequestMessage =>
	isObjectRecord(data) &&
	data.type === "cwi-grouped-permission-request" &&
	typeof data.requestID === "string" &&
	typeof data.originator === "string";

const isChannelCounterpartyPermissionRequestMessage = (
	data: unknown,
): data is CWIChannelCounterpartyPermissionRequestMessage =>
	isObjectRecord(data) &&
	data.type === "cwi-counterparty-permission-request" &&
	typeof data.requestID === "string" &&
	typeof data.originator === "string" &&
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
	permissions: unknown;
}

export interface BridgeCounterpartyPermissionRequest {
	requestID: string;
	originator: string;
	counterparty: string;
	permissions: unknown;
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
}

/**
 * CWI Bridge — runs in the iframe.
 *
 * No wallet, no keys. Relays postMessage from dApp parent to wallet tab
 * via BroadcastChannel (same-origin only).
 */
export class CWIBridge {
	private channel: BroadcastChannel | null = null;
	private messageHandler: ((event: MessageEvent) => void) | null = null;
	private channelHandler: ((event: MessageEvent) => void) | null = null;
	private pendingRequests = new Map<
		string,
		{ source: WindowProxy; origin: string }
	>();
	private callbacks: CWIBridgeCallbacks;
	private statusTimeout: ReturnType<typeof setTimeout> | null = null;
	private handshakeState: HandshakeState = "idle";
	private handshakeAttempt = 0;
	private isStopped = false;
	private readonly sessionId = createSessionId();
	private readonly handshakePolicy: HandshakePolicy;

	constructor(callbacks: CWIBridgeCallbacks) {
		this.callbacks = callbacks;
		this.handshakePolicy = isLikelyMobileRuntime()
			? MOBILE_HANDSHAKE_POLICY
			: DESKTOP_HANDSHAKE_POLICY;
	}

	start(): void {
		if (this.messageHandler) return;
		this.isStopped = false;

		// Listen for postMessage from dApp parent
		this.messageHandler = (event: MessageEvent) => {
			this.handleDAppMessage(event);
		};
		window.addEventListener("message", this.messageHandler);

		// Acquire BroadcastChannel (may need storage access in cross-site iframes)
		void this.acquireChannel();
	}

	/**
	 * Retry channel acquisition with a user gesture (click inside iframe).
	 * Call this from a click handler when onStorageAccessRequired fires.
	 */
	async retryWithGesture(): Promise<boolean> {
		const channel = await this.tryStorageAccess();
		if (!channel) return false;
		this.attachChannel(channel);
		this.requestStatus();
		return true;
	}

	private attachChannel(channel: BroadcastChannel): void {
		this.channel = channel;
		this.channelHandler = (event: MessageEvent) => {
			this.handleChannelMessage(event);
		};
		this.channel.addEventListener("message", this.channelHandler);
	}

	private async acquireChannel(): Promise<void> {
		if (this.isThirdPartyContext()) {
			const channel = await this.tryStorageAccess();
			if (channel) {
				this.attachChannel(channel);
				this.requestStatus();
				return;
			}
			// Auto-grant failed — need user gesture
			this.callbacks.onStorageAccessRequired?.();
			return;
		}

		// Same-site context — regular BroadcastChannel works
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
			const rsa = document.requestStorageAccess.bind(document) as unknown as (
				types: { BroadcastChannel: boolean },
			) => Promise<{ BroadcastChannel: (name: string) => BroadcastChannel }>;
			const handle = await rsa({ BroadcastChannel: true });
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

	stop(): void {
		if (this.messageHandler) {
			window.removeEventListener("message", this.messageHandler);
			this.messageHandler = null;
		}
		if (this.channelHandler) {
			this.channel?.removeEventListener("message", this.channelHandler);
			this.channelHandler = null;
		}
		this.isStopped = true;
		this.clearStatusTimeout();
		this.channel?.close();
		this.channel = null;
		this.pendingRequests.clear();
		this.handshakeState = "idle";
		this.handshakeAttempt = 0;
	}

	requestStatus(): void {
		if (this.isStopped) return;
		if (!this.channel) {
			this.callbacks.onStatusChange("no-wallet");
			this.markFallback("channel_unavailable");
			return;
		}

		this.handshakeState = "probing";
		this.handshakeAttempt = 0;
		this.callbacks.onStatusChange("checking");
		this.emitTransportState({ transport: "embed", fallbackRecommended: false });
		this.clearStatusTimeout();
		this.runHandshakeAttempt();
	}

	grantPermission(requestID: string): void {
		const message: CWIChannelGrantPermissionMessage = {
			...createChannelEnvelope(this.sessionId),
			type: "cwi-permission-grant",
			requestID,
		};
		void this.postToChannel(message);
	}

	denyPermission(requestID: string): void {
		const message: CWIChannelDenyPermissionMessage = {
			...createChannelEnvelope(this.sessionId),
			type: "cwi-permission-deny",
			requestID,
		};
		void this.postToChannel(message);
	}

	grantGroupedPermission(requestID: string, granted: unknown): void {
		const message: CWIChannelGrantGroupedPermissionMessage = {
			...createChannelEnvelope(this.sessionId),
			type: "cwi-grouped-permission-grant",
			requestID,
			granted,
		};
		void this.postToChannel(message);
	}

	denyGroupedPermission(requestID: string): void {
		const message: CWIChannelDenyGroupedPermissionMessage = {
			...createChannelEnvelope(this.sessionId),
			type: "cwi-grouped-permission-deny",
			requestID,
		};
		void this.postToChannel(message);
	}

	grantCounterpartyPermission(requestID: string, granted: unknown): void {
		const message: CWIChannelGrantCounterpartyPermissionMessage = {
			...createChannelEnvelope(this.sessionId),
			type: "cwi-counterparty-permission-grant",
			requestID,
			granted,
		};
		void this.postToChannel(message);
	}

	denyCounterpartyPermission(requestID: string): void {
		const message: CWIChannelDenyCounterpartyPermissionMessage = {
			...createChannelEnvelope(this.sessionId),
			type: "cwi-counterparty-permission-deny",
			requestID,
		};
		void this.postToChannel(message);
	}

	private handleDAppMessage(event: MessageEvent): void {
		// Only accept trusted browser events
		if (!event.isTrusted) return;

		const data = event.data;

		// Validate CWI request shape
		if (
			data?.type !== "CWI" ||
			data.isInvocation !== true ||
			typeof data.id !== "string" ||
			typeof data.call !== "string"
		) {
			return;
		}

		const request = data as CWIRequest;
		const source = event.source as WindowProxy | null;
		if (!source) return;

		// Originator is ALWAYS derived from the MessageEvent, never from client data
		const originator = event.origin;

		// Validate method name
		if (!VALID_METHODS.has(request.call)) {
			source.postMessage(
				{
					type: "CWI",
					isInvocation: false,
					id: request.id,
					status: "error",
					description: `Unknown method: ${request.call}`,
					code: 2,
				} satisfies CWIResponse,
				originator,
			);
			return;
		}

		// Track this request so we can route the response back
		this.pendingRequests.set(request.id, { source, origin: originator });

		// Forward to wallet tab via BroadcastChannel
		const relayMessage: CWIChannelRequestMessage = {
			...createChannelEnvelope(this.sessionId),
			type: "cwi-request",
			id: request.id,
			call: request.call,
			args: request.args,
			originator,
		};
		const posted = this.postToChannel(relayMessage);
		if (!posted) {
			this.pendingRequests.delete(request.id);
			source.postMessage(
				{
					type: "CWI",
					isInvocation: false,
					id: request.id,
					status: "error",
					description: "Bridge channel unavailable",
					code: 1,
				} satisfies CWIResponse,
				originator,
			);
			this.markFallback("channel_unavailable");
		}
	}

	private handleChannelMessage(event: MessageEvent): void {
		const data = event.data;
		if (!isChannelBaseMessage(data)) return;
		if (!this.isCurrentSession(data)) return;

		switch (data.type) {
			case "cwi-response": {
				if (!isChannelResponseMessage(data)) return;
				// Route response back to the dApp that made the request
				const pending = this.pendingRequests.get(data.id);
				if (!pending) return;
				this.pendingRequests.delete(data.id);

				const response: CWIResponse = {
					type: "CWI",
					isInvocation: false,
					id: data.id,
					...(data.result !== undefined && { result: data.result }),
					...(data.status && { status: data.status }),
					...(data.description && { description: data.description }),
					...(data.code !== undefined && { code: data.code }),
				};

				// Never use '*' — always target specific origin
				pending.source.postMessage(response, pending.origin);
				break;
			}

			case "cwi-status": {
				if (!isChannelStatusMessage(data)) return;
				this.onStatusReceived(data.status);
				break;
			}

			case "cwi-permission-request": {
				if (!isChannelPermissionRequestMessage(data)) return;
				this.callbacks.onPermissionRequest({
					requestID: data.requestID,
					permissionType: data.permissionType,
					originator: data.originator,
					details: data.details,
				});
				break;
			}

			case "cwi-grouped-permission-request": {
				if (!isChannelGroupedPermissionRequestMessage(data)) return;
				this.callbacks.onGroupedPermissionRequest?.({
					requestID: data.requestID,
					originator: data.originator,
					permissions: data.permissions,
				});
				break;
			}

			case "cwi-counterparty-permission-request": {
				if (!isChannelCounterpartyPermissionRequestMessage(data)) return;
				this.callbacks.onCounterpartyPermissionRequest?.({
					requestID: data.requestID,
					originator: data.originator,
					counterparty: data.counterparty,
					permissions: data.permissions,
				});
				break;
			}
		}
	}

	private runHandshakeAttempt(): void {
		if (this.isStopped || !this.channel) return;

		this.handshakeAttempt += 1;
		const message: CWIChannelStatusRequestMessage = {
			...createChannelEnvelope(this.sessionId),
			type: "cwi-status-request",
		};

		const posted = this.postToChannel(message);
		if (!posted) {
			this.callbacks.onStatusChange("no-wallet");
			this.markFallback("channel_unavailable");
			return;
		}

		const delay = Math.min(
			this.handshakePolicy.baseDelayMs * 2 ** (this.handshakeAttempt - 1),
			this.handshakePolicy.maxDelayMs,
		);

		this.clearStatusTimeout();
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

	private onStatusReceived(status: CWIWalletStatus): void {
		this.clearStatusTimeout();
		this.handshakeState = "connected";
		this.callbacks.onStatusChange(status);
		if (status === "locked") {
			this.markFallback("wallet_locked");
			return;
		}
		this.emitTransportState({ transport: "embed", fallbackRecommended: false });
	}

	private isCurrentSession(message: CWIChannelBaseMessage): boolean {
		if (isV2ChannelMessage(message)) {
			return message.sessionId === this.sessionId;
		}
		if (message.version == null && message.sessionId == null) {
			return true;
		}
		return false;
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

	private clearStatusTimeout(): void {
		if (this.statusTimeout) {
			clearTimeout(this.statusTimeout);
			this.statusTimeout = null;
		}
	}

	private postToChannel(
		message:
			| CWIChannelRequestMessage
			| CWIChannelGrantPermissionMessage
			| CWIChannelDenyPermissionMessage
			| CWIChannelGrantGroupedPermissionMessage
			| CWIChannelDenyGroupedPermissionMessage
			| CWIChannelGrantCounterpartyPermissionMessage
			| CWIChannelDenyCounterpartyPermissionMessage
			| CWIChannelStatusRequestMessage,
	): boolean {
		if (this.isStopped || !this.channel) return false;
		try {
			this.channel.postMessage(message);
			return true;
		} catch {
			return false;
		}
	}
}
