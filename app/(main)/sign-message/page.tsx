"use client";

import { ErrorCodes } from "@1sat/connect";
import {
	parsePopupParams,
	rejectRequest,
	sendErrorResponse,
	sendResponse,
	walletLockedError,
} from "@/lib/connect-popup";
import {
	AlertTriangle,
	CheckCircle,
	ExternalLink,
	Loader2,
	MessageSquare,
	X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWallet } from "@/providers/wallet-provider";

interface SignMessageParams {
	message: string;
}

/**
 * Sign a message using BSM (Bitcoin Signed Message) format
 * Returns the signature in base64 compact format
 */
async function signMessageBSM(
	message: string,
	privateKeyWif: string,
): Promise<{ signature: string; address: string }> {
	const { BSM, PrivateKey, Utils } = await import("@bsv/sdk");

	const privKey = PrivateKey.fromWif(privateKeyWif);
	const address = privKey.toAddress().toString();

	// Sign using BSM - use Utils.toArray for proper encoding
	// BSM.sign returns the signature in base64 format directly
	const msgBytes = Utils.toArray(message, "utf8");
	const signature = BSM.sign(msgBytes, privKey) as string;

	return { signature, address };
}

function SignMessageContent() {
	const searchParams = useSearchParams();
	const { hasWallet, isWalletLocked, walletKeys, unlockWallet } = useWallet();
	const [isSigning, setIsSigning] = useState(false);
	const [passphrase, setPassphrase] = useState("");
	const [unlockError, setUnlockError] = useState<string | null>(null);

	// Parse popup parameters
	const { requestId, origin, appName, params } = parsePopupParams(searchParams);
	const msgParams = params as SignMessageParams | undefined;

	// Validate we have required params
	const isValidRequest = requestId && origin && msgParams?.message;

	// Handle signing approval
	const handleApprove = useCallback(async () => {
		if (!isValidRequest || !walletKeys || !msgParams) return;

		setIsSigning(true);
		try {
			// Use ordinal key for identity signing (BSM standard)
			const { signature, address } = await signMessageBSM(
				msgParams.message,
				walletKeys.ordPk,
			);

			sendResponse(
				requestId,
				{
					message: msgParams.message,
					signature,
					address,
				},
				origin,
			);
		} catch (error) {
			console.error("Failed to sign message:", error);
			sendErrorResponse(
				requestId,
				ErrorCodes.INTERNAL_ERROR,
				error instanceof Error ? error.message : "Failed to sign message",
				origin,
			);
		} finally {
			setIsSigning(false);
		}
	}, [isValidRequest, walletKeys, msgParams, requestId, origin]);

	// Handle rejection
	const handleReject = () => {
		if (!requestId || !origin) return;
		rejectRequest(requestId, origin, "User rejected message signing");
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
							You need to create or import a wallet before signing messages.
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
									if (requestId && origin) {
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
						<AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
						<CardTitle>Unlock Wallet</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleUnlock} className="space-y-4">
							<div>
								<p className="text-sm text-muted-foreground mb-4 text-center">
									Enter your passphrase to sign the message
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
										if (requestId && origin) {
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
							This page was opened without a valid message to sign.
						</p>
						<Button variant="outline" onClick={() => window.close()}>
							Close
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Sign message screen
	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="text-center">
					<MessageSquare className="h-12 w-12 mx-auto text-primary mb-2" />
					<CardTitle>Sign Message</CardTitle>
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

					{/* Message to sign */}
					<div className="bg-muted/50 rounded-lg p-4">
						<p className="text-sm font-medium mb-2">Message to sign:</p>
						<p className="text-sm text-muted-foreground font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
							{msgParams?.message}
						</p>
					</div>

					{/* Info */}
					<div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
						<MessageSquare className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
						<p className="text-sm text-blue-600 dark:text-blue-400">
							This will create a Bitcoin Signed Message (BSM) that proves you
							own your address. No funds will be sent.
						</p>
					</div>

					{/* Action buttons */}
					<div className="flex gap-3">
						<Button
							variant="outline"
							className="flex-1"
							onClick={handleReject}
							disabled={isSigning}
						>
							<X className="h-4 w-4 mr-2" />
							Reject
						</Button>
						<Button
							className="flex-1"
							onClick={handleApprove}
							disabled={isSigning}
						>
							{isSigning ? (
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
							) : (
								<CheckCircle className="h-4 w-4 mr-2" />
							)}
							Sign
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default function SignMessagePage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen flex items-center justify-center bg-background">
					<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
				</div>
			}
		>
			<SignMessageContent />
		</Suspense>
	);
}
