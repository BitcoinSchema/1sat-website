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
});
