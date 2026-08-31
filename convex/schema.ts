import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// CWI redirect fallback auth requests (OAuth-style)
	cwiAuthRequests: defineTable({
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
		status: v.union(
			v.literal("pending"),
			v.literal("approved"),
			v.literal("denied"),
			v.literal("error"),
			v.literal("exchanged"),
			v.literal("expired"),
		),
		error: v.optional(v.string()),
		errorDescription: v.optional(v.string()),
		errorCode: v.optional(v.number()),
		errorStack: v.optional(v.string()),
		expiresAt: v.number(),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_requestId", ["requestId"])
		.index("by_expiresAt", ["expiresAt"])
		.index("by_status", ["status"]),

	// CWI one-time auth codes for token exchange
	cwiAuthCodes: defineTable({
		codeId: v.string(),
		requestId: v.string(),
		origin: v.string(),
		redirectUri: v.string(),
		resultCiphertext: v.optional(v.string()),
		error: v.optional(v.string()),
		errorDescription: v.optional(v.string()),
		consumedAt: v.optional(v.number()),
		expiresAt: v.number(),
		createdAt: v.number(),
	})
		.index("by_codeId", ["codeId"])
		.index("by_requestId", ["requestId"])
		.index("by_expiresAt", ["expiresAt"]),
});
