import { v } from "convex/values";
import type { TradeItem } from "../lib/types/trades";
import { mutation, query } from "./_generated/server";

// Create a new trade session
export const createTradeSession = mutation({
	args: {
		initiatorId: v.string(),
		participantId: v.string(),
	},
	handler: async (ctx, args) => {
		const sessionId = `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const now = Date.now();

		const tradeId = await ctx.db.insert("trades", {
			sessionId,
			initiatorId: args.initiatorId,
			participantId: args.participantId,
			initiatorItems: [],
			participantItems: [],
			initiatorLocked: false,
			participantLocked: false,
			status: "negotiating",
			createdAt: now,
			updatedAt: now,
		});

		return { sessionId, tradeId };
	},
});

// Update trade offer (add/remove items, lock status)
export const updateTradeOffer = mutation({
	args: {
		sessionId: v.string(),
		userId: v.string(),
		items: v.array(
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
		locked: v.boolean(),
	},
	handler: async (ctx, args) => {
		const trade = await ctx.db
			.query("trades")
			.withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
			.first();

		if (!trade) {
			throw new Error("Trade session not found");
		}

		const isInitiator = trade.initiatorId === args.userId;
		const isParticipant = trade.participantId === args.userId;

		if (!isInitiator && !isParticipant) {
			throw new Error("User not part of this trade");
		}

		const updates: {
			updatedAt: number;
			initiatorItems?: TradeItem[];
			participantItems?: TradeItem[];
			initiatorLocked?: boolean;
			participantLocked?: boolean;
			status?: "ready" | "negotiating";
		} = { updatedAt: Date.now() };

		if (isInitiator) {
			updates.initiatorItems = args.items as TradeItem[];
			updates.initiatorLocked = args.locked;
		} else {
			updates.participantItems = args.items as TradeItem[];
			updates.participantLocked = args.locked;
		}

		// Update status if both are locked
		if (
			(isInitiator && args.locked && trade.participantLocked) ||
			(isParticipant && args.locked && trade.initiatorLocked)
		) {
			updates.status = "ready";
		} else if (!args.locked) {
			updates.status = "negotiating";
		}

		await ctx.db.patch(trade._id, updates);
	},
});

// Store transaction hex
export const updateTransaction = mutation({
	args: {
		sessionId: v.string(),
		transactionHex: v.string(),
	},
	handler: async (ctx, args) => {
		const trade = await ctx.db
			.query("trades")
			.withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
			.first();

		if (!trade) {
			throw new Error("Trade session not found");
		}

		await ctx.db.patch(trade._id, {
			transactionHex: args.transactionHex,
			updatedAt: Date.now(),
		});
	},
});

// Complete trade
export const completeTrade = mutation({
	args: {
		sessionId: v.string(),
	},
	handler: async (ctx, args) => {
		const trade = await ctx.db
			.query("trades")
			.withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
			.first();

		if (!trade) {
			throw new Error("Trade session not found");
		}

		await ctx.db.patch(trade._id, {
			status: "completed",
			updatedAt: Date.now(),
		});
	},
});

// Cancel trade (close dialog for both parties)
export const cancelTrade = mutation({
	args: {
		sessionId: v.string(),
	},
	handler: async (ctx, args) => {
		const trade = await ctx.db
			.query("trades")
			.withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
			.first();

		if (!trade) {
			throw new Error("Trade session not found");
		}

		await ctx.db.patch(trade._id, {
			status: "cancelled",
			updatedAt: Date.now(),
		});
	},
});

// Get trade session details
export const getTradeSession = query({
	args: {
		sessionId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("trades")
			.withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
			.first();
	},
});

// List all active trades for a user
export const listUserTrades = query({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		// Get trades where user is initiator
		const initiatorTrades = await ctx.db
			.query("trades")
			.withIndex("by_initiatorId", (q) => q.eq("initiatorId", args.userId))
			.collect();

		// Get trades where user is participant
		const participantTrades = await ctx.db
			.query("trades")
			.withIndex("by_participantId", (q) => q.eq("participantId", args.userId))
			.collect();

		// Combine and filter for active trades
		const allTrades = [...initiatorTrades, ...participantTrades];
		return allTrades.filter((trade) => trade.status !== "completed");
	},
});

// Send a trade request to another user
export const sendTradeRequest = mutation({
	args: {
		fromUserId: v.string(),
		toUserId: v.string(),
	},
	handler: async (ctx, args) => {
		// Check if there's already a pending request between these users
		const existing = await ctx.db
			.query("tradeRequests")
			.filter((q) =>
				q.and(
					q.eq(q.field("fromUserId"), args.fromUserId),
					q.eq(q.field("toUserId"), args.toUserId),
					q.eq(q.field("status"), "pending"),
				),
			)
			.first();

		if (existing) {
			return { requestId: existing._id, alreadyExists: true };
		}

		const requestId = await ctx.db.insert("tradeRequests", {
			fromUserId: args.fromUserId,
			toUserId: args.toUserId,
			status: "pending",
			createdAt: Date.now(),
		});

		return { requestId, alreadyExists: false };
	},
});

// Get incoming trade requests for a user (subscribe to this for real-time notifications)
export const getIncomingTradeRequests = query({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("tradeRequests")
			.filter((q) =>
				q.and(
					q.eq(q.field("toUserId"), args.userId),
					q.eq(q.field("status"), "pending"),
				),
			)
			.order("desc")
			.collect();
	},
});

// Accept a trade request - creates a trade session
export const acceptTradeRequest = mutation({
	args: {
		requestId: v.id("tradeRequests"),
	},
	handler: async (ctx, args) => {
		const request = await ctx.db.get(args.requestId);
		if (!request) {
			throw new Error("Trade request not found");
		}

		// Create trade session
		const sessionId = `trade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const now = Date.now();

		const tradeId = await ctx.db.insert("trades", {
			sessionId,
			initiatorId: request.fromUserId,
			participantId: request.toUserId,
			initiatorItems: [],
			participantItems: [],
			initiatorLocked: false,
			participantLocked: false,
			status: "negotiating",
			createdAt: now,
			updatedAt: now,
		});

		// Update request status
		await ctx.db.patch(args.requestId, {
			status: "accepted",
			sessionId,
		});

		return { sessionId, tradeId };
	},
});

// Decline a trade request
export const declineTradeRequest = mutation({
	args: {
		requestId: v.id("tradeRequests"),
	},
	handler: async (ctx, args) => {
		const request = await ctx.db.get(args.requestId);
		if (!request) {
			throw new Error("Trade request not found");
		}

		await ctx.db.patch(args.requestId, {
			status: "declined",
		});
	},
});

// Cancel a sent trade request
export const cancelTradeRequest = mutation({
	args: {
		requestId: v.id("tradeRequests"),
	},
	handler: async (ctx, args) => {
		const request = await ctx.db.get(args.requestId);
		// If request doesn't exist, it was already canceled/deleted - just succeed silently
		if (!request) {
			return;
		}

		await ctx.db.delete(args.requestId);
	},
});

// Get accepted sent requests for a user (so initiator knows when their request was accepted)
export const getAcceptedSentRequests = query({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("tradeRequests")
			.filter((q) =>
				q.and(
					q.eq(q.field("fromUserId"), args.userId),
					q.eq(q.field("status"), "accepted"),
				),
			)
			.order("desc")
			.collect();
	},
});

// Get pending sent requests for a user (so initiator knows their request is waiting)
export const getPendingSentRequests = query({
	args: {
		userId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db
			.query("tradeRequests")
			.filter((q) =>
				q.and(
					q.eq(q.field("fromUserId"), args.userId),
					q.eq(q.field("status"), "pending"),
				),
			)
			.order("desc")
			.collect();
	},
});
