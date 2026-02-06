import type { FunctionReference } from "convex/server";
import { makeFunctionReference } from "convex/server";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { verifyAccessToken } from "./auth";

/**
 * Authenticated trade actions.
 *
 * These actions verify the caller's Sigma Identity access token before
 * delegating to the underlying trade mutations. This prevents spoofing --
 * the caller must prove ownership of the userId they claim.
 */

type PublicMutationRef = FunctionReference<
	"mutation",
	"public",
	Record<string, unknown>,
	unknown
>;

type TradeSessionSummary = {
	initiatorId: string;
	participantId: string;
} | null;

const tradesApi: {
	createTradeSession: PublicMutationRef;
	updateTradeOffer: PublicMutationRef;
	completeTrade: PublicMutationRef;
	sendTradeRequest: PublicMutationRef;
	getTradeSession: FunctionReference<
		"query",
		"public",
		Record<string, unknown>,
		TradeSessionSummary
	>;
} = {
	createTradeSession: makeFunctionReference("trades:createTradeSession"),
	updateTradeOffer: makeFunctionReference("trades:updateTradeOffer"),
	completeTrade: makeFunctionReference("trades:completeTrade"),
	sendTradeRequest: makeFunctionReference("trades:sendTradeRequest"),
	getTradeSession: makeFunctionReference("trades:getTradeSession"),
};

export const createTradeSession = action({
	args: {
		accessToken: v.string(),
		participantId: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await verifyAccessToken(args.accessToken);
		return ctx.runMutation(tradesApi.createTradeSession, {
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
		return ctx.runMutation(tradesApi.updateTradeOffer, {
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
		const identity = await verifyAccessToken(args.accessToken);
		const trade = await ctx.runQuery(tradesApi.getTradeSession, {
			sessionId: args.sessionId,
		});
		if (!trade) {
			throw new Error("Trade session not found");
		}
		if (
			trade.initiatorId !== identity.sub &&
			trade.participantId !== identity.sub
		) {
			throw new Error("User not part of this trade");
		}

		return ctx.runMutation(tradesApi.completeTrade, {
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
		return ctx.runMutation(tradesApi.sendTradeRequest, {
			fromUserId: identity.sub,
			toUserId: args.toUserId,
		});
	},
});
