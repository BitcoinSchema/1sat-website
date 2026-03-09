"use client";

import {
	parsePopupParams,
	rejectRequest,
	sendResponse,
	walletLockedError,
} from "@1sat/connect";
import { CheckCircle, ExternalLink, Loader2, Shield, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/providers/wallet-provider";

interface ConnectRequestParams {
	challenge?: string;
}

function ConnectContent() {
	const searchParams = useSearchParams();
	const { hasWallet, isWalletLocked, walletKeys, unlockWallet } = useWallet();
	const [isConnecting, setIsConnecting] = useState(false);
	const [passphrase, setPassphrase] = useState("");
	const [unlockError, setUnlockError] = useState<string | null>(null);

	// Parse popup parameters
	const { requestId, origin, appName, params } = parsePopupParams(searchParams);
	const connectParams = params as ConnectRequestParams | undefined;

	// Validate we have required params
	const isValidRequest = requestId && origin;

	// Get addresses from wallet keys
	const getAddresses = useCallback(() => {
		if (!walletKeys) return null;

		// Import dynamically to avoid SSR issues
		return import("@bsv/sdk").then(({ PrivateKey }) => {
			const payPk = PrivateKey.fromWif(walletKeys.payPk);
			const ordPk = PrivateKey.fromWif(walletKeys.ordPk);

			return {
				paymentAddress: payPk.toAddress().toString(),
				ordinalAddress: ordPk.toAddress().toString(),
				identityPubKey: ordPk.toPublicKey().toString(),
			};
		});
	}, [walletKeys]);

	// Handle connection approval
	const handleApprove = async () => {
		if (!(isValidRequest && walletKeys)) return;

		setIsConnecting(true);
		try {
			const addresses = await getAddresses();
			if (!addresses) return;

			// If a challenge was provided, sign it with BSM in the same popup
			let signedMessage:
				| {
						message: string;
						signature: string;
						address: string;
				  }
				| undefined;

			if (connectParams?.challenge) {
				const { BSM, PrivateKey, Utils } = await import("@bsv/sdk");
				const ordPk = PrivateKey.fromWif(walletKeys.ordPk);
				const msgBytes = Utils.toArray(connectParams.challenge, "utf8");
				const signature = BSM.sign(msgBytes, ordPk) as string;

				signedMessage = {
					message: connectParams.challenge,
					signature,
					address: ordPk.toAddress().toString(),
				};
			}

			sendResponse(
				requestId,
				signedMessage ? { ...addresses, signedMessage } : addresses,
				origin,
			);
		} catch (error) {
			console.error("Failed to get addresses:", error);
		} finally {
			setIsConnecting(false);
		}
	};

	// Handle rejection
	const handleReject = () => {
		if (!isValidRequest) return;
		rejectRequest(requestId, origin);
	};

	// Handle unlock
	const handleUnlock = async (e: React.FormEvent) => {
		e.preventDefault();
		setUnlockError(null);

		const success = await unlockWallet(passphrase);
		if (!success) {
			setUnlockError("Invalid passphrase");
		}
		setPassphrase("");
	};

	// Close popup when opened without valid params
	useEffect(() => {
		if (!isValidRequest && typeof window !== "undefined") {
			// Give a moment for params to load
			const timeout = setTimeout(() => {
				if (!searchParams.get("requestId")) {
					window.close();
				}
			}, 1000);
			return () => clearTimeout(timeout);
		}
	}, [isValidRequest, searchParams]);

	// No wallet exists
	if (!hasWallet) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CardTitle className="text-destructive">No Wallet Found</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-center">
						<p className="text-muted-foreground">
							You need to create or import a wallet before connecting to dApps.
						</p>
						<div className="flex justify-center gap-2">
							<Button
								onClick={() => {
									window.open(
										`${window.location.origin}/wallet/create`,
										"_blank",
									);
								}}
								variant="default"
							>
								<ExternalLink className="mr-2 h-4 w-4" />
								Create Wallet
							</Button>
							<Button
								onClick={() => {
									if (isValidRequest) {
										rejectRequest(requestId, origin, "No wallet exists");
									} else {
										window.close();
									}
								}}
								variant="outline"
							>
								Close
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Wallet is locked
	if (isWalletLocked) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<Shield className="mx-auto mb-2 h-12 w-12 text-primary" />
						<CardTitle>Unlock Wallet</CardTitle>
					</CardHeader>
					<CardContent>
						<form className="space-y-4" onSubmit={handleUnlock}>
							<div>
								<p className="mb-4 text-center text-muted-foreground text-sm">
									Enter your passphrase to continue
								</p>
								<input
									className="w-full rounded-md border bg-background px-3 py-2"
									onChange={(e) => setPassphrase(e.target.value)}
									placeholder="Passphrase"
									type="password"
									value={passphrase}
								/>
								{unlockError && (
									<p className="mt-2 text-destructive text-sm">{unlockError}</p>
								)}
							</div>
							<div className="flex gap-2">
								<Button
									className="flex-1"
									onClick={() => {
										if (isValidRequest) {
											walletLockedError(requestId, origin);
										} else {
											window.close();
										}
									}}
									type="button"
									variant="outline"
								>
									Cancel
								</Button>
								<Button className="flex-1" type="submit">
									Unlock
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Invalid request
	if (!isValidRequest) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CardTitle className="text-destructive">Invalid Request</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4 text-center">
						<p className="text-muted-foreground">
							This page was opened without valid connection parameters.
						</p>
						<Button onClick={() => window.close()} variant="outline">
							Close
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Connection approval screen
	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CheckCircle className="mx-auto mb-2 h-12 w-12 text-primary" />
					<CardTitle>Connect to dApp</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* App info */}
					<div className="space-y-2 text-center">
						<p className="font-medium text-lg">{appName || "Unknown App"}</p>
						<p className="flex items-center justify-center gap-1 text-muted-foreground text-sm">
							<ExternalLink className="h-3 w-3" />
							{origin}
						</p>
					</div>

					{/* Permissions */}
					<div className="space-y-2 rounded-lg bg-muted/50 p-4">
						<p className="font-medium text-sm">This app will be able to:</p>
						<ul className="space-y-1 text-muted-foreground text-sm">
							<li>- View your wallet addresses</li>
							<li>- Request transaction signatures</li>
							<li>- Request message signatures</li>
						</ul>
						{connectParams?.challenge && (
							<p className="mt-2 border-t pt-2 text-muted-foreground text-sm">
								A verification signature will also be provided to prove wallet
								ownership.
							</p>
						)}
					</div>

					{/* Action buttons */}
					<div className="flex gap-3">
						<Button
							className="flex-1"
							disabled={isConnecting}
							onClick={handleReject}
							variant="outline"
						>
							<X className="mr-2 h-4 w-4" />
							Reject
						</Button>
						<Button
							className="flex-1"
							disabled={isConnecting}
							onClick={handleApprove}
						>
							{isConnecting ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<CheckCircle className="mr-2 h-4 w-4" />
							)}
							Connect
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default function ConnectPage() {
	return (
		<Suspense
			fallback={
				<div className="flex min-h-screen items-center justify-center bg-background">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<ConnectContent />
		</Suspense>
	);
}
