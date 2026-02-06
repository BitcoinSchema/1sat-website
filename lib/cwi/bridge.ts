import type { CWIRequest, CWIResponse } from "./types";

const CHANNEL_NAME = "1sat-cwi";

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

export interface BridgePermissionRequest {
	requestID: string;
	permissionType: string;
	originator: string;
	details: unknown;
}

export interface CWIBridgeCallbacks {
	onStatusChange: (status: WalletStatus) => void;
	onPermissionRequest: (request: BridgePermissionRequest) => void;
}

/**
 * CWI Bridge — runs in the iframe.
 *
 * No wallet, no keys. Relays postMessage from dApp parent to wallet tab
 * via BroadcastChannel (same-origin only).
 */
export class CWIBridge {
	private channel: BroadcastChannel;
	private messageHandler: ((event: MessageEvent) => void) | null = null;
	private channelHandler: ((event: MessageEvent) => void) | null = null;
	private pendingRequests = new Map<
		string,
		{ source: WindowProxy; origin: string }
	>();
	private callbacks: CWIBridgeCallbacks;
	private statusTimeout: ReturnType<typeof setTimeout> | null = null;

	constructor(callbacks: CWIBridgeCallbacks) {
		this.callbacks = callbacks;
		this.channel = new BroadcastChannel(CHANNEL_NAME);
	}

	start(): void {
		if (this.messageHandler) return;

		// Listen for postMessage from dApp parent
		this.messageHandler = (event: MessageEvent) => {
			this.handleDAppMessage(event);
		};
		window.addEventListener("message", this.messageHandler);

		// Listen for BroadcastChannel messages from wallet tab
		this.channelHandler = (event: MessageEvent) => {
			this.handleChannelMessage(event);
		};
		this.channel.addEventListener("message", this.channelHandler);

		// Request status from wallet tab
		this.requestStatus();
	}

	stop(): void {
		if (this.messageHandler) {
			window.removeEventListener("message", this.messageHandler);
			this.messageHandler = null;
		}
		if (this.channelHandler) {
			this.channel.removeEventListener("message", this.channelHandler);
			this.channelHandler = null;
		}
		if (this.statusTimeout) {
			clearTimeout(this.statusTimeout);
			this.statusTimeout = null;
		}
		this.channel.close();
		this.pendingRequests.clear();
	}

	requestStatus(): void {
		this.callbacks.onStatusChange("checking");
		this.channel.postMessage({ type: "cwi-status-request" });

		// If no response after 3s, assume no wallet tab
		this.statusTimeout = setTimeout(() => {
			this.statusTimeout = null;
			this.callbacks.onStatusChange("no-wallet");
		}, 3000);
	}

	grantPermission(requestID: string): void {
		this.channel.postMessage({
			type: "cwi-permission-grant",
			requestID,
		});
	}

	denyPermission(requestID: string): void {
		this.channel.postMessage({
			type: "cwi-permission-deny",
			requestID,
		});
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
		this.channel.postMessage({
			type: "cwi-request",
			id: request.id,
			call: request.call,
			args: request.args,
			originator,
		});
	}

	private handleChannelMessage(event: MessageEvent): void {
		const data = event.data;
		if (!data?.type) return;

		switch (data.type) {
			case "cwi-response": {
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
				if (this.statusTimeout) {
					clearTimeout(this.statusTimeout);
					this.statusTimeout = null;
				}
				this.callbacks.onStatusChange(data.status);
				break;
			}

			case "cwi-permission-request": {
				this.callbacks.onPermissionRequest({
					requestID: data.requestID,
					permissionType: data.permissionType,
					originator: data.originator,
					details: data.details,
				});
				break;
			}
		}
	}
}
