"use client";

import { useQuery, useMutation } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useWallet } from "@/providers/wallet-provider";
import { wifToAddress } from "@/lib/keys";
import { TradeDialog } from "./trade-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import SigmaAvatar from "sigma-avatars";

// Truncate address for display
function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Extract wallet address from userId
function extractWalletAddress(userId: string): string {
  return userId.includes(":") ? userId.split(":")[0] : userId;
}

export function TradeRequestListener() {
  const { walletKeys, isWalletLocked } = useWallet();
  const [incomingRequest, setIncomingRequest] = useState<{
    id: Id<"tradeRequests">;
    fromUserId: string;
  } | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activePeerAddress, setActivePeerAddress] = useState<string>("");

  // Sound refs - alert for notifications, dialog for trade dialog open/close
  const alertSoundRef = useRef<HTMLAudioElement | null>(null);
  const dialogOpenSoundRef = useRef<HTMLAudioElement | null>(null);
  const dialogCloseSoundRef = useRef<HTMLAudioElement | null>(null);
  const declineSoundRef = useRef<HTMLAudioElement | null>(null);

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
    if (typeof window === "undefined") return Math.random().toString(36).slice(2, 6);
    let suffix = sessionStorage.getItem("presence-session-suffix");
    if (!suffix) {
      suffix = Math.random().toString(36).slice(2, 6);
      sessionStorage.setItem("presence-session-suffix", suffix);
    }
    return suffix;
  }, []);

  // Full userId with session
  const myFullUserId = useMemo(() => {
    if (myAddress) {
      return `${myAddress}:${sessionSuffix}`;
    }
    return null;
  }, [myAddress, sessionSuffix]);

  // Subscribe to incoming trade requests (for recipient)
  const incomingRequests = useQuery(
    api.trades.getIncomingTradeRequests,
    myFullUserId ? { userId: myFullUserId } : "skip"
  );

  // Subscribe to accepted sent requests (for initiator)
  const acceptedSentRequests = useQuery(
    api.trades.getAcceptedSentRequests,
    myFullUserId ? { userId: myFullUserId } : "skip"
  );

  // Subscribe to active trade session (to detect when other party closes)
  const activeTradeSession = useQuery(
    api.trades.getTradeSession,
    activeSessionId ? { sessionId: activeSessionId } : "skip"
  );

  // Mutations
  const acceptRequest = useMutation(api.trades.acceptTradeRequest);
  const declineRequest = useMutation(api.trades.declineTradeRequest);
  const cancelTrade = useMutation(api.trades.cancelTrade);

  // Initialize audio - separate sounds for different events
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Alert sound - for trade request notifications
      alertSoundRef.current = new Audio("/sounds/alert.mp3");
      alertSoundRef.current.volume = 0.7;

      // Dialog sound - for trade dialog open/close
      dialogOpenSoundRef.current = new Audio("/sounds/dialog.mp3");
      dialogOpenSoundRef.current.volume = 0.5;

      // Dialog close uses same dialog sound but quieter
      dialogCloseSoundRef.current = new Audio("/sounds/dialog.mp3");
      dialogCloseSoundRef.current.volume = 0.3;

      // Decline sound - subtle error/negative
      declineSoundRef.current = new Audio("/sounds/decline.mp3");
      declineSoundRef.current.volume = 0.5;
    }
  }, []);

  // Play functions
  const playAlertSound = () => {
    if (alertSoundRef.current) {
      alertSoundRef.current.currentTime = 0;
      alertSoundRef.current.play().catch(() => { });
    }
  };

  const playDialogOpenSound = () => {
    if (dialogOpenSoundRef.current) {
      dialogOpenSoundRef.current.currentTime = 0;
      dialogOpenSoundRef.current.play().catch(() => { });
    }
  };

  const playDialogCloseSound = () => {
    if (dialogCloseSoundRef.current) {
      dialogCloseSoundRef.current.currentTime = 0;
      dialogCloseSoundRef.current.play().catch(() => { });
    }
  };

  // Handle new incoming requests (recipient side) - play ALERT sound
  useEffect(() => {
    if (incomingRequests && incomingRequests.length > 0) {
      const latestRequest = incomingRequests[0];

      if (lastIncomingRequestIdRef.current !== latestRequest._id) {
        lastIncomingRequestIdRef.current = latestRequest._id;

        // Play alert sound for notification popup
        playAlertSound();

        setIncomingRequest({
          id: latestRequest._id,
          fromUserId: latestRequest.fromUserId,
        });
      }
    }
  }, [incomingRequests]);

  // Handle accepted sent requests (initiator side) - play DIALOG OPEN sound
  useEffect(() => {
    if (acceptedSentRequests && acceptedSentRequests.length > 0) {
      const latestAccepted = acceptedSentRequests[0];

      if (lastAcceptedRequestIdRef.current !== latestAccepted._id && latestAccepted.sessionId) {
        lastAcceptedRequestIdRef.current = latestAccepted._id;

        // Play dialog open sound for initiator
        playDialogOpenSound();

        const peerWalletAddress = extractWalletAddress(latestAccepted.toUserId);
        setActivePeerAddress(peerWalletAddress);
        setActiveSessionId(latestAccepted.sessionId);
      }
    }
  }, [acceptedSentRequests]);

  // Handle trade session status changes (close sync)
  useEffect(() => {
    if (activeTradeSession && activeSessionId) {
      if (activeTradeSession.status === "cancelled" || activeTradeSession.status === "completed") {
        // Play dialog close sound
        playDialogCloseSound();
        setActiveSessionId(null);
        setActivePeerAddress("");
      }
    }
  }, [activeTradeSession, activeSessionId]);

  const handleAccept = async () => {
    if (!incomingRequest) return;

    try {
      const result = await acceptRequest({ requestId: incomingRequest.id });
      const peerWalletAddress = extractWalletAddress(incomingRequest.fromUserId);
      setActivePeerAddress(peerWalletAddress);
      setIncomingRequest(null);

      // Play dialog open sound for recipient
      playDialogOpenSound();

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
      setActivePeerAddress("");
    }
  };

  const peerWalletAddress = incomingRequest
    ? extractWalletAddress(incomingRequest.fromUserId)
    : "";
  const isPeerWallet = peerWalletAddress.startsWith("1");

  return (
    <>
      {/* Incoming trade request dialog */}
      <Dialog open={!!incomingRequest} onOpenChange={(open) => !open && handleDecline()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              🔔 Trade Request
            </DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center gap-3 pt-2">
                {isPeerWallet && (
                  <span className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 inline-flex">
                    <SigmaAvatar
                      name={peerWalletAddress}
                      colors={["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"]}
                      className="h-full w-full"
                    />
                  </span>
                )}
                <span>
                  <span className="text-foreground font-medium font-mono block">
                    {truncateAddress(peerWalletAddress)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    wants to trade with you
                  </span>
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleDecline}>
              Decline
            </Button>
            <Button onClick={handleAccept}>
              Accept Trade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active trade session */}
      {activeSessionId && (
        <TradeDialog
          open={!!activeSessionId}
          onOpenChange={handleCloseTradeDialog}
          peerAddress={activePeerAddress}
          peerLabel={truncateAddress(activePeerAddress)}
        />
      )}
    </>
  );
}
