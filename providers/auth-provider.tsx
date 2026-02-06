"use client";

import type { SigmaUserInfo } from "@sigma-auth/better-auth-plugin/client";
import type { ReactNode } from "react";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";
import {
	clearAuthData,
	loadAccessToken,
	loadAuthUser,
	signInWithGitHub,
	signInWithSigma,
} from "@/lib/auth-client";

interface AuthContextType {
	/** The authenticated Sigma Identity user, or null */
	user: SigmaUserInfo | null;
	/** Whether auth state is still loading */
	isLoading: boolean;
	/** Whether the user is authenticated */
	isAuthenticated: boolean;
	/** The current access token, or null */
	accessToken: string | null;
	/** The BAP ID for signing (the real identity key, not the wallet root key) */
	bapId: string | null;
	/** Sign in with Sigma Identity (Bitcoin wallet) */
	signInSigma: () => void;
	/** Sign in with GitHub */
	signInGitHub: () => void;
	/** Sign out and clear all auth data */
	signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<SigmaUserInfo | null>(null);
	const [accessToken, setAccessToken] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const storedUser = loadAuthUser();
		const storedToken = loadAccessToken();
		if (storedUser) {
			setUser(storedUser);
		}
		if (storedToken) {
			setAccessToken(storedToken);
		}
		setIsLoading(false);
	}, []);

	// Listen for storage changes (other tabs)
	useEffect(() => {
		const handleStorage = (e: StorageEvent) => {
			if (e.key === "sigma_user") {
				if (e.newValue) {
					try {
						setUser(JSON.parse(e.newValue) as SigmaUserInfo);
					} catch {
						setUser(null);
					}
				} else {
					setUser(null);
				}
			}
			if (e.key === "sigma_access_token") {
				setAccessToken(e.newValue);
			}
		};
		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, []);

	const signInSigma = useCallback(() => {
		signInWithSigma();
	}, []);

	const signInGitHub = useCallback(() => {
		signInWithGitHub();
	}, []);

	const signOut = useCallback(() => {
		clearAuthData();
		setUser(null);
		setAccessToken(null);
	}, []);

	const bapId = user?.bap_id || null;

	const value = useMemo(
		() => ({
			user,
			isLoading,
			isAuthenticated: !!user,
			accessToken,
			bapId,
			signInSigma,
			signInGitHub,
			signOut,
		}),
		[user, isLoading, accessToken, bapId, signInSigma, signInGitHub, signOut],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
