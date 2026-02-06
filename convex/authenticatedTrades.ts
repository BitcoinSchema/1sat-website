import { v } from "convex/values";
import { api } from "./_generated/api";
import { action } from "./_generated/server";
import { verifyAccessToken } from "./auth";

/**
 * Authenticated trade actions.
 *
 * These actions verify the caller's Sigma Identity access token before
 * delegating to the underlying trade mutations. This prevents spoofing --
 * the caller must prove ownership of the userId they claim.
 */

export const createTradeSession = action({
	args: {
		accessToken: v.string(),
		participantId: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await verifyAccessToken(args.accessToken);
		return ctx.runMutation(api.trades.createTradeSession, {
			initiatorId: identity.sub,
			participantId: args.participantId,
		});
	},
});

export const updateTradeOffer = action({
	args: {
		accessToken: v.string(),
		sessionId: v.string(),
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
		const identity = await verifyAccessToken(args.accessToken);
		return ctx.runMutation(api.trades.updateTradeOffer, {
			sessionId: args.sessionId,
			userId: identity.sub,
			items: args.items,
			locked: args.locked,
		});
	},
});

export const completeTrade = action({
	args: {
		accessToken: v.string(),
		sessionId: v.string(),
	},
	handler: async (ctx, args) => {
		// Verify token is valid (caller is authenticated)
		await verifyAccessToken(args.accessToken);
		return ctx.runMutation(api.trades.completeTrade, {
			sessionId: args.sessionId,
		});
	},
});

export const sendTradeRequest = action({
	args: {
		accessToken: v.string(),
		toUserId: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await verifyAccessToken(args.accessToken);
		return ctx.runMutation(api.trades.sendTradeRequest, {
			fromUserId: identity.sub,
			toUserId: args.toUserId,
		});
	},
});
