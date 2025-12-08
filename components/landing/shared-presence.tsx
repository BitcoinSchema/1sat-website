"use client";

import usePresence from "@convex-dev/presence/react";
import { useMutation } from "convex/react";
import { MousePointer2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { useWallet } from "@/providers/wallet-provider";
import { wifToAddress } from "@/lib/keys";

interface CursorData {
  x: number;
  y: number;
}

interface Cursor {
  id: string;
  x: number;
  y: number;
  color: string;
  label: string;
  address: string;
  online: boolean;
}

// Cursor colors - prioritized from most colorful to least
const CURSOR_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--destructive))",
  "hsl(var(--secondary))",
];

// Generate a random vibrant color when we run out of base colors
function generateRandomShade(seed: number): string {
  const hue = (seed * 137.508) % 360;
  const saturation = 60 + (seed % 30);
  const lightness = 45 + (seed % 20);
  return `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`;
}

// Get color by index
function getCursorColor(index: number): string {
  if (index < CURSOR_COLORS.length) {
    return CURSOR_COLORS[index];
  }
  return generateRandomShade(index);
}

// Truncate address for display
function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function SharedPresence() {
  const containerRef = useRef<HTMLDivElement>(null);
  const throttleRef = useRef<number>(0);
  const [scrollOpacity, setScrollOpacity] = useState(1);

  // Track scroll for fade effect
  useEffect(() => {
    const handleScroll = () => {
      setScrollOpacity(Math.max(0, 1 - window.scrollY / 200));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get wallet context
  const { walletKeys, isWalletLocked } = useWallet();

  // Derive the user's address from wallet keys
  const myAddress = useMemo(() => {
    if (walletKeys?.ordPk && !isWalletLocked) {
      try {
        return wifToAddress(walletKeys.ordPk);
      } catch (e) {
        console.error("[SharedPresence] Failed to derive address:", e);
        return null;
      }
    }
    return null;
  }, [walletKeys, isWalletLocked]);

  // Generate a unique session ID for this browser tab
  const sessionSuffix = useMemo(() => {
    if (typeof window === "undefined") return Math.random().toString(36).slice(2, 6);
    let suffix = sessionStorage.getItem("presence-session-suffix");
    if (!suffix) {
      suffix = Math.random().toString(36).slice(2, 6);
      sessionStorage.setItem("presence-session-suffix", suffix);
    }
    return suffix;
  }, []);

  // Use address + session suffix as userId
  const userId = useMemo(() => {
    if (myAddress) {
      return `${myAddress}:${sessionSuffix}`;
    }
    // Fallback for anonymous users
    if (typeof window === "undefined") return `anon-${Math.random().toString(36).slice(2, 9)}`;
    let id = sessionStorage.getItem("presence-user-id");
    if (!id) {
      id = `anon-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem("presence-user-id", id);
    }
    return id;
  }, [myAddress, sessionSuffix]);

  // Use official presence hook
  const presenceState = usePresence(api.presence, "main-room", userId);

  // Mutations
  const updateCursor = useMutation(api.presence.updateCursor);
  const sendTradeRequest = useMutation(api.trades.sendTradeRequest);

  // Track mouse movement and sync to server
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = Date.now();
    if (now - throttleRef.current < 66) return; // ~15fps
    throttleRef.current = now;

    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    updateCursor({
      roomId: "main-room",
      userId: userId,
      data: { x: clampedX, y: clampedY },
    }).catch(() => { });
  }, [updateCursor, userId]);

  // Set up mouse tracking
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [handleMouseMove]);

  // Convert presence state to cursor format
  const cursors: Cursor[] = useMemo(() => {
    if (!presenceState) return [];

    return presenceState
      .filter((p) => p.userId !== userId && p.online)
      .map((p, index) => {
        const data = p.data as CursorData | undefined;
        const x = data?.x ?? 50;
        const y = data?.y ?? 50;

        // Extract wallet address from userId (format: "address:session" or "anon-xxx")
        const walletAddress = p.userId.includes(":") ? p.userId.split(":")[0] : p.userId;
        const isWalletUser = walletAddress.startsWith("1");

        return {
          id: p.userId,
          x,
          y,
          color: getCursorColor(index),
          label: isWalletUser ? truncateAddress(walletAddress) : walletAddress,
          address: walletAddress,
          online: p.online,
        };
      });
  }, [presenceState, userId]);

  // Handle clicking on a cursor to initiate trade
  const handleCursorClick = async (e: React.SyntheticEvent, cursor: Cursor) => {
    e.stopPropagation();

    if (!myAddress) {
      alert("Connect your wallet to trade. You need an unlocked wallet to initiate trades.");
      return;
    }

    if (!cursor.address.startsWith("1")) {
      alert("Cannot trade with anonymous user. The other user needs to connect their wallet.");
      return;
    }

    try {
      const result = await sendTradeRequest({
        fromUserId: userId,
        toUserId: cursor.id,
      });

      if (result.alreadyExists) {
        console.info("Trade request pending", cursor.label);
      } else {
        console.info("Trade request sent!", cursor.label);
      }
    } catch (error) {
      console.error("Failed to send trade request:", error);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, cursor: Cursor) => {
    e.preventDefault();
    e.stopPropagation();
    handleCursorClick(e, cursor);
  };

  const onlineCount = cursors.length;

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden pointer-events-none relative"
    >
      {/* Online indicator - Fixed bottom right, fades on scroll */}
      {presenceState && (
        <div
          className="fixed bottom-4 right-4 pointer-events-auto z-50 transition-opacity duration-300"
          style={{ opacity: scrollOpacity }}
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-primary/20 text-sm">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-muted-foreground">
              {onlineCount + 1} online
            </span>
          </div>
        </div>
      )}

      {/* Other users' cursors */}
      {cursors.map((cursor) => (
        <button
          key={cursor.id}
          type="button"
          className="absolute pointer-events-auto cursor-pointer group p-0 border-none bg-transparent hover:scale-110 z-50"
          style={{
            left: `${cursor.x}%`,
            top: `${cursor.y}%`,
            transform: "translate(-2px, -2px)",
            transition: "left 0.1s ease-out, top 0.1s ease-out",
          }}
          onClick={(e) => handleCursorClick(e, cursor)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleCursorClick(e as React.SyntheticEvent, cursor);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, cursor)}
          aria-label={`Click to trade with ${cursor.label}`}
        >
          <div className="relative" style={{ color: cursor.color }}>
            <MousePointer2
              className="w-6 h-6 transform -rotate-12 drop-shadow-lg"
              fill="currentColor"
              strokeWidth={1}
            />
            <div
              className="absolute left-6 top-6 px-2 py-1 text-xs rounded-full text-white font-medium whitespace-nowrap shadow-lg font-mono"
              style={{ backgroundColor: cursor.color }}
            >
              {cursor.label}
            </div>
            <div
              className="absolute -inset-3 rounded-full opacity-0 group-hover:opacity-30 transition-opacity -z-10"
              style={{ backgroundColor: cursor.color }}
            />
          </div>
        </button>
      ))}
    </div>
  );
}
