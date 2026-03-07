// TODO(cwi): Migrate off internal wallet-toolbox import when stable public exports are available.
import type {
	PermissionRequest,
	WalletPermissionsManager,
} from "@bsv/wallet-toolbox/out/src/index.client";
import {
	buildPermissionCacheKey,
	type PermissionRequestLike,
} from "./permission-keys";
import { type PermissionScope, saveLocalPermission } from "./permission-store";
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
	createChannelEnvelope,
	isV2ChannelMessage,
} from "./types";

export interface CWIRelayConfig {
	getWallet: () => WalletPermissionsManager | null;
	getStatus: () => "locked" | "unlocked" | "no-wallet";
	getPersistenceScope: () => PermissionScope | null;
	getBalance: () => Promise<{ satoshis: number; usd?: number }>;
}

type CWIWalletMethod = keyof WalletPermissionsManager | "getBalance";

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

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const isCWIRequestMessage = (data: unknown): data is CWIChannelRequestMessage =>
	isObjectRecord(data) &&
	data.type === "cwi-request" &&
	typeof data.id === "string" &&
	typeof data.call === "string" &&
	typeof data.originator === "string";

const isGrantPermissionMessage = (
	data: unknown,
): data is CWIChannelGrantPermissionMessage =>
	isObjectRecord(data) &&
	data.type === "cwi-permission-grant" &&
	typeof data.requestID === "string";

const isDenyPermissionMessage = (
	data: unknown,
): data is CWIChannelDenyPermissionMessage =>
	isObjectRecord(data) &&
	data.type === "cwi-permission-deny" &&
	typeof data.requestID === "string";

const isGrantGroupedPermissionMessage = (
	data: unknown,
): data is CWIChannelGrantGroupedPermissionMessage =>
	isObjectRecord(data) &&
	data.type === "cwi-grouped-permission-grant" &&
	typeof data.requestID === "string";

const isDenyGroupedPermissionMessage = (
	data: unknown,
): data is CWIChannelDenyGroupedPermissionMessage =>
	isObjectRecord(data) &&
	data.type === "cwi-grouped-permission-deny" &&
	typeof data.requestID === "string";

const isGrantCounterpartyPermissionMessage = (
	data: unknown,
): data is CWIChannelGrantCounterpartyPermissionMessage =>
	isObjectRecord(data) &&
	data.type === "cwi-counterparty-permission-grant" &&
	typeof data.requestID === "string";

const isDenyCounterpartyPermissionMessage = (
	data: unknown,
): data is CWIChannelDenyCounterpartyPermissionMessage =>
	isObjectRecord(data) &&
	data.type === "cwi-counterparty-permission-deny" &&
	typeof data.requestID === "string";

const isStatusRequestMessage = (
	data: unknown,
): data is CWIChannelStatusRequestMessage =>
	isObjectRecord(data) && data.type === "cwi-status-request";

const isValidOrigin = (originator: string): boolean => {
	try {
		const parsed = new URL(originator);
		return parsed.protocol === "https:" || parsed.protocol === "http:";
	} catch {
		return false;
	}
};

const isAllowedMethod = (call: string): call is CWIWalletMethod =>
	VALID_METHODS.has(call);

/**
 * CWI Relay — runs in the wallet tab.
 *
 * Listens on BroadcastChannel for CWI requests forwarded by the iframe bridge.
 * Processes them through WPM (which holds keys). Sends responses back.
 *
 * BroadcastChannel is same-origin only (browser-enforced), so only
 * 1satwallet.com pages can participate.
 */
export class CWIRelay {
	private channel: BroadcastChannel | null = null;
	private handler: ((event: MessageEvent) => void) | null = null;
	private getWallet: () => WalletPermissionsManager | null;
	private getStatus: () => "locked" | "unlocked" | "no-wallet";
	private getPersistenceScope: () => PermissionScope | null;
	private getBalance: () => Promise<{ satoshis: number; usd?: number }>;
	private pendingPermissions = new Map<
		string,
		{ request: PermissionRequest & { requestID: string }; sessionId?: string }
	>();
	private authPollTimers = new Set<ReturnType<typeof setTimeout>>();
	private activeSessionId: string | null = null;
	private activeInvocationCount = 0;
	private invocationContextStack: Array<{
		originator: string;
		sessionId?: string;
	}> = [];
	private isStopped = false;

	constructor(config: CWIRelayConfig) {
		this.getWallet = config.getWallet;
		this.getStatus = config.getStatus;
		this.getPersistenceScope = config.getPersistenceScope;
		this.getBalance = config.getBalance;
		if (typeof BroadcastChannel !== "undefined") {
			this.channel = new BroadcastChannel(CWI_CHANNEL_NAME);
		}
	}

	start(): void {
		if (this.handler || !this.channel) return;
		this.isStopped = false;

		this.handler = (event: MessageEvent) => {
			if (this.isStopped) return;
			const data = event.data;
			if (!isObjectRecord(data)) return;

			if (isCWIRequestMessage(data)) {
				if (!this.acceptSession(data)) return;
				void this.handleCWIRequest(data);
				return;
			}

			if (isGrantPermissionMessage(data)) {
				if (!this.acceptSession(data)) return;
				const wallet = this.getWallet();
				if (!wallet) return;
				void this.handleGrant(
					wallet,
					data.requestID,
					this.getMessageSessionId(data),
				);
				return;
			}

			if (isDenyPermissionMessage(data)) {
				if (!this.acceptSession(data)) return;
				const wallet = this.getWallet();
				if (!wallet) return;
				void this.handleDeny(
					wallet,
					data.requestID,
					this.getMessageSessionId(data),
				);
				return;
			}

			if (isGrantGroupedPermissionMessage(data)) {
				if (!this.acceptSession(data)) return;
				const wallet = this.getWallet();
				if (!wallet) return;
				void this.handleGrantGrouped(wallet, data);
				return;
			}

			if (isDenyGroupedPermissionMessage(data)) {
				if (!this.acceptSession(data)) return;
				const wallet = this.getWallet();
				if (!wallet) return;
				void wallet.denyGroupedPermission(data.requestID);
				return;
			}

			if (isGrantCounterpartyPermissionMessage(data)) {
				if (!this.acceptSession(data)) return;
				const wallet = this.getWallet();
				if (!wallet) return;
				void this.handleGrantCounterparty(wallet, data);
				return;
			}

			if (isDenyCounterpartyPermissionMessage(data)) {
				if (!this.acceptSession(data)) return;
				const wallet = this.getWallet();
				if (!wallet) return;
				void wallet.denyCounterpartyPermission(data.requestID);
				return;
			}

			if (isStatusRequestMessage(data)) {
				if (!this.acceptSession(data)) return;
				this.sendStatus(this.getMessageSessionId(data));
			}
		};

		this.channel.addEventListener("message", this.handler);
	}

	stop(): void {
		if (this.handler && this.channel) {
			this.channel.removeEventListener("message", this.handler);
			this.handler = null;
		}
		this.isStopped = true;
		for (const timer of this.authPollTimers) {
			clearTimeout(timer);
		}
		this.authPollTimers.clear();
		this.pendingPermissions.clear();
		this.invocationContextStack = [];
		this.activeInvocationCount = 0;
		this.activeSessionId = null;
		this.channel?.close();
		this.channel = null;
	}

	sendStatus(sessionId?: string): void {
		const targetSessionId = sessionId ?? this.activeSessionId ?? undefined;
		const message: CWIChannelStatusMessage = {
			type: "cwi-status",
			status: this.getStatus(),
			...(targetSessionId ? createChannelEnvelope(targetSessionId) : {}),
		};
		this.postToChannel(message);
	}

	/**
	 * Send a permission request to the iframe bridge for user approval.
	 * Stashes the full request so handleGrant can build cache keys.
	 */
	sendPermissionRequest(
		requestID: string,
		permissionType: string,
		originator: string,
		details: PermissionRequest & { requestID: string },
	): void {
		const sessionId = this.resolveSessionForPermission(originator);
		this.pendingPermissions.set(requestID, { request: details, sessionId });
		const message: CWIChannelPermissionRequestMessage = {
			type: "cwi-permission-request",
			requestID,
			permissionType,
			originator,
			details,
			...(sessionId ? createChannelEnvelope(sessionId) : {}),
		};
		this.postToChannel(message);
	}

	sendGroupedPermissionRequest(
		requestID: string,
		originator: string,
		permissions: unknown,
	): void {
		const sessionId = this.resolveSessionForPermission(originator);
		const message: CWIChannelGroupedPermissionRequestMessage = {
			type: "cwi-grouped-permission-request",
			requestID,
			originator,
			permissions,
			...(sessionId ? createChannelEnvelope(sessionId) : {}),
		};
		this.postToChannel(message);
	}

	sendCounterpartyPermissionRequest(
		requestID: string,
		originator: string,
		counterparty: string,
		permissions: unknown,
	): void {
		const sessionId = this.resolveSessionForPermission(originator);
		const message: CWIChannelCounterpartyPermissionRequestMessage = {
			type: "cwi-counterparty-permission-request",
			requestID,
			originator,
			counterparty,
			permissions,
			...(sessionId ? createChannelEnvelope(sessionId) : {}),
		};
		this.postToChannel(message);
	}

	private async handleGrantGrouped(
		wallet: WalletPermissionsManager,
		data: CWIChannelGrantGroupedPermissionMessage,
	): Promise<void> {
		try {
			await wallet.grantGroupedPermission({
				requestID: data.requestID,
				granted: data.granted as Record<string, unknown>,
			});
		} catch (error) {
			console.warn("[CWI-RELAY] grantGroupedPermission failed", error);
		}
	}

	private async handleGrantCounterparty(
		wallet: WalletPermissionsManager,
		data: CWIChannelGrantCounterpartyPermissionMessage,
	): Promise<void> {
		try {
			await wallet.grantCounterpartyPermission({
				requestID: data.requestID,
				granted: data.granted as Record<string, unknown>,
			});
		} catch (error) {
			console.warn("[CWI-RELAY] grantCounterpartyPermission failed", error);
		}
	}

	/**
	 * Grant permission with fallback: if the on-chain token creation fails
	 * (e.g. no funds), manually hydrate WPM's in-memory cache and persist
	 * the grant to IndexedDB so it survives reloads.
	 */
	private async handleGrant(
		wallet: WalletPermissionsManager,
		requestID: string,
		sessionId?: string,
	): Promise<void> {
		const pending = this.pendingPermissions.get(requestID);
		if (!pending) return;
		if (pending.sessionId && pending.sessionId !== sessionId) return;
		const request = pending.request;
		const key = buildPermissionCacheKey(request as PermissionRequestLike);
		let didFallback = false;

		try {
			await wallet.grantPermission({ requestID, ephemeral: false });
			this.pendingPermissions.delete(requestID);
			return;
		} catch (error) {
			if (!this.shouldFallbackToLocalGrant(error)) {
				this.pendingPermissions.delete(requestID);
				console.warn(
					"[CWIRelay] grantPermission failed without local fallback",
					{
						requestID,
						error,
					},
				);
				return;
			}

			// On-chain token creation failed (likely no funds).
			// The wallet operation already resolved (WPM resolves promises first),
			// but cachePermission and markRecentGrant were skipped. Hydrate manually.
			if (key) {
				const cache = (
					wallet as unknown as {
						permissionCache: Map<string, { expiry: number; cachedAt: number }>;
					}
				).permissionCache;
				cache.set(key, { expiry: 0, cachedAt: Date.now() });

				const recentGrants = (
					wallet as unknown as { recentGrants: Map<string, number> }
				).recentGrants;
				if (request.type !== "spending") {
					recentGrants.set(key, Date.now() + 15_000);
				}
				didFallback = true;
			}
		}

		// Persist fallback grants to IndexedDB so they survive reloads.
		if (didFallback && key) {
			const scope = this.getPersistenceScope();
			if (scope) {
				await saveLocalPermission(scope, {
					key,
					type: request.type,
					originator: request.originator,
					expiry: 0,
					grantedAt: Date.now(),
					details: request as unknown as Record<string, unknown>,
				});
			}
		}

		this.pendingPermissions.delete(requestID);
	}

	private async handleDeny(
		wallet: WalletPermissionsManager,
		requestID: string,
		sessionId?: string,
	): Promise<void> {
		const pending = this.pendingPermissions.get(requestID);
		if (pending?.sessionId && pending.sessionId !== sessionId) return;
		this.pendingPermissions.delete(requestID);
		try {
			await wallet.denyPermission(requestID);
		} catch (error) {
			console.warn("[CWIRelay] denyPermission failed", { requestID, error });
		}
	}

	private shouldFallbackToLocalGrant(error: unknown): boolean {
		if (!(error instanceof Error)) return false;
		const message = error.message.toLowerCase();
		if (message.includes("request id not found")) return false;
		return (
			message.includes("insufficient") ||
			message.includes("no funds") ||
			message.includes("not enough") ||
			message.includes("utxo") ||
			message.includes("satoshi") ||
			message.includes("input")
		);
	}

	private async handleCWIRequest(
		data: CWIChannelRequestMessage,
	): Promise<void> {
		const { id, call, args, originator } = data;
		const sessionId = this.getMessageSessionId(data);
		this.activeInvocationCount += 1;
		this.touchActiveSession(sessionId);

		try {
			if (!isAllowedMethod(call)) {
				this.sendResponse(
					{
						id,
						status: "error",
						description: `Unknown method: ${call}`,
						code: 2,
					},
					sessionId,
				);
				return;
			}

			if (!isValidOrigin(originator)) {
				this.sendResponse(
					{
						id,
						status: "error",
						description: "Invalid originator",
						code: 2,
					},
					sessionId,
				);
				return;
			}

			// Auth methods are exempt from the locked check — they exist
			// specifically to query/wait for authentication state.
			const AUTH_EXEMPT =
				call === "waitForAuthentication" || call === "isAuthenticated";

			if (!AUTH_EXEMPT) {
				const status = this.getStatus();
				const wallet = this.getWallet();
				if (!wallet || status !== "unlocked") {
					this.sendResponse(
						{
							id,
							status: "error",
							description:
								status === "locked"
									? "Wallet is locked"
									: "Wallet not available",
							code: 1,
						},
						sessionId,
					);
					return;
				}
			} else {
				// For auth methods when wallet isn't available yet, handle inline.
				const wallet = this.getWallet();
				if (!wallet) {
					if (call === "isAuthenticated") {
						this.sendResponse(
							{
								id,
								result: { authenticated: false },
							},
							sessionId,
						);
						return;
					}
					// waitForAuthentication: poll until WPM becomes available
					const started = Date.now();
					const poll = (): void => {
						if (this.isStopped) return;
						const w = this.getWallet();
						if (w) {
							// WPM available — delegate to normal flow
							void this.dispatchToWallet(
								w,
								id,
								call,
								args,
								originator,
								sessionId,
							);
							return;
						}
						if (Date.now() - started > 30_000) {
							this.sendResponse(
								{
									id,
									status: "error",
									description: "Wallet not available (timeout)",
									code: 1,
								},
								sessionId,
							);
							return;
						}
						const timer = setTimeout(() => {
							this.authPollTimers.delete(timer);
							poll();
						}, 500);
						this.authPollTimers.add(timer);
					};
					poll();
					return;
				}
			}

			// At this point, wallet is guaranteed available (non-exempt checked above,
			// exempt with null wallet already handled with early return/poll).
			const wallet = this.getWallet();
			if (!wallet) {
				this.sendResponse(
					{
						id,
						status: "error",
						description: "Wallet not available",
						code: 1,
					},
					sessionId,
				);
				return;
			}
			await this.dispatchToWallet(
				wallet,
				id,
				call,
				args,
				originator,
				sessionId,
			);
		} finally {
			this.activeInvocationCount = Math.max(0, this.activeInvocationCount - 1);
			this.touchActiveSession(sessionId);
		}
	}

	private async dispatchToWallet(
		wallet: WalletPermissionsManager,
		id: string,
		call: string,
		args: unknown,
		originator: string,
		sessionId?: string,
	): Promise<void> {
		const context = { originator, sessionId };
		this.invocationContextStack.push(context);
		try {
			if (call === "getBalance") {
				const result = await this.getBalance();
				this.sendResponse({ id, result }, sessionId);
				return;
			}

			// TODO(cwi): Add stronger relay authentication between bridge and wallet tab.
			// BroadcastChannel is same-origin but does not provide session identity.
			const method = call as keyof WalletPermissionsManager;
			const fn = wallet[method];
			if (typeof fn !== "function") {
				this.sendResponse(
					{
						id,
						status: "error",
						description: `Method not callable: ${call}`,
						code: 2,
					},
					sessionId,
				);
				return;
			}

			const result = await (fn as (...a: unknown[]) => unknown).call(
				wallet,
				args ?? {},
				originator,
			);

			this.sendResponse({ id, result }, sessionId);
		} catch (err: unknown) {
			const description = err instanceof Error ? err.message : String(err);
			const code =
				typeof (err as { code?: unknown })?.code === "number"
					? (err as { code: number }).code
					: 1;

			this.sendResponse(
				{
					id,
					status: "error",
					description,
					code,
				},
				sessionId,
			);
		} finally {
			const index = this.invocationContextStack.lastIndexOf(context);
			if (index >= 0) {
				this.invocationContextStack.splice(index, 1);
			}
		}
	}

	private sendResponse(
		response: Omit<CWIChannelResponseMessage, "type" | "version" | "sessionId">,
		sessionId?: string,
	): void {
		const message: CWIChannelResponseMessage = {
			type: "cwi-response",
			...response,
			...(sessionId ? createChannelEnvelope(sessionId) : {}),
		};
		this.postToChannel(message);
	}

	private postToChannel(
		message:
			| CWIChannelResponseMessage
			| CWIChannelStatusMessage
			| CWIChannelPermissionRequestMessage
			| CWIChannelGroupedPermissionRequestMessage
			| CWIChannelCounterpartyPermissionRequestMessage,
	): boolean {
		if (this.isStopped || !this.channel) return false;
		try {
			this.channel.postMessage(message);
			return true;
		} catch {
			return false;
		}
	}

	private getMessageSessionId(
		message: CWIChannelBaseMessage,
	): string | undefined {
		return isV2ChannelMessage(message) ? message.sessionId : undefined;
	}

	private acceptSession(message: CWIChannelBaseMessage): boolean {
		if (isV2ChannelMessage(message)) {
			if (!this.activeSessionId || this.activeSessionId === message.sessionId) {
				this.touchActiveSession(message.sessionId);
				return true;
			}
			if (this.canSwitchSession()) {
				this.touchActiveSession(message.sessionId);
				return true;
			}
			return false;
		}

		// Legacy v1 messages are accepted only when no v2 session is active.
		if (message.version == null && message.sessionId == null) {
			return this.activeSessionId == null;
		}
		return false;
	}

	private canSwitchSession(): boolean {
		if (!this.activeSessionId) return true;
		if (this.activeInvocationCount > 0) return false;
		if (this.pendingPermissions.size > 0) return false;
		if (this.authPollTimers.size > 0) return false;
		return true;
	}

	private touchActiveSession(sessionId?: string): void {
		if (!sessionId) return;
		this.activeSessionId = sessionId;
	}

	private resolveSessionForPermission(originator: string): string | undefined {
		for (let i = this.invocationContextStack.length - 1; i >= 0; i--) {
			const context = this.invocationContextStack[i];
			if (context.originator === originator) {
				return context.sessionId;
			}
		}
		return this.activeSessionId ?? undefined;
	}
}
