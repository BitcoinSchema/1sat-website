"use client";

import usePresence from "@convex-dev/presence/react";
import { useAction, useMutation } from "convex/react";
import { MousePointer2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { wifToAddress } from "@/lib/keys";
import { registerTradeDisplayId } from "@/lib/trade-display-id";
import { useAuth } from "@/providers/auth-provider";
import { useWallet } from "@/providers/wallet-provider";
import { api } from "../../convex/_generated/api";

interface CursorData {
	x: number;
	y: number;
	displayId?: string;
}

interface Cursor {
	id: string;
	x: number;
	y: number;
	color: string;
	label: string;
	displayId: string;
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

// Truncate identifier for display
function truncateIdentifier(identifier: string): string {
	if (identifier.length <= 12) return identifier;
	return `${identifier.slice(0, 6)}...${identifier.slice(-4)}`;
}

function isLegacyDisplayIdValidationError(error: unknown): boolean {
	const message = error instanceof Error ? error.message : String(error);
	return (
		message.includes("displayId") &&
		message.toLowerCase().includes("extra field")
	);
}

export function SharedPresence() {
	const containerRef = useRef<HTMLDivElement>(null);
	const throttleRef = useRef<number>(0);
	const supportsDisplayIdRef = useRef(true);
	const updateInFlightRef = useRef(false);
	const [scrollOpacity, setScrollOpacity] = useState(1);

	// Track scroll for fade effect
	useEffect(() => {
		const handleScroll = () => {
			setScrollOpacity(Math.max(0, 1 - window.scrollY / 200));
		};
		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	// Get wallet context
	const { walletKeys, isWalletLocked } = useWallet();
	const { user: authUser, accessToken } = useAuth();

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
		if (typeof window === "undefined")
			return Math.random().toString(36).slice(2, 6);
		let suffix = sessionStorage.getItem("presence-session-suffix");
		if (!suffix) {
			suffix = Math.random().toString(36).slice(2, 6);
			sessionStorage.setItem("presence-session-suffix", suffix);
		}
		return suffix;
	}, []);

	// Use stable internal identity for routing trade requests.
	const userId = useMemo(() => {
		if (authUser?.sub) {
			return authUser.sub;
		}
		if (myAddress) {
			return `${myAddress}:${sessionSuffix}`;
		}
		// Fallback for anonymous users
		if (typeof window === "undefined")
			return `anon-${Math.random().toString(36).slice(2, 9)}`;
		let id = sessionStorage.getItem("presence-user-id");
		if (!id) {
			id = `anon-${Math.random().toString(36).slice(2, 9)}`;
			sessionStorage.setItem("presence-user-id", id);
		}
		return id;
	}, [authUser?.sub, myAddress, sessionSuffix]);

	const myDisplayId = useMemo(() => {
		return authUser?.bap_id || myAddress || userId;
	}, [authUser?.bap_id, myAddress, userId]);

	useEffect(() => {
		registerTradeDisplayId(userId, myDisplayId);
	}, [myDisplayId, userId]);

	// Use official presence hook
	const presenceState = usePresence(api.presence, "main-room", userId);

	// Mutations
	const updateCursor = useMutation(api.presence.updateCursor);
	const sendTradeRequest = useAction(api.authenticatedTrades.sendTradeRequest);

	const sendCursorUpdate = useCallback(
		async (x: number, y: number) => {
			if (updateInFlightRef.current) {
				return;
			}
			updateInFlightRef.current = true;

			const fallbackPayload = {
				roomId: "main-room",
				userId,
				data: { x, y },
			};

			try {
				if (!supportsDisplayIdRef.current) {
					await updateCursor(fallbackPayload).catch(() => {});
					return;
				}

				await updateCursor({
					...fallbackPayload,
					data: { ...fallbackPayload.data, displayId: myDisplayId },
				});
			} catch (error) {
				if (isLegacyDisplayIdValidationError(error)) {
					supportsDisplayIdRef.current = false;
					await updateCursor(fallbackPayload).catch(() => {});
				}
			} finally {
				updateInFlightRef.current = false;
			}
		},
		[myDisplayId, updateCursor, userId],
	);

	// Track mouse movement and sync to server
	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			const now = Date.now();
			if (now - throttleRef.current < 66) return; // ~15fps
			throttleRef.current = now;

			if (!containerRef.current) return;

			const rect = containerRef.current.getBoundingClientRect();
			const x = ((e.clientX - rect.left) / rect.width) * 100;
			const y = ((e.clientY - rect.top) / rect.height) * 100;

			const clampedX = Math.max(0, Math.min(100, x));
			const clampedY = Math.max(0, Math.min(100, y));

			void sendCursorUpdate(clampedX, clampedY);
		},
		[sendCursorUpdate],
	);

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
				const displayId =
					(typeof data?.displayId === "string" && data.displayId.trim()) ||
					(p.userId.includes(":") ? p.userId.split(":")[0] : p.userId);
				registerTradeDisplayId(p.userId, displayId);

				return {
					id: p.userId,
					x,
					y,
					color: getCursorColor(index),
					label: truncateIdentifier(displayId),
					displayId,
					online: p.online,
				};
			});
	}, [presenceState, userId]);

	// Handle clicking on a cursor to initiate trade
	const handleCursorClick = async (e: React.SyntheticEvent, cursor: Cursor) => {
		e.stopPropagation();

		if (!myAddress) {
			toast.error("Connect and unlock your wallet to initiate trades.");
			return;
		}

		if (cursor.id.startsWith("anon-")) {
			toast.error(
				"Cannot trade with anonymous users. The other user must connect a wallet.",
			);
			return;
		}

		const token = accessToken;
		if (!token) {
			toast.error("Sign in with Sigma Identity before starting a trade.");
			return;
		}

		try {
			registerTradeDisplayId(cursor.id, cursor.displayId);

			const result = (await sendTradeRequest({
				accessToken: token,
				toUserId: cursor.id,
			})) as { alreadyExists?: boolean };

			if (result.alreadyExists) {
				console.info("Trade request pending", cursor.label);
			} else {
				console.info("Trade request sent!", cursor.label);
			}
		} catch (error) {
			console.error("Failed to send trade request:", error);
			toast.error("Failed to send trade request.");
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
						<span className="flex h-2 w-2 rounded-full bg-chart-4 animate-pulse" />
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
