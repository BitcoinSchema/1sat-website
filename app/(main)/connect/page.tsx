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

function ConnectContent() {
	const searchParams = useSearchParams();
	const { hasWallet, isWalletLocked, walletKeys, unlockWallet } = useWallet();
	const [isConnecting, setIsConnecting] = useState(false);
	const [passphrase, setPassphrase] = useState("");
	const [unlockError, setUnlockError] = useState<string | null>(null);

	// Parse popup parameters
	const { requestId, origin, appName } = parsePopupParams(searchParams);

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
		if (!isValidRequest || !walletKeys) return;

		setIsConnecting(true);
		try {
			const addresses = await getAddresses();
			if (addresses) {
				sendResponse(requestId, addresses, origin);
			}
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
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CardTitle className="text-destructive">No Wallet Found</CardTitle>
					</CardHeader>
					<CardContent className="text-center space-y-4">
						<p className="text-muted-foreground">
							You need to create or import a wallet before connecting to dApps.
						</p>
						<div className="flex gap-2 justify-center">
							<Button
								variant="default"
								onClick={() => {
									window.open(
										`${window.location.origin}/wallet/create`,
										"_blank",
									);
								}}
							>
								<ExternalLink className="h-4 w-4 mr-2" />
								Create Wallet
							</Button>
							<Button
								variant="outline"
								onClick={() => {
									if (isValidRequest) {
										rejectRequest(requestId, origin, "No wallet exists");
									} else {
										window.close();
									}
								}}
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
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<Shield className="h-12 w-12 mx-auto text-primary mb-2" />
						<CardTitle>Unlock Wallet</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleUnlock} className="space-y-4">
							<div>
								<p className="text-sm text-muted-foreground mb-4 text-center">
									Enter your passphrase to continue
								</p>
								<input
									type="password"
									value={passphrase}
									onChange={(e) => setPassphrase(e.target.value)}
									placeholder="Passphrase"
									className="w-full px-3 py-2 rounded-md border bg-background"
								/>
								{unlockError && (
									<p className="text-sm text-destructive mt-2">{unlockError}</p>
								)}
							</div>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									className="flex-1"
									onClick={() => {
										if (isValidRequest) {
											walletLockedError(requestId, origin);
										} else {
											window.close();
										}
									}}
								>
									Cancel
								</Button>
								<Button type="submit" className="flex-1">
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
			<div className="min-h-screen flex items-center justify-center bg-background p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CardTitle className="text-destructive">Invalid Request</CardTitle>
					</CardHeader>
					<CardContent className="text-center space-y-4">
						<p className="text-muted-foreground">
							This page was opened without valid connection parameters.
						</p>
						<Button variant="outline" onClick={() => window.close()}>
							Close
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Connection approval screen
	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<CheckCircle className="h-12 w-12 mx-auto text-primary mb-2" />
					<CardTitle>Connect to dApp</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					{/* App info */}
					<div className="text-center space-y-2">
						<p className="font-medium text-lg">{appName || "Unknown App"}</p>
						<p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
							<ExternalLink className="h-3 w-3" />
							{origin}
						</p>
					</div>

					{/* Permissions */}
					<div className="bg-muted/50 rounded-lg p-4 space-y-2">
						<p className="text-sm font-medium">This app will be able to:</p>
						<ul className="text-sm text-muted-foreground space-y-1">
							<li>- View your wallet addresses</li>
							<li>- Request transaction signatures</li>
							<li>- Request message signatures</li>
						</ul>
					</div>

					{/* Action buttons */}
					<div className="flex gap-3">
						<Button
							variant="outline"
							className="flex-1"
							onClick={handleReject}
							disabled={isConnecting}
						>
							<X className="h-4 w-4 mr-2" />
							Reject
						</Button>
						<Button
							className="flex-1"
							onClick={handleApprove}
							disabled={isConnecting}
						>
							{isConnecting ? (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<CheckCircle className="h-4 w-4 mr-2" />
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
				<div className="min-h-screen flex items-center justify-center bg-background">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<ConnectContent />
		</Suspense>
	);
}
