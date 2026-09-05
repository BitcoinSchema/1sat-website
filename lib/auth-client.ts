import type { SigmaUserInfo } from "@sigma-auth/better-auth-plugin/client";
import { sigmaClient } from "@sigma-auth/better-auth-plugin/client";
import { createAuthClient } from "better-auth/client";

function sigmaAuthUrl() {
	return (
		process.env.NEXT_PUBLIC_SIGMA_AUTH_URL || "https://auth.sigmaidentity.com"
	);
}

function sigmaClientId() {
	return process.env.NEXT_PUBLIC_SIGMA_CLIENT_ID;
}

export const authClient = createAuthClient({
	baseURL: sigmaAuthUrl(),
	plugins: [sigmaClient()],
});

export type { SigmaUserInfo };

const AUTH_KEYS = {
	user: "sigma_user",
	accessToken: "sigma_access_token",
	idToken: "sigma_id_token",
	refreshToken: "sigma_refresh_token",
} as const;

export const AUTH_STATE_CHANGE_EVENT = "sigma-auth-state-changed";

function emitAuthStateChanged() {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));
	}
}

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
	} else {
		localStorage.removeItem(AUTH_KEYS.refreshToken);
	}
	emitAuthStateChanged();
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
	localStorage.removeItem("sigma_bap_id");
	emitAuthStateChanged();
}

function requireClientId() {
	const clientId = sigmaClientId();
	if (!clientId) {
		throw new Error("NEXT_PUBLIC_SIGMA_CLIENT_ID is required");
	}
	return clientId;
}

export function signInWithSigma() {
	return authClient.signIn.sigma({
		clientId: requireClientId(),
		callbackURL: "/auth/sigma/callback",
		errorCallbackURL: "/auth/sigma/error",
	});
}

export function signInWithGitHub() {
	return authClient.signIn.sigma({
		clientId: requireClientId(),
		callbackURL: "/auth/sigma/callback",
		errorCallbackURL: "/auth/sigma/error",
		provider: "github",
	});
}
