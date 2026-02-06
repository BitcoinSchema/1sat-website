"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useWalletToolbox } from "@/providers/wallet-toolbox-provider";

interface SyncActivityTerminalProps {
	className?: string;
	maxVisibleLines?: number;
}

const formatTimestamp = (timestamp: number): string => {
	const date = new Date(timestamp);
	const hh = String(date.getHours()).padStart(2, "0");
	const mm = String(date.getMinutes()).padStart(2, "0");
	const ss = String(date.getSeconds()).padStart(2, "0");
	const ms = String(date.getMilliseconds()).padStart(3, "0");
	return `${hh}:${mm}:${ss}.${ms}`;
};

export function SyncActivityTerminal({
	className,
	maxVisibleLines = 240,
}: SyncActivityTerminalProps) {
	const { syncEvents, hasActiveSync, clearSyncEvents } = useWalletToolbox();
	const [stickToBottom, setStickToBottom] = useState(true);
	const scrollRef = useRef<HTMLDivElement | null>(null);

	const visibleEvents = useMemo(
		() => syncEvents.slice(-maxVisibleLines),
		[syncEvents, maxVisibleLines],
	);

	useEffect(() => {
		if (!scrollRef.current || !stickToBottom || syncEvents.length === 0) return;
		scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
	}, [syncEvents, stickToBottom]);

	return (
		<section
			className={cn(
				"rounded-xl border border-emerald-400/25 bg-black/90 shadow-[0_0_0_1px_rgba(16,185,129,0.1)]",
				className,
			)}
		>
			<header className="flex items-center justify-between border-b border-emerald-500/25 px-3 py-2">
				<div className="flex items-center gap-3">
					<p className="font-mono text-xs uppercase tracking-[0.18em] text-emerald-300">
						Initial Sync Stream
					</p>
					<span
						className={cn(
							"inline-flex items-center gap-1 rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
							hasActiveSync
								? "bg-emerald-500/15 text-emerald-300"
								: "bg-zinc-500/20 text-zinc-300",
						)}
					>
						{hasActiveSync && <Loader2 className="size-3 animate-spin" />}
						{hasActiveSync ? "Scanning" : "Idle"}
					</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-400/70">
						{syncEvents.length} lines
					</span>
					<Button
						variant="ghost"
						size="sm"
						className="h-7 px-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
						onClick={clearSyncEvents}
						disabled={syncEvents.length === 0}
					>
						<Trash2 className="mr-1 size-3.5" />
						Clear
					</Button>
				</div>
			</header>

			<div
				ref={scrollRef}
				onScroll={(event) => {
					const target = event.currentTarget;
					const delta =
						target.scrollHeight - target.scrollTop - target.clientHeight;
					setStickToBottom(delta < 24);
				}}
				className="h-64 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-5 text-emerald-100"
			>
				{visibleEvents.length === 0 ? (
					<p className="py-12 text-center text-[11px] uppercase tracking-[0.14em] text-zinc-500">
						Waiting for wallet activity...
					</p>
				) : (
					<div className="space-y-0.5">
						{visibleEvents.map((event) => (
							<div
								key={event.id}
								className={cn(
									"grid grid-cols-[110px_130px_1fr] gap-3 whitespace-pre-wrap break-words",
									event.level === "error"
										? "text-rose-300"
										: event.level === "warn"
											? "text-amber-300"
											: "text-emerald-100",
								)}
							>
								<span className="text-cyan-300/90">
									{formatTimestamp(event.timestamp)}
								</span>
								<span className="text-emerald-300/90">[{event.source}]</span>
								<span>{event.message}</span>
							</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
