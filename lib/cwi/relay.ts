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

const CHANNEL_NAME = "1sat-cwi";

export interface CWIRelayConfig {
	getWallet: () => WalletPermissionsManager | null;
	getStatus: () => "locked" | "unlocked" | "no-wallet";
	getPersistenceScope: () => PermissionScope | null;
	getBalance: () => Promise<{ satoshis: number; usd?: number }>;
}

type CWIWalletMethod = keyof WalletPermissionsManager | "getBalance";

interface CWIRequestMessage {
	type: "cwi-request";
	id: string;
	call: string;
	args?: unknown;
	originator: string;
}

interface CWIGrantPermissionMessage {
	type: "cwi-permission-grant";
	requestID: string;
}

interface CWIDenyPermissionMessage {
	type: "cwi-permission-deny";
	requestID: string;
}

interface CWIStatusRequestMessage {
	type: "cwi-status-request";
}

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

const isCWIRequestMessage = (data: unknown): data is CWIRequestMessage =>
	isObjectRecord(data) &&
	data.type === "cwi-request" &&
	typeof data.id === "string" &&
	typeof data.call === "string" &&
	typeof data.originator === "string";

const isGrantPermissionMessage = (
	data: unknown,
): data is CWIGrantPermissionMessage =>
	isObjectRecord(data) &&
	data.type === "cwi-permission-grant" &&
	typeof data.requestID === "string";

const isDenyPermissionMessage = (
	data: unknown,
): data is CWIDenyPermissionMessage =>
	isObjectRecord(data) &&
	data.type === "cwi-permission-deny" &&
	typeof data.requestID === "string";

const isStatusRequestMessage = (
	data: unknown,
): data is CWIStatusRequestMessage =>
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
	private channel: BroadcastChannel;
	private handler: ((event: MessageEvent) => void) | null = null;
	private getWallet: () => WalletPermissionsManager | null;
	private getStatus: () => "locked" | "unlocked" | "no-wallet";
	private getPersistenceScope: () => PermissionScope | null;
	private getBalance: () => Promise<{ satoshis: number; usd?: number }>;
	private pendingPermissions = new Map<
		string,
		PermissionRequest & { requestID: string }
	>();

	constructor(config: CWIRelayConfig) {
		this.getWallet = config.getWallet;
		this.getStatus = config.getStatus;
		this.getPersistenceScope = config.getPersistenceScope;
		this.getBalance = config.getBalance;
		this.channel = new BroadcastChannel(CHANNEL_NAME);
	}

	start(): void {
		if (this.handler) return;

		this.handler = (event: MessageEvent) => {
			const data = event.data;
			if (!isObjectRecord(data)) return;

			if (isCWIRequestMessage(data)) {
				void this.handleCWIRequest(data);
				return;
			}

			if (isGrantPermissionMessage(data)) {
				const wallet = this.getWallet();
				if (!wallet) return;
				void this.handleGrant(wallet, data.requestID);
				return;
			}

			if (isDenyPermissionMessage(data)) {
				const wallet = this.getWallet();
				if (!wallet) return;
				void this.handleDeny(wallet, data.requestID);
				return;
			}

			if (isStatusRequestMessage(data)) {
				this.sendStatus();
			}
		};

		this.channel.addEventListener("message", this.handler);
	}

	stop(): void {
		if (this.handler) {
			this.channel.removeEventListener("message", this.handler);
			this.handler = null;
		}
		this.pendingPermissions.clear();
		this.channel.close();
	}

	sendStatus(): void {
		this.channel.postMessage({
			type: "cwi-status",
			status: this.getStatus(),
		});
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
		this.pendingPermissions.set(requestID, details);
		this.channel.postMessage({
			type: "cwi-permission-request",
			requestID,
			permissionType,
			originator,
			details,
		});
	}

	/**
	 * Grant permission with fallback: if the on-chain token creation fails
	 * (e.g. no funds), manually hydrate WPM's in-memory cache and persist
	 * the grant to IndexedDB so it survives reloads.
	 */
	private async handleGrant(
		wallet: WalletPermissionsManager,
		requestID: string,
	): Promise<void> {
		const request = this.pendingPermissions.get(requestID);
		if (!request) return;
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
	): Promise<void> {
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

	private async handleCWIRequest(data: CWIRequestMessage): Promise<void> {
		const { id, call, args, originator } = data;

		if (!isAllowedMethod(call)) {
			this.channel.postMessage({
				type: "cwi-response",
				id,
				status: "error",
				description: `Unknown method: ${call}`,
				code: 2,
			});
			return;
		}

		if (!isValidOrigin(originator)) {
			this.channel.postMessage({
				type: "cwi-response",
				id,
				status: "error",
				description: "Invalid originator",
				code: 2,
			});
			return;
		}

		const status = this.getStatus();
		const wallet = this.getWallet();
		if (!wallet || status !== "unlocked") {
			this.channel.postMessage({
				type: "cwi-response",
				id,
				status: "error",
				description:
					status === "locked" ? "Wallet is locked" : "Wallet not available",
				code: 1,
			});
			return;
		}

		try {
			if (call === "getBalance") {
				const result = await this.getBalance();
				this.channel.postMessage({
					type: "cwi-response",
					id,
					result,
				});
				return;
			}

			// TODO(cwi): Add stronger relay authentication between bridge and wallet tab.
			// BroadcastChannel is same-origin but does not provide session identity.
			const method = call as keyof WalletPermissionsManager;
			const fn = wallet[method];
			if (typeof fn !== "function") {
				this.channel.postMessage({
					type: "cwi-response",
					id,
					status: "error",
					description: `Method not callable: ${call}`,
					code: 2,
				});
				return;
			}

			const result = await (fn as (...a: unknown[]) => unknown).call(
				wallet,
				args ?? {},
				originator,
			);

			this.channel.postMessage({
				type: "cwi-response",
				id,
				result,
			});
		} catch (err: unknown) {
			const description = err instanceof Error ? err.message : String(err);
			const code =
				typeof (err as { code?: unknown })?.code === "number"
					? (err as { code: number }).code
					: 1;

			this.channel.postMessage({
				type: "cwi-response",
				id,
				status: "error",
				description,
				code,
			});
		}
	}
}
