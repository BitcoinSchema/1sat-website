import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

type RequestStatus =
	| "pending"
	| "approved"
	| "denied"
	| "error"
	| "exchanged"
	| "expired";

interface AuthRequestRecord {
	_id: unknown;
	requestId: string;
	origin: string;
	redirectUri: string;
	call: string;
	args: unknown;
	argsHash: string;
	state: string;
	nonce: string;
	codeChallenge: string;
	codeChallengeMethod: "S256";
	status: RequestStatus;
	error?: string;
	errorDescription?: string;
	expiresAt: number;
	createdAt: number;
	updatedAt: number;
}

interface AuthCodeRecord {
	_id: unknown;
	codeId: string;
	requestId: string;
	origin: string;
	redirectUri: string;
	resultCiphertext?: string;
	error?: string;
	errorDescription?: string;
	consumedAt?: number;
	expiresAt: number;
	createdAt: number;
}

interface IndexRangeBuilderCompat {
	eq: (field: string, value: unknown) => unknown;
}

interface QueryCursorCompat<T> {
	first: () => Promise<T | null>;
	order: (direction: "asc" | "desc") => {
		take: (limit: number) => Promise<T[]>;
	};
}

interface QueryCompat<T> {
	withIndex: (
		indexName: string,
		builder: (query: IndexRangeBuilderCompat) => unknown,
	) => QueryCursorCompat<T>;
}

interface DbCompat {
	query: (tableName: string) => QueryCompat<unknown>;
	insert: (
		tableName: string,
		document: Record<string, unknown>,
	) => Promise<unknown>;
	patch: (id: unknown, document: Record<string, unknown>) => Promise<void>;
}

const asDb = (db: unknown): DbCompat => db as DbCompat;

const requestStatusValidator = v.union(
	v.literal("pending"),
	v.literal("approved"),
	v.literal("denied"),
	v.literal("error"),
	v.literal("exchanged"),
	v.literal("expired"),
);

const decisionValidator = v.union(
	v.literal("approved"),
	v.literal("denied"),
	v.literal("error"),
);

const findRequestById = async (
	db: DbCompat,
	requestId: string,
): Promise<AuthRequestRecord | null> =>
	(await db
		.query("cwiAuthRequests")
		.withIndex("by_requestId", (q) => q.eq("requestId", requestId))
		.first()) as AuthRequestRecord | null;

const findCodeById = async (
	db: DbCompat,
	codeId: string,
): Promise<AuthCodeRecord | null> =>
	(await db
		.query("cwiAuthCodes")
		.withIndex("by_codeId", (q) => q.eq("codeId", codeId))
		.first()) as AuthCodeRecord | null;

export const createAuthRequest = mutation({
	args: {
		requestId: v.string(),
		origin: v.string(),
		redirectUri: v.string(),
		call: v.string(),
		args: v.any(),
		argsHash: v.string(),
		state: v.string(),
		nonce: v.string(),
		codeChallenge: v.string(),
		codeChallengeMethod: v.literal("S256"),
		expiresAt: v.number(),
		createdAt: v.number(),
	},
	handler: async (ctx, args) => {
		const db = asDb(ctx.db);
		const existing = await findRequestById(db, args.requestId);

		if (existing) {
			return {
				ok: false,
				error: "invalid_request",
				errorDescription: "request_id_collision",
			};
		}

		await db.insert("cwiAuthRequests", {
			requestId: args.requestId,
			origin: args.origin,
			redirectUri: args.redirectUri,
			call: args.call,
			args: args.args,
			argsHash: args.argsHash,
			state: args.state,
			nonce: args.nonce,
			codeChallenge: args.codeChallenge,
			codeChallengeMethod: args.codeChallengeMethod,
			status: "pending",
			expiresAt: args.expiresAt,
			createdAt: args.createdAt,
			updatedAt: args.createdAt,
		});

		return { ok: true };
	},
});

export const getAuthRequest = query({
	args: {
		requestId: v.string(),
	},
	handler: async (ctx, args) => {
		const db = asDb(ctx.db);
		const request = await findRequestById(db, args.requestId);
		return request ?? null;
	},
});

export const completeAuthRequest = mutation({
	args: {
		requestId: v.string(),
		decision: decisionValidator,
		now: v.number(),
		codeId: v.optional(v.string()),
		codeExpiresAt: v.optional(v.number()),
		resultCiphertext: v.optional(v.string()),
		error: v.optional(v.string()),
		errorDescription: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const db = asDb(ctx.db);
		const request = await findRequestById(db, args.requestId);

		if (!request) {
			return {
				ok: false,
				error: "invalid_request",
				errorDescription: "authorization_request_not_found",
			};
		}

		if (request.expiresAt <= args.now) {
			await db.patch(request._id, {
				status: "expired",
				updatedAt: args.now,
			});
			return {
				ok: false,
				error: "invalid_request",
				errorDescription: "authorization_request_expired",
			};
		}

		if (request.status !== "pending") {
			return {
				ok: false,
				error: "invalid_request",
				errorDescription: "authorization_request_already_completed",
			};
		}

		if (args.decision === "approved") {
			if (!args.codeId || !args.codeExpiresAt || !args.resultCiphertext) {
				return {
					ok: false,
					error: "invalid_request",
					errorDescription: "missing_approval_payload",
				};
			}
			const existingCode = await findCodeById(db, args.codeId);
			if (existingCode) {
				return {
					ok: false,
					error: "invalid_request",
					errorDescription: "code_id_collision",
				};
			}

			await db.insert("cwiAuthCodes", {
				codeId: args.codeId,
				requestId: request.requestId,
				origin: request.origin,
				redirectUri: request.redirectUri,
				resultCiphertext: args.resultCiphertext,
				expiresAt: args.codeExpiresAt,
				createdAt: args.now,
			});

			await db.patch(request._id, {
				status: "approved",
				error: undefined,
				errorDescription: undefined,
				updatedAt: args.now,
			});

			return {
				ok: true,
				redirectUri: request.redirectUri,
				state: request.state,
				codeId: args.codeId,
			};
		}

		const error = args.error ?? "access_denied";
		const errorDescription =
			args.errorDescription ??
			(args.decision === "denied"
				? "The user denied the request."
				: "The wallet could not complete the request.");
		const status: Extract<RequestStatus, "denied" | "error"> =
			args.decision === "denied" ? "denied" : "error";

		await db.patch(request._id, {
			status,
			error,
			errorDescription,
			updatedAt: args.now,
		});

		return {
			ok: true,
			redirectUri: request.redirectUri,
			state: request.state,
			error,
			errorDescription,
		};
	},
});

export const exchangeAuthCode = mutation({
	args: {
		codeId: v.string(),
		now: v.number(),
		origin: v.string(),
		redirectUri: v.string(),
		codeVerifier: v.string(),
		codeVerifierS256: v.string(),
	},
	handler: async (ctx, args) => {
		const db = asDb(ctx.db);
		const code = await findCodeById(db, args.codeId);

		if (!code) {
			return {
				ok: false,
				error: "invalid_grant",
				errorDescription: "authorization_code_not_found",
			};
		}

		if (code.expiresAt <= args.now) {
			const requestForExpiry = await findRequestById(db, code.requestId);
			if (requestForExpiry && requestForExpiry.status === "approved") {
				await db.patch(requestForExpiry._id, {
					status: "expired",
					updatedAt: args.now,
				});
			}
			return {
				ok: false,
				error: "invalid_grant",
				errorDescription: "authorization_code_expired",
			};
		}

		if (code.consumedAt) {
			return {
				ok: false,
				error: "invalid_grant",
				errorDescription: "authorization_code_already_consumed",
			};
		}

		if (code.origin !== args.origin || code.redirectUri !== args.redirectUri) {
			return {
				ok: false,
				error: "invalid_grant",
				errorDescription: "origin_or_redirect_mismatch",
			};
		}

		const request = await findRequestById(db, code.requestId);
		if (!request) {
			return {
				ok: false,
				error: "invalid_grant",
				errorDescription: "authorization_request_not_found",
			};
		}

		// Only S256 is supported
		const expectedChallenge = args.codeVerifierS256;
		if (expectedChallenge !== request.codeChallenge) {
			return {
				ok: false,
				error: "invalid_grant",
				errorDescription: "pkce_verifier_mismatch",
			};
		}

		await db.patch(code._id, {
			consumedAt: args.now,
		});
		await db.patch(request._id, {
			status: "exchanged",
			updatedAt: args.now,
		});

		return {
			ok: true,
			resultCiphertext: code.resultCiphertext ?? null,
			error: code.error ?? null,
			errorDescription: code.errorDescription ?? null,
		};
	},
});

export const listAuthRequestsByStatus = query({
	args: {
		status: requestStatusValidator,
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const db = asDb(ctx.db);
		const records = (await db
			.query("cwiAuthRequests")
			.withIndex("by_status", (q) => q.eq("status", args.status))
			.order("desc")
			.take(args.limit ?? 50)) as AuthRequestRecord[];
		return records;
	},
});

interface IndexLtBuilder {
	eq: (field: string, value: unknown) => unknown;
	lt: (field: string, value: unknown) => unknown;
}

interface RangeQueryCursor<T> {
	collect: () => Promise<T[]>;
	take: (limit: number) => Promise<T[]>;
}

interface RangeQuery<T> {
	withIndex: (
		indexName: string,
		builder: (q: IndexLtBuilder) => unknown,
	) => RangeQueryCursor<T>;
}

interface RangeDb {
	query: (tableName: string) => RangeQuery<{ _id: unknown }>;
	delete: (id: unknown) => Promise<void>;
}

const asRangeDb = (db: unknown): RangeDb => db as RangeDb;

const CLEANUP_BATCH_SIZE = 100;

export const deleteExpiredRecords = internalMutation({
	args: {},
	handler: async (ctx) => {
		const db = asRangeDb(ctx.db);
		const now = Date.now();
		let deleted = 0;

		const expiredRequests = await db
			.query("cwiAuthRequests")
			.withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
			.take(CLEANUP_BATCH_SIZE);

		for (const record of expiredRequests) {
			await db.delete(record._id);
			deleted++;
		}

		const expiredCodes = await db
			.query("cwiAuthCodes")
			.withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
			.take(CLEANUP_BATCH_SIZE);

		for (const record of expiredCodes) {
			await db.delete(record._id);
			deleted++;
		}

		return { deleted };
	},
});
