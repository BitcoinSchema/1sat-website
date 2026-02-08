import { v } from "convex/values";
import { action } from "./_generated/server";

function getSigmaAuthUrl(): string {
	const url = process.env.NEXT_PUBLIC_SIGMA_AUTH_URL;
	if (!url) {
		throw new Error(
			"NEXT_PUBLIC_SIGMA_AUTH_URL environment variable is required"
		);
	}
	return url;
}

/**
 * Verify a Sigma Identity access token by calling the userinfo endpoint.
 * Returns the user's identity (sub, bap_id, etc.) or throws if invalid.
 */
export async function verifyAccessToken(token: string): Promise<{
	sub: string;
	bap_id?: string;
	name?: string;
	email?: string;
}> {
	const response = await fetch(
		`${getSigmaAuthUrl()}/api/auth/oauth2/userinfo`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);

	if (!response.ok) {
		throw new Error("Invalid or expired access token");
	}

	return response.json();
}

/**
 * Convex action to verify a caller's identity.
 * Clients pass their access token; this action validates it and returns the user identity.
 */
export const verifyIdentity = action({
	args: {
		accessToken: v.string(),
	},
	handler: async (_ctx, args) => {
		return verifyAccessToken(args.accessToken);
	},
});
