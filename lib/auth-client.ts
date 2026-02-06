import type { SigmaUserInfo } from "@sigma-auth/better-auth-plugin/client";
import { sigmaClient } from "@sigma-auth/better-auth-plugin/client";
import { createAuthClient } from "better-auth/client";

function getBaseURL() {
	if (typeof window !== "undefined") {
		return `${window.location.origin}/api/auth`;
	}
	const appUrl = process.env.NEXT_PUBLIC_APP_URL;
	if (!appUrl) {
		throw new Error(
			"NEXT_PUBLIC_APP_URL is required for server-side auth client initialization",
		);
	}
	return `${appUrl}/api/auth`;
}

const SIGMA_CLIENT_ID = process.env.NEXT_PUBLIC_SIGMA_CLIENT_ID;
if (!SIGMA_CLIENT_ID) {
	throw new Error("NEXT_PUBLIC_SIGMA_CLIENT_ID is required");
}

export const authClient = createAuthClient({
	baseURL: getBaseURL(),
	plugins: [sigmaClient()],
});

export type { SigmaUserInfo };

// Storage keys for auth tokens
const AUTH_KEYS = {
	user: "sigma_user",
	accessToken: "sigma_access_token",
	idToken: "sigma_id_token",
	refreshToken: "sigma_refresh_token",
} as const;

export function storeAuthData(data: {
	user: SigmaUserInfo;
	access_token: string;
	id_token: string;
	refresh_token?: string;
}) {
	localStorage.setItem(AUTH_KEYS.user, JSON.stringify(data.user));
	localStorage.setItem(AUTH_KEYS.accessToken, data.access_token);
	localStorage.setItem(AUTH_KEYS.idToken, data.id_token);
	if (data.refresh_token) {
		localStorage.setItem(AUTH_KEYS.refreshToken, data.refresh_token);
	}
}

export function loadAuthUser(): SigmaUserInfo | null {
	if (typeof window === "undefined") return null;
	const stored = localStorage.getItem(AUTH_KEYS.user);
	if (!stored) return null;
	try {
		return JSON.parse(stored) as SigmaUserInfo;
	} catch {
		return null;
	}
}

export function loadAccessToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(AUTH_KEYS.accessToken);
}

export function clearAuthData() {
	localStorage.removeItem(AUTH_KEYS.user);
	localStorage.removeItem(AUTH_KEYS.accessToken);
	localStorage.removeItem(AUTH_KEYS.idToken);
	localStorage.removeItem(AUTH_KEYS.refreshToken);
	// Also clear the sigma bap_id stored by the plugin
	localStorage.removeItem("sigma_bap_id");
}

/**
 * Sign in with Sigma Identity (Bitcoin wallet authentication).
 */
export function signInWithSigma() {
	return authClient.signIn.sigma({
		clientId: SIGMA_CLIENT_ID,
		callbackURL: "/auth/sigma/callback",
		errorCallbackURL: "/auth/sigma/error",
	});
}

/**
 * Sign in with GitHub via Sigma Identity.
 * Sigma Identity supports GitHub as a social provider --
 * the user gets a Sigma Identity linked to their GitHub account.
 */
export function signInWithGitHub() {
	return authClient.signIn.sigma({
		clientId: SIGMA_CLIENT_ID,
		callbackURL: "/auth/sigma/callback",
		errorCallbackURL: "/auth/sigma/error",
		provider: "github",
	});
}
