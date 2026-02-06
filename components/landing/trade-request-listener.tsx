"use client";

import { useMutation, useQuery } from "convex/react";
import { Bell, Clock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import SigmaAvatar from "sigma-avatars";
import {
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	SoundAlertDialog,
	SoundAlertDialogAction,
	SoundAlertDialogCancel,
} from "@/components/ui/sound-alert-dialog";
import { useSound } from "@/hooks/use-sound";
import { wifToAddress } from "@/lib/keys";
import { resolveTradeDisplayId } from "@/lib/trade-display-id";
import { useAuth } from "@/providers/auth-provider";
import { useWallet } from "@/providers/wallet-provider";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { TradeDialog } from "./trade-dialog";

// Truncate identifier for display
function truncateIdentifier(identifier: string): string {
	if (identifier.length <= 12) return identifier;
	return `${identifier.slice(0, 6)}...${identifier.slice(-4)}`;
}

function resolveDisplayId(userId: string): string {
	const fromMap = resolveTradeDisplayId(userId);
	if (fromMap) {
		return fromMap;
	}

	// Legacy fallback for sessions keyed by wallet address.
	return userId.includes(":") ? userId.split(":")[0] : userId;
}

export function TradeRequestListener() {
	const { walletKeys, isWalletLocked } = useWallet();
	const { user: authUser } = useAuth();
	const { play } = useSound();
	const [incomingRequest, setIncomingRequest] = useState<{
		id: Id<"tradeRequests">;
		fromDisplayId: string;
	} | null>(null);
	const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
	const [activePeerDisplayId, setActivePeerDisplayId] = useState<string>("");

	const lastIncomingRequestIdRef = useRef<string | null>(null);
	const lastAcceptedRequestIdRef = useRef<string | null>(null);

	// Derive my address
	const myAddress = useMemo(() => {
		if (walletKeys?.ordPk && !isWalletLocked) {
			try {
				return wifToAddress(walletKeys.ordPk);
			} catch {
				return null;
			}
		}
		return null;
	}, [walletKeys, isWalletLocked]);

	// Session suffix (same as SharedPresence)
	const sessionSuffix = useMemo(() => {
		if (typeof window === "undefined")
			return Math.random().toString(36).slice(2, 6);
		let suffix = sessionStorage.getItem("presence-session-suffix");
		if (!suffix) {
			suffix = Math.random().toString(36).slice(2, 6);
			sessionStorage.setItem("presence-session-suffix", suffix);
		}
		return suffix;
	}, []);

	// Canonical trade identity for queries and mutation ownership checks.
	const tradeUserId = useMemo(() => {
		if (authUser?.sub) {
			return authUser.sub;
		}
		if (myAddress) {
			return `${myAddress}:${sessionSuffix}`;
		}
		return null;
	}, [authUser?.sub, myAddress, sessionSuffix]);

	// Subscribe to incoming trade requests (for recipient)
	const incomingRequests = useQuery(
		api.trades.getIncomingTradeRequests,
		tradeUserId ? { userId: tradeUserId } : "skip",
	);

	// Subscribe to accepted sent requests (for initiator)
	const acceptedSentRequests = useQuery(
		api.trades.getAcceptedSentRequests,
		tradeUserId ? { userId: tradeUserId } : "skip",
	);

	// Subscribe to pending sent requests (for initiator waiting UI)
	const pendingSentRequests = useQuery(
		api.trades.getPendingSentRequests,
		tradeUserId ? { userId: tradeUserId } : "skip",
	);

	// Subscribe to active trade session (to detect when other party closes)
	const activeTradeSession = useQuery(
		api.trades.getTradeSession,
		activeSessionId ? { sessionId: activeSessionId } : "skip",
	);

	// Mutations
	const acceptRequest = useMutation(api.trades.acceptTradeRequest);
	const declineRequest = useMutation(api.trades.declineTradeRequest);
	const cancelTradeRequest = useMutation(api.trades.cancelTradeRequest);
	const cancelTrade = useMutation(api.trades.cancelTrade);

	// Handle new incoming requests (recipient side) - play ALERT sound
	useEffect(() => {
		if (incomingRequests && incomingRequests.length > 0) {
			const latestRequest = incomingRequests[0];

			if (lastIncomingRequestIdRef.current !== latestRequest._id) {
				lastIncomingRequestIdRef.current = latestRequest._id;

				// Play alert sound for notification popup
				play("alert");

				setIncomingRequest({
					id: latestRequest._id,
					fromDisplayId: resolveDisplayId(latestRequest.fromUserId),
				});
			}
		} else if (
			incomingRequests !== undefined &&
			incomingRequests.length === 0
		) {
			// Request was cancelled by sender or handled - clear the dialog
			setIncomingRequest(null);
			lastIncomingRequestIdRef.current = null;
		}
	}, [
		incomingRequests, // Play alert sound for notification popup
		play,
	]);

	// Handle accepted sent requests (initiator side) - play DIALOG OPEN sound
	useEffect(() => {
		if (acceptedSentRequests && acceptedSentRequests.length > 0) {
			const latestAccepted = acceptedSentRequests[0];

			if (
				lastAcceptedRequestIdRef.current !== latestAccepted._id &&
				latestAccepted.sessionId
			) {
				lastAcceptedRequestIdRef.current = latestAccepted._id;

				// Play dialog open sound for initiator
				play("dialog");

				const peerDisplayId = resolveDisplayId(latestAccepted.toUserId);
				setActivePeerDisplayId(peerDisplayId);
				setActiveSessionId(latestAccepted.sessionId);
			}
		}
	}, [
		acceptedSentRequests, // Play dialog open sound for initiator
		play,
	]);

	// Handle trade session status changes (close sync)
	useEffect(() => {
		if (activeTradeSession && activeSessionId) {
			if (
				activeTradeSession.status === "cancelled" ||
				activeTradeSession.status === "completed"
			) {
				// Play dialog close sound
				play("dialog", 0.2);
				setActiveSessionId(null);
				setActivePeerDisplayId("");
			}
		}
	}, [activeTradeSession, activeSessionId, play]);

	const handleAccept = async () => {
		if (!incomingRequest) return;

		try {
			const result = await acceptRequest({ requestId: incomingRequest.id });
			setActivePeerDisplayId(incomingRequest.fromDisplayId);
			setIncomingRequest(null);

			// Play dialog open sound for recipient
			play("dialog");

			setActiveSessionId(result.sessionId);
		} catch (error) {
			console.error("Failed to accept trade request:", error);
		}
	};

	const handleDecline = async () => {
		if (!incomingRequest) return;

		try {
			await declineRequest({ requestId: incomingRequest.id });
			setIncomingRequest(null);
		} catch (error) {
			console.error("Failed to decline trade request:", error);
		}
	};

	// Handle closing the trade dialog
	const handleCloseTradeDialog = async (open: boolean) => {
		if (!open && activeSessionId) {
			try {
				await cancelTrade({ sessionId: activeSessionId });
			} catch (error) {
				console.error("Failed to cancel trade:", error);
			}
			// Don't play sound here - the effect will handle it via subscription
			setActiveSessionId(null);
			setActivePeerDisplayId("");
		}
	};

	const peerDisplayId = incomingRequest ? incomingRequest.fromDisplayId : "";
	const isPeerWallet = peerDisplayId.startsWith("1");

	// Get pending request info for waiting UI
	const pendingRequest = pendingSentRequests?.[0] ?? null;
	const pendingPeerDisplayId = pendingRequest
		? resolveDisplayId(pendingRequest.toUserId)
		: "";
	const isPendingPeerWallet = pendingPeerDisplayId.startsWith("1");

	// Handle canceling a pending request
	const handleCancelPendingRequest = async () => {
		if (pendingRequest) {
			try {
				await cancelTradeRequest({ requestId: pendingRequest._id });
			} catch (error) {
				console.error("Failed to cancel trade request:", error);
			}
		}
	};

	return (
		<>
			{/* Waiting for response dialog (for initiator) */}
			<SoundAlertDialog
				open={!!pendingRequest && !activeSessionId}
				onOpenChange={(open) => !open && handleCancelPendingRequest()}
			>
				<AlertDialogContent className="sm:max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2 text-xl">
							<Clock className="w-5 h-5 text-muted-foreground" />
							Waiting for Response
						</AlertDialogTitle>
						<AlertDialogDescription asChild>
							<div className="flex items-center gap-3 pt-2">
								{isPendingPeerWallet && (
									<span className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 inline-flex">
										<SigmaAvatar
											name={pendingPeerDisplayId}
											colors={[
												"var(--chart-1)",
												"var(--chart-2)",
												"var(--chart-3)",
												"var(--chart-4)",
												"var(--chart-5)",
											]}
											className="h-full w-full"
										/>
									</span>
								)}
								<span>
									<span className="text-foreground font-medium font-mono block">
										{truncateIdentifier(pendingPeerDisplayId)}
									</span>
									<span className="text-muted-foreground text-sm">
										is deciding whether to accept your request...
									</span>
								</span>
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<SoundAlertDialogCancel>Cancel Request</SoundAlertDialogCancel>
					</AlertDialogFooter>
				</AlertDialogContent>
			</SoundAlertDialog>

			{/* Incoming trade request dialog */}
			<SoundAlertDialog
				open={!!incomingRequest}
				onOpenChange={(open) => !open && handleDecline()}
				openSound={false}
			>
				<AlertDialogContent className="sm:max-w-md">
					<AlertDialogHeader>
						<AlertDialogTitle className="flex items-center gap-2 text-xl">
							<Bell className="w-5 h-5 text-primary" />
							Trade Request
						</AlertDialogTitle>
						<AlertDialogDescription asChild>
							<div className="flex items-center gap-3 pt-2">
								{isPeerWallet && (
									<span className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 inline-flex">
										<SigmaAvatar
											name={peerDisplayId}
											colors={[
												"var(--chart-1)",
												"var(--chart-2)",
												"var(--chart-3)",
												"var(--chart-4)",
												"var(--chart-5)",
											]}
											className="h-full w-full"
										/>
									</span>
								)}
								<span>
									<span className="text-foreground font-medium font-mono block">
										{truncateIdentifier(peerDisplayId)}
									</span>
									<span className="text-muted-foreground text-sm">
										wants to trade with you
									</span>
								</span>
							</div>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<SoundAlertDialogCancel onClick={handleDecline}>
							Decline
						</SoundAlertDialogCancel>
						<SoundAlertDialogAction onClick={handleAccept}>
							Accept Trade
						</SoundAlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</SoundAlertDialog>

			{/* Active trade session */}
			{activeSessionId && tradeUserId && (
				<TradeDialog
					open={!!activeSessionId}
					onOpenChange={handleCloseTradeDialog}
					peerAddress={activePeerDisplayId}
					peerLabel={truncateIdentifier(activePeerDisplayId)}
					sessionId={activeSessionId}
					myUserId={tradeUserId}
				/>
			)}
		</>
	);
}
