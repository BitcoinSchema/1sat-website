import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	// P2P trade sessions
	trades: defineTable({
		sessionId: v.string(),
		initiatorId: v.string(),
		participantId: v.string(),
		initiatorItems: v.array(
			v.object({
				id: v.string(),
				name: v.string(),
				type: v.string(),
				amount: v.optional(v.string()),
				image: v.string(),
				utxo: v.optional(
					v.object({
						txid: v.string(),
						vout: v.number(),
						satoshis: v.number(),
					}),
				),
			}),
		),
		participantItems: v.array(
			v.object({
				id: v.string(),
				name: v.string(),
				type: v.string(),
				amount: v.optional(v.string()),
				image: v.string(),
				utxo: v.optional(
					v.object({
						txid: v.string(),
						vout: v.number(),
						satoshis: v.number(),
					}),
				),
			}),
		),
		initiatorLocked: v.boolean(),
		participantLocked: v.boolean(),
		transactionHex: v.optional(v.string()),
		status: v.union(
			v.literal("negotiating"),
			v.literal("ready"),
			v.literal("completed"),
			v.literal("cancelled"),
		),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_sessionId", ["sessionId"])
		.index("by_initiatorId", ["initiatorId"])
		.index("by_participantId", ["participantId"]),

	// Trade requests (pending invitations)
	tradeRequests: defineTable({
		fromUserId: v.string(),
		toUserId: v.string(),
		status: v.union(
			v.literal("pending"),
			v.literal("accepted"),
			v.literal("declined"),
		),
		sessionId: v.optional(v.string()), // Set when accepted
		createdAt: v.number(),
	})
		.index("by_toUserId", ["toUserId"])
		.index("by_fromUserId", ["fromUserId"]),

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
