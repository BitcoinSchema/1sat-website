"use client";

import {
	CheckCircle,
	ExternalLink,
	Loader2,
	Shield,
	XCircle,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isValidRedirectMethod } from "@/lib/cwi/redirect-utils";
import { useWallet } from "@/providers/wallet-provider";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

interface PendingAuthRequest {
	requestId: string;
	origin: string;
	redirectUri: string;
	call: string;
	args: unknown;
	status: string;
	expiresAt: number;
	createdAt: number;
}

interface CompleteResponse {
	redirectUrl: string;
	decision: "approved" | "denied" | "error";
}

const jsonPreview = (value: unknown): string => {
	try {
		const serialized = JSON.stringify(value, null, 2);
		if (!serialized) return "{}";
		if (serialized.length <= 1200) return serialized;
		return `${serialized.slice(0, 1200)}\n...`;
	} catch {
		return "[unserializable args]";
	}
};

function AuthorizeContent() {
	const searchParams = useSearchParams();
	const requestId = searchParams.get("requestId");
	const { hasWallet, isWalletLocked, unlockWallet } = useWallet();
	const {
		permissionsManager,
		wallet,
		isInitialized,
		isInitializing,
		exchangeRate,
	} = useWalletToolbox();

	const [requestData, setRequestData] = useState<PendingAuthRequest | null>(
		null,
	);
	const [isLoadingRequest, setIsLoadingRequest] = useState(true);
	const [requestError, setRequestError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [passphrase, setPassphrase] = useState("");
	const [unlockError, setUnlockError] = useState<string | null>(null);

	const isExpired = useMemo(
		() => (requestData ? requestData.expiresAt <= Date.now() : false),
		[requestData],
	);

	useEffect(() => {
		if (!requestId) {
			setRequestError("Missing request id.");
			setIsLoadingRequest(false);
			return;
		}

		let cancelled = false;
		const loadRequest = async () => {
			setIsLoadingRequest(true);
			setRequestError(null);
			try {
				const response = await fetch(
					`/api/cwi/authorize/request?requestId=${encodeURIComponent(requestId)}`,
					{
						method: "GET",
						cache: "no-store",
					},
				);
				const data = (await response.json()) as
					| PendingAuthRequest
					| { error?: string };
				if (!response.ok) {
					throw new Error(
						(data as { error?: string }).error ??
							"Failed to load authorization request.",
					);
				}
				if (cancelled) return;
				setRequestData(data as PendingAuthRequest);
			} catch (error) {
				if (cancelled) return;
				const message =
					error instanceof Error
						? error.message
						: "Failed to load authorization request.";
				setRequestError(message);
			} finally {
				if (!cancelled) {
					setIsLoadingRequest(false);
				}
			}
		};

		void loadRequest();
		return () => {
			cancelled = true;
		};
	}, [requestId]);

	const completeAuthorization = useCallback(
		async (body: {
			requestId: string;
			decision: "approved" | "denied" | "error";
			result?: unknown;
			error?: string;
			error_description?: string;
		}) => {
			const response = await fetch("/api/cwi/authorize/complete", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(body),
			});
			const data = (await response.json()) as
				| CompleteResponse
				| { error?: string };
			if (!response.ok) {
				throw new Error(
					(data as { error?: string }).error ?? "completion_failed",
				);
			}
			return data as CompleteResponse;
		},
		[],
	);

	const executeRequestedCall = useCallback(async () => {
		if (!requestData) {
			throw new Error("authorization_request_missing");
		}
		if (!isValidRedirectMethod(requestData.call)) {
			throw new Error("unknown_method");
		}
		if (requestData.call === "getBalance") {
			if (!wallet) throw new Error("wallet_not_available");
			const satoshis = await wallet.balance();
			const usd =
				exchangeRate != null
					? Number(((satoshis / 100_000_000) * exchangeRate).toFixed(8))
					: undefined;
			return { satoshis, ...(usd !== undefined ? { usd } : {}) };
		}
		if (!permissionsManager) {
			throw new Error("wallet_permissions_manager_not_ready");
		}

		const permissionsRecord = permissionsManager as unknown as Record<
			string,
			unknown
		>;
		const method = permissionsRecord[requestData.call];
		if (typeof method !== "function") {
			throw new Error("method_not_callable");
		}

		return await (
			method as (args: unknown, originator: string) => Promise<unknown>
		).call(permissionsManager, requestData.args ?? {}, requestData.origin);
	}, [requestData, wallet, exchangeRate, permissionsManager]);

	const redirectToCallback = useCallback((redirectUrl: string) => {
		window.location.assign(redirectUrl);
	}, []);

	const handleApprove = useCallback(async () => {
		if (!requestData) return;
		setIsSubmitting(true);
		setRequestError(null);
		try {
			const result = await executeRequestedCall();
			const completion = await completeAuthorization({
				requestId: requestData.requestId,
				decision: "approved",
				result,
			});
			redirectToCallback(completion.redirectUrl);
		} catch (error) {
			const description =
				error instanceof Error ? error.message : "Request execution failed.";
			try {
				const completion = await completeAuthorization({
					requestId: requestData.requestId,
					decision: "error",
					error: "wallet_execution_failed",
					error_description: description,
				});
				redirectToCallback(completion.redirectUrl);
			} catch {
				setRequestError(description);
				setIsSubmitting(false);
			}
		}
	}, [
		requestData,
		executeRequestedCall,
		completeAuthorization,
		redirectToCallback,
	]);

	const handleDeny = useCallback(async () => {
		if (!requestData) return;
		setIsSubmitting(true);
		setRequestError(null);
		try {
			const completion = await completeAuthorization({
				requestId: requestData.requestId,
				decision: "denied",
				error: "access_denied",
				error_description: "The user denied the request.",
			});
			redirectToCallback(completion.redirectUrl);
		} catch (error) {
			const description =
				error instanceof Error ? error.message : "Failed to deny request.";
			setRequestError(description);
			setIsSubmitting(false);
		}
	}, [requestData, completeAuthorization, redirectToCallback]);

	const handleUnlock = useCallback(
		async (event: React.FormEvent) => {
			event.preventDefault();
			setUnlockError(null);
			const success = await unlockWallet(passphrase);
			if (!success) {
				setUnlockError("Invalid passphrase");
			}
			setPassphrase("");
		},
		[passphrase, unlockWallet],
	);

	if (isLoadingRequest) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<Loader2 className="h-10 w-10 mx-auto mb-2 animate-spin text-primary" />
						<CardTitle>Loading authorization request</CardTitle>
					</CardHeader>
				</Card>
			</div>
		);
	}

	if (!requestData) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<XCircle className="h-10 w-10 mx-auto mb-2 text-destructive" />
						<CardTitle>Authorization request unavailable</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground text-center">
						{requestError ?? "The request could not be loaded."}
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isExpired || requestData.status !== "pending") {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<XCircle className="h-10 w-10 mx-auto mb-2 text-destructive" />
						<CardTitle>Authorization request is no longer active</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground text-center">
						Status: {requestData.status}
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!hasWallet) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<XCircle className="h-10 w-10 mx-auto mb-2 text-destructive" />
						<CardTitle>No wallet available</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground text-center">
						Create or import a wallet before authorizing requests.
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isWalletLocked) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<Shield className="h-10 w-10 mx-auto mb-2 text-primary" />
						<CardTitle>Unlock wallet</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleUnlock} className="space-y-4">
							<input
								type="password"
								value={passphrase}
								onChange={(event) => setPassphrase(event.target.value)}
								placeholder="Passphrase"
								className="w-full px-3 py-2 rounded-md border bg-background"
							/>
							{unlockError && (
								<p className="text-sm text-destructive">{unlockError}</p>
							)}
							<Button type="submit" className="w-full">
								Unlock
							</Button>
						</form>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!isInitialized || isInitializing || !permissionsManager) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<Loader2 className="h-10 w-10 mx-auto mb-2 animate-spin text-primary" />
						<CardTitle>Preparing wallet authorization</CardTitle>
					</CardHeader>
					<CardContent className="text-sm text-muted-foreground text-center">
						Waiting for wallet services to initialize.
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-lg">
				<CardHeader className="text-center">
					<CheckCircle className="h-10 w-10 mx-auto mb-2 text-primary" />
					<CardTitle>Authorize wallet request</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg border bg-muted/40 p-3 text-sm">
						<p className="font-medium">Requesting origin</p>
						<p className="text-muted-foreground flex items-center gap-1 break-all">
							<ExternalLink className="h-3 w-3" />
							{requestData.origin}
						</p>
					</div>
					<div className="rounded-lg border bg-muted/40 p-3 text-sm">
						<p className="font-medium">Method</p>
						<p className="text-muted-foreground break-all">
							{requestData.call}
						</p>
					</div>
					<div className="rounded-lg border bg-muted/40 p-3 text-xs">
						<p className="font-medium text-sm mb-2">Args</p>
						<pre className="overflow-auto whitespace-pre-wrap break-all">
							{jsonPreview(requestData.args)}
						</pre>
					</div>
					{requestError && (
						<div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
							{requestError}
						</div>
					)}
					<div className="flex gap-3">
						<Button
							variant="outline"
							className="flex-1"
							onClick={handleDeny}
							disabled={isSubmitting}
						>
							Deny
						</Button>
						<Button
							className="flex-1"
							onClick={handleApprove}
							disabled={isSubmitting}
						>
							{isSubmitting ? (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<CheckCircle className="h-4 w-4 mr-2" />
							)}
							Allow
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default function CWIAuthorizePage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-background p-4">
					<Card className="w-full max-w-md">
						<CardHeader className="text-center">
							<Loader2 className="h-10 w-10 mx-auto mb-2 animate-spin text-primary" />
							<CardTitle>Loading authorization</CardTitle>
						</CardHeader>
					</Card>
				</div>
			}
		>
			<AuthorizeContent />
		</Suspense>
	);
}
