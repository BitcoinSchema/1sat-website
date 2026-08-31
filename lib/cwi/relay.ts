import type {
	CounterpartyPermissions,
	GroupedPermissions,
	PermissionRequest,
	WalletPermissionsManager,
} from "@bsv/wallet-toolbox-client";
import { reportDiagnostic } from "../runtime-diagnostics";
import {
	CWI_CHANNEL_NAME,
	CWI_MAX_PENDING_GLOBAL,
	CWI_MAX_PENDING_PER_SESSION,
	CWI_MAX_REQUEST_IDS_PER_SESSION,
	type CWIChannelBaseMessage,
	type CWIChannelCounterpartyPermissionRequestMessage,
	type CWIChannelGroupedPermissionRequestMessage,
	type CWIChannelPermissionRequestMessage,
	type CWIChannelRequestMessage,
	type CWIChannelResponseMessage,
	type CWIChannelSessionOpenMessage,
	type CWIChannelStatusMessage,
	type CWIResult,
	type CWISessionEnvelope,
	createSessionEnvelope,
	isCWIStandardMethod,
	isSessionBaseMessage,
	isSessionEnvelope,
	isWithinCWIPayloadLimit,
	parseBrowserOrigin,
	toCWIErrorFields,
} from "./types";

export interface CWIRelayConfig {
	getWallet: () => WalletPermissionsManager | null;
	getStatus: () => "locked" | "unlocked" | "no-wallet";
}

interface RelaySession {
	sessionId: string;
	sessionToken: string;
	browserOrigin: string;
	originator: string;
	seenIds: Set<string>;
	active: number;
	lifecycle: AbortController;
}

type DecisionKind = "individual" | "grouped" | "counterparty";
interface PendingDecision {
	sessionId: string;
	kind: DecisionKind;
	permissionType?: PermissionRequest["type"];
	requestedSpendingAmount?: number;
}

const LEADER_LOCK_NAME = "1sat-cwi-wallet-leader-v3";

const lifecycleError = (description: string) =>
	Object.assign(new Error(description), { code: 1, description });

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const isRequest = (data: unknown): data is CWIChannelRequestMessage =>
	isObjectRecord(data) &&
	isSessionEnvelope(data) &&
	data.type === "cwi-request" &&
	typeof data.id === "string" &&
	data.id.length > 0 &&
	data.id.length <= 128 &&
	typeof data.call === "string";

const hasRequestID = (
	data: unknown,
	type: string,
): data is CWISessionEnvelope & {
	type: string;
	requestID: string;
	granted?: unknown;
	grant?: unknown;
	expiry?: unknown;
} =>
	isObjectRecord(data) &&
	isSessionEnvelope(data) &&
	data.type === type &&
	typeof data.requestID === "string" &&
	data.requestID.length > 0 &&
	data.requestID.length <= 128;

const parseExpiry = (value: unknown): number | undefined => {
	if (value === undefined) return undefined;
	if (!Number.isSafeInteger(value) || (value as number) < 0) {
		throw new Error("Invalid permission expiry.");
	}
	const expiry = value as number;
	if (expiry !== 0 && expiry <= Math.floor(Date.now() / 1000)) {
		throw new Error("Permission expiry must be in the future.");
	}
	return expiry;
};

const parseIndividualGrant = (
	pending: PendingDecision,
	value: unknown,
): { ephemeral: boolean; amount?: number; expiry?: number } => {
	if (value === undefined) {
		return { ephemeral: pending.permissionType === "spending" };
	}
	if (!isObjectRecord(value) || typeof value.ephemeral !== "boolean") {
		throw new Error("Invalid individual permission decision.");
	}
	const expiry = parseExpiry(value.expiry);
	if (pending.permissionType !== "spending") {
		if (value.amount !== undefined) {
			throw new Error("Amount is only valid for spending permission.");
		}
		return {
			ephemeral: value.ephemeral,
			...(expiry !== undefined ? { expiry } : {}),
		};
	}
	if (value.ephemeral) return { ephemeral: true };
	if (
		!Number.isSafeInteger(value.amount) ||
		value.amount !== pending.requestedSpendingAmount
	) {
		throw new Error("Standing spending amount must match the request.");
	}
	return { ephemeral: false, amount: value.amount as number };
};

/** Wallet-tab side of the hosted CWI transport. */
export class CWIRelay {
	private channel: BroadcastChannel | null = null;
	private handler: ((event: MessageEvent) => void) | null = null;
	private readonly getWallet: () => WalletPermissionsManager | null;
	private readonly getStatus: () => "locked" | "unlocked" | "no-wallet";
	private readonly relayId = crypto.randomUUID();
	private readonly sessions = new Map<string, RelaySession>();
	private readonly pendingDecisions = new Map<string, PendingDecision>();
	private currentContext: RelaySession | null = null;
	private activeGlobal = 0;
	private dispatchTail: Promise<void> = Promise.resolve();
	private releaseLeadership: (() => void) | null = null;
	private isLeader = false;
	private isStopped = false;

	constructor(config: CWIRelayConfig) {
		this.getWallet = config.getWallet;
		this.getStatus = config.getStatus;
		if (typeof BroadcastChannel !== "undefined") {
			this.channel = new BroadcastChannel(CWI_CHANNEL_NAME);
		}
	}

	start(): void {
		if (this.handler || !this.channel) return;
		this.isStopped = false;
		this.handler = (event) => this.handleMessage(event.data);
		this.channel.addEventListener("message", this.handler);
		this.acquireLeadership();
	}

	stop(): void {
		if (this.isLeader) {
			for (const session of this.sessions.values()) {
				this.postOwned(session, "cwi-leader-lost");
			}
		}
		this.isStopped = true;
		this.isLeader = false;
		this.releaseLeadership?.();
		this.releaseLeadership = null;
		for (const session of this.sessions.values()) {
			session.lifecycle.abort(
				lifecycleError("Wallet relay stopped; retry the request"),
			);
			this.cancelPendingDecisions(session.sessionId);
		}
		if (this.handler && this.channel) {
			this.channel.removeEventListener("message", this.handler);
		}
		this.handler = null;
		this.sessions.clear();
		this.pendingDecisions.clear();
		this.currentContext = null;
		this.activeGlobal = 0;
		this.channel?.close();
		this.channel = null;
	}

	sendStatus(): void {
		if (!this.isLeader) return;
		for (const session of this.sessions.values()) {
			const message: CWIChannelStatusMessage = {
				...this.envelope(session),
				type: "cwi-status",
				status: this.getStatus(),
			};
			this.postToChannel(message);
		}
	}

	sendPermissionRequest(
		requestID: string,
		permissionType: string,
		originator: string,
		details: PermissionRequest & { requestID: string },
	): void {
		const session = this.contextFor(originator);
		if (!session || this.pendingDecisions.has(requestID)) return;
		this.pendingDecisions.set(requestID, {
			sessionId: session.sessionId,
			kind: "individual",
			permissionType: details.type,
			...(details.type === "spending" &&
			Number.isSafeInteger(details.spending?.satoshis)
				? { requestedSpendingAmount: details.spending?.satoshis }
				: {}),
		});
		const message: CWIChannelPermissionRequestMessage = {
			...this.envelope(session),
			type: "cwi-permission-request",
			requestID,
			permissionType,
			details,
		};
		this.postToChannel(message);
	}

	sendGroupedPermissionRequest(
		requestID: string,
		originator: string,
		permissions: GroupedPermissions,
	): void {
		const session = this.contextFor(originator);
		if (!session || this.pendingDecisions.has(requestID)) return;
		this.pendingDecisions.set(requestID, {
			sessionId: session.sessionId,
			kind: "grouped",
		});
		const message: CWIChannelGroupedPermissionRequestMessage = {
			...this.envelope(session),
			type: "cwi-grouped-permission-request",
			requestID,
			permissions,
		};
		this.postToChannel(message);
	}

	sendCounterpartyPermissionRequest(
		requestID: string,
		originator: string,
		counterparty: string,
		permissions: CounterpartyPermissions,
	): void {
		const session = this.contextFor(originator);
		if (!session || this.pendingDecisions.has(requestID)) return;
		this.pendingDecisions.set(requestID, {
			sessionId: session.sessionId,
			kind: "counterparty",
		});
		const message: CWIChannelCounterpartyPermissionRequestMessage = {
			...this.envelope(session),
			type: "cwi-counterparty-permission-request",
			requestID,
			counterparty,
			permissions,
		};
		this.postToChannel(message);
	}

	private handleMessage(data: unknown): void {
		if (
			this.isStopped ||
			!isObjectRecord(data) ||
			!isWithinCWIPayloadLimit(data)
		)
			return;
		if (data.type === "cwi-session-open") {
			if (isSessionBaseMessage(data))
				this.openSession(data as CWIChannelSessionOpenMessage);
			return;
		}
		if (!this.isLeader || !isSessionEnvelope(data)) return;
		const session = this.ownedSession(data);
		if (!session) return;

		if (isRequest(data)) {
			this.acceptRequest(session, data);
			return;
		}
		if (data.type === "cwi-status-request") {
			const status: CWIChannelStatusMessage = {
				...this.envelope(session),
				type: "cwi-status",
				status: this.getStatus(),
			};
			this.postToChannel(status);
			return;
		}
		if (data.type === "cwi-session-close") {
			this.closeSession(session.sessionId);
			return;
		}

		if (hasRequestID(data, "cwi-permission-grant")) {
			void this.handleDecision(
				session,
				data.requestID,
				"individual",
				true,
				data.grant,
			);
		} else if (hasRequestID(data, "cwi-permission-deny")) {
			void this.handleDecision(session, data.requestID, "individual", false);
		} else if (hasRequestID(data, "cwi-grouped-permission-grant")) {
			void this.handleDecision(
				session,
				data.requestID,
				"grouped",
				true,
				data.granted,
				data.expiry,
			);
		} else if (hasRequestID(data, "cwi-grouped-permission-deny")) {
			void this.handleDecision(session, data.requestID, "grouped", false);
		} else if (hasRequestID(data, "cwi-counterparty-permission-grant")) {
			void this.handleDecision(
				session,
				data.requestID,
				"counterparty",
				true,
				data.granted,
				data.expiry,
			);
		} else if (hasRequestID(data, "cwi-counterparty-permission-deny")) {
			void this.handleDecision(session, data.requestID, "counterparty", false);
		}
	}

	private openSession(message: CWIChannelSessionOpenMessage): void {
		const identity = parseBrowserOrigin(message.browserOrigin);
		if (
			!identity ||
			identity.browserOrigin !== message.browserOrigin ||
			identity.originator !== message.originator ||
			message.sessionToken.length < 32
		)
			return;
		const existing = this.sessions.get(message.sessionId);
		if (existing && !this.sameSession(existing, message)) return;
		const session = existing ?? {
			sessionId: message.sessionId,
			sessionToken: message.sessionToken,
			browserOrigin: message.browserOrigin,
			originator: message.originator,
			seenIds: new Set<string>(),
			active: 0,
			lifecycle: new AbortController(),
		};
		this.sessions.set(session.sessionId, session);
		if (this.isLeader) this.acceptSession(session);
	}

	private acceptRequest(
		session: RelaySession,
		data: CWIChannelRequestMessage,
	): void {
		if (session.seenIds.has(data.id)) {
			this.sendResponse(session, {
				id: data.id,
				status: "error",
				code: 2,
				description: "Duplicate request id",
			});
			return;
		}
		if (session.seenIds.size >= CWI_MAX_REQUEST_IDS_PER_SESSION) {
			this.sendResponse(session, {
				id: data.id,
				status: "error",
				code: 1,
				description: "Session request limit reached",
			});
			return;
		}
		if (
			session.active >= CWI_MAX_PENDING_PER_SESSION ||
			this.activeGlobal >= CWI_MAX_PENDING_GLOBAL
		) {
			this.sendResponse(session, {
				id: data.id,
				status: "error",
				code: 1,
				description: "Wallet request limit reached",
			});
			return;
		}
		session.seenIds.add(data.id);
		session.active += 1;
		this.activeGlobal += 1;
		// ponytail: serialize wallet calls so permission callbacks always have one owner.
		this.dispatchTail = this.dispatchTail
			.then(() => this.handleCWIRequest(session, data))
			.catch(() => undefined)
			.finally(() => {
				session.active = Math.max(0, session.active - 1);
				this.activeGlobal = Math.max(0, this.activeGlobal - 1);
			});
	}

	private async handleCWIRequest(
		session: RelaySession,
		data: CWIChannelRequestMessage,
	): Promise<void> {
		if (!this.sessions.has(session.sessionId) || !this.isLeader) return;
		if (!isCWIStandardMethod(data.call)) {
			this.sendResponse(session, {
				id: data.id,
				status: "error",
				code: 2,
				description: `Unknown method: ${data.call}`,
			});
			return;
		}
		const authExempt =
			data.call === "waitForAuthentication" || data.call === "isAuthenticated";
		let wallet = this.getWallet();
		if (!wallet && data.call === "isAuthenticated") {
			this.sendResponse(session, {
				id: data.id,
				status: "success",
				result: { authenticated: false },
			});
			return;
		}
		if (!wallet && data.call === "waitForAuthentication") {
			wallet = await this.waitForWallet(session);
		}
		if (!wallet && session.lifecycle.signal.aborted) {
			this.sendResponse(session, {
				id: data.id,
				status: "error",
				...toCWIErrorFields(
					session.lifecycle.signal.reason,
					process.env.NODE_ENV !== "production",
				),
			});
			return;
		}
		if (!wallet || (!authExempt && this.getStatus() !== "unlocked")) {
			this.sendResponse(session, {
				id: data.id,
				status: "error",
				code: 1,
				description:
					this.getStatus() === "locked"
						? "Wallet is locked"
						: "Wallet not available",
			});
			return;
		}

		this.currentContext = session;
		try {
			const fn = wallet[data.call as keyof WalletPermissionsManager];
			if (typeof fn !== "function") {
				this.sendResponse(session, {
					id: data.id,
					status: "error",
					code: 2,
					description: `Method not callable: ${data.call}`,
				});
				return;
			}
			const result = await this.whileSessionLives(
				session,
				Promise.resolve(
					(fn as (...args: unknown[]) => unknown).call(
						wallet,
						data.args ?? {},
						session.originator,
					),
				),
			);
			this.sendResponse(session, { id: data.id, status: "success", result });
		} catch (error) {
			this.sendResponse(session, {
				id: data.id,
				status: "error",
				...toCWIErrorFields(error, process.env.NODE_ENV !== "production"),
			});
		} finally {
			this.currentContext = null;
		}
	}

	private async waitForWallet(
		session: RelaySession,
	): Promise<WalletPermissionsManager | null> {
		return new Promise((resolve) => {
			let timer: ReturnType<typeof setTimeout> | null = null;
			const finish = (wallet: WalletPermissionsManager | null): void => {
				if (timer !== null) clearTimeout(timer);
				session.lifecycle.signal.removeEventListener("abort", onAbort);
				resolve(wallet);
			};
			const onAbort = (): void => finish(null);
			const poll = (): void => {
				if (
					session.lifecycle.signal.aborted ||
					this.isStopped ||
					!this.isLeader ||
					!this.sessions.has(session.sessionId)
				) {
					finish(null);
					return;
				}
				const wallet = this.getWallet();
				if (wallet) {
					finish(wallet);
					return;
				}
				timer = setTimeout(() => {
					timer = null;
					poll();
				}, 500);
			};
			session.lifecycle.signal.addEventListener("abort", onAbort, {
				once: true,
			});
			poll();
		});
	}

	private whileSessionLives<T>(
		session: RelaySession,
		operation: Promise<T>,
	): Promise<T> {
		const { signal } = session.lifecycle;
		if (signal.aborted) return Promise.reject(signal.reason);
		return new Promise((resolve, reject) => {
			const onAbort = (): void => reject(signal.reason);
			signal.addEventListener("abort", onAbort, { once: true });
			operation.then(
				(result) => {
					signal.removeEventListener("abort", onAbort);
					resolve(result);
				},
				(error) => {
					signal.removeEventListener("abort", onAbort);
					reject(error);
				},
			);
		});
	}

	private async handleDecision(
		session: RelaySession,
		requestID: string,
		kind: DecisionKind,
		grant: boolean,
		granted?: unknown,
		expiryValue?: unknown,
	): Promise<void> {
		const pending = this.pendingDecisions.get(requestID);
		if (
			!pending ||
			pending.sessionId !== session.sessionId ||
			pending.kind !== kind
		)
			return;
		const wallet = this.getWallet();
		if (!wallet) return;
		let individualGrant:
			| { ephemeral: boolean; amount?: number; expiry?: number }
			| undefined;
		let expiry: number | undefined;
		try {
			if (grant && kind === "individual") {
				individualGrant = parseIndividualGrant(pending, granted);
			} else if (grant) {
				expiry = parseExpiry(expiryValue);
			}
		} catch {
			return;
		}
		if (grant && kind === "individual" && !individualGrant) return;
		this.pendingDecisions.delete(requestID);
		try {
			if (kind === "individual") {
				if (grant) {
					await wallet.grantPermission({
						requestID,
						...individualGrant,
					});
				} else await wallet.denyPermission(requestID);
			} else if (kind === "grouped") {
				if (grant) {
					await wallet.grantGroupedPermission({
						requestID,
						granted: granted as Partial<GroupedPermissions>,
						expiry,
					});
				} else await wallet.denyGroupedPermission(requestID);
			} else if (grant) {
				await wallet.grantCounterpartyPermission({
					requestID,
					granted: granted as Partial<CounterpartyPermissions>,
					expiry,
				});
			} else await wallet.denyCounterpartyPermission(requestID);
		} catch {
			reportDiagnostic({
				category: "provider",
				code: "provider.failed",
				operation: "cwi.permission.decision",
				recoverable: true,
				context: { provider: "hosted-cwi", retryable: true },
			});
		}
	}

	private contextFor(originator: string): RelaySession | null {
		const context = this.currentContext;
		return context?.originator === originator ? context : null;
	}

	private sendResponse(
		session: RelaySession,
		response: { id: string } & CWIResult,
	): void {
		const message: CWIChannelResponseMessage = {
			...this.envelope(session),
			type: "cwi-response",
			...response,
		};
		this.postToChannel(message);
	}

	private openLeadership(): void {
		if (this.isStopped) return;
		this.isLeader = true;
		for (const session of this.sessions.values()) this.acceptSession(session);
	}

	private acquireLeadership(): void {
		const locks =
			typeof navigator !== "undefined" ? navigator.locks : undefined;
		if (!locks) {
			// Tests and non-browser adapters have one relay. Browsers must provide
			// Web Locks; running multiple uncoordinated wallet leaders is unsafe.
			if (typeof window === "undefined") this.openLeadership();
			return;
		}
		void locks.request(LEADER_LOCK_NAME, async () => {
			if (this.isStopped) return;
			this.openLeadership();
			await new Promise<void>((resolve) => {
				this.releaseLeadership = resolve;
			});
			this.isLeader = false;
		});
	}

	private acceptSession(session: RelaySession): void {
		this.postOwned(session, "cwi-session-accept");
	}

	private closeSession(sessionId: string): void {
		const session = this.sessions.get(sessionId);
		session?.lifecycle.abort(
			lifecycleError("Wallet session closed; retry the request"),
		);
		this.cancelPendingDecisions(sessionId);
		this.sessions.delete(sessionId);
	}

	private cancelPendingDecisions(sessionId: string): void {
		const wallet = this.getWallet();
		for (const [requestID, pending] of this.pendingDecisions) {
			if (pending.sessionId !== sessionId) continue;
			this.pendingDecisions.delete(requestID);
			if (!wallet) continue;
			const cancellation =
				pending.kind === "individual"
					? wallet.denyPermission(requestID)
					: pending.kind === "grouped"
						? wallet.denyGroupedPermission(requestID)
						: wallet.denyCounterpartyPermission(requestID);
			void cancellation.catch(() => {
				reportDiagnostic({
					category: "provider",
					code: "provider.failed",
					operation: "cwi.permission.cancel",
					recoverable: false,
					context: { provider: "hosted-cwi", retryable: false },
				});
			});
		}
	}

	private ownedSession(message: CWISessionEnvelope): RelaySession | null {
		const session = this.sessions.get(message.sessionId);
		return session &&
			message.leaderId === this.relayId &&
			this.sameSession(session, message)
			? session
			: null;
	}

	private sameSession(
		session: RelaySession,
		message: CWIChannelBaseMessage,
	): boolean {
		return (
			session.sessionToken === message.sessionToken &&
			session.browserOrigin === message.browserOrigin &&
			session.originator === message.originator
		);
	}

	private envelope(session: RelaySession) {
		return createSessionEnvelope({
			sessionId: session.sessionId,
			sessionToken: session.sessionToken,
			browserOrigin: session.browserOrigin,
			originator: session.originator,
			leaderId: this.relayId,
		});
	}

	private postOwned(session: RelaySession, type: string): void {
		this.postToChannel({ ...this.envelope(session), type });
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
