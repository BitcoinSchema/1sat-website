"use client";

import {
	AlertTriangle,
	ArrowUpDown,
	CheckCircle2,
	Cog,
	Loader2,
	Radio,
	Terminal,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	type SyncEvent,
	useWalletToolbox,
	type WalletEvent,
} from "@/providers/wallet-toolbox-provider";

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

/** Unified entry that can be either a typed wallet event or a console-captured log. */
type TimelineEntry =
	| { kind: "wallet"; event: WalletEvent }
	| { kind: "log"; event: SyncEvent };

function WalletEventRow({ event }: { event: WalletEvent }) {
	switch (event.type) {
		case "broadcast":
			return (
				<div className="flex items-start gap-2">
					<Radio className="mt-0.5 size-3 shrink-0 text-sky-400" />
					<span className="inline-flex items-center gap-1.5">
						<span className="rounded bg-sky-500/15 px-1.5 py-px text-[10px] uppercase tracking-wider text-sky-300">
							broadcast
						</span>
						<code className="rounded bg-zinc-800 px-1.5 py-px text-[10px] text-zinc-300">
							{event.txid.slice(0, 12)}...
						</code>
						<span
							className={cn(
								"rounded px-1.5 py-px text-[10px] uppercase tracking-wider",
								event.status === "success"
									? "bg-emerald-500/15 text-emerald-300"
									: "bg-rose-500/15 text-rose-300",
							)}
						>
							{event.status}
						</span>
					</span>
				</div>
			);

		case "proven":
			return (
				<div className="flex items-start gap-2">
					<CheckCircle2 className="mt-0.5 size-3 shrink-0 text-emerald-400" />
					<span className="inline-flex items-center gap-1.5">
						<span className="rounded bg-emerald-500/15 px-1.5 py-px text-[10px] uppercase tracking-wider text-emerald-300">
							confirmed
						</span>
						<code className="rounded bg-zinc-800 px-1.5 py-px text-[10px] text-zinc-300">
							{event.txid.slice(0, 12)}...
						</code>
						<span className="text-zinc-500">block</span>
						<span className="font-semibold text-emerald-200">
							{event.blockHeight.toLocaleString()}
						</span>
					</span>
				</div>
			);

		case "sync:progress":
			return (
				<div className="flex items-start gap-2">
					<ArrowUpDown className="mt-0.5 size-3 shrink-0 text-violet-400" />
					<span className="inline-flex items-center gap-1.5">
						<span className="rounded bg-violet-500/15 px-1.5 py-px text-[10px] uppercase tracking-wider text-violet-300">
							{event.stage}
						</span>
						<span className="text-zinc-300">{event.message}</span>
					</span>
				</div>
			);

		case "sync:backup":
			return (
				<div className="flex items-start gap-2">
					<ArrowUpDown className="mt-0.5 size-3 shrink-0 text-violet-400" />
					<span className="inline-flex items-center gap-1.5">
						<span className="rounded bg-violet-500/15 px-1.5 py-px text-[10px] uppercase tracking-wider text-violet-300">
							backup
						</span>
						<span className="text-zinc-300">{event.message}</span>
					</span>
				</div>
			);

		case "task:run":
			return (
				<div className="flex items-start gap-2">
					<Cog className="mt-0.5 size-3 shrink-0 text-amber-400" />
					<span className="inline-flex items-center gap-1.5">
						<span className="rounded bg-amber-500/15 px-1.5 py-px text-[10px] uppercase tracking-wider text-amber-300">
							{event.taskName}
						</span>
						<span className="text-zinc-300">{event.result}</span>
					</span>
				</div>
			);

		case "error":
			return (
				<div className="flex items-start gap-2">
					<AlertTriangle className="mt-0.5 size-3 shrink-0 text-rose-400" />
					<span className="inline-flex items-center gap-1.5">
						<span className="rounded bg-rose-500/15 px-1.5 py-px text-[10px] uppercase tracking-wider text-rose-300">
							error
						</span>
						<span className="text-zinc-400">{event.source}</span>
						<span className="text-rose-200">{event.message}</span>
					</span>
				</div>
			);

		case "log":
			return (
				<div className="flex items-start gap-2">
					<Terminal className="mt-0.5 size-3 shrink-0 text-zinc-500" />
					<span className="inline-flex items-center gap-1.5">
						<span className="text-emerald-300/70">[{event.source}]</span>
						<span
							className={cn(
								event.level === "error"
									? "text-rose-300"
									: event.level === "warn"
										? "text-amber-300"
										: "text-zinc-300",
							)}
						>
							{event.message}
						</span>
					</span>
				</div>
			);
	}
}

function LogEventRow({ event }: { event: SyncEvent }) {
	return (
		<div className="flex items-start gap-2">
			<Terminal className="mt-0.5 size-3 shrink-0 text-zinc-600" />
			<span
				className={cn(
					"inline-flex items-center gap-1.5",
					event.level === "error"
						? "text-rose-300"
						: event.level === "warn"
							? "text-amber-300"
							: "text-emerald-100/70",
				)}
			>
				<span className="text-emerald-300/50">[{event.source}]</span>
				<span>{event.message}</span>
			</span>
		</div>
	);
}

export function SyncActivityTerminal({
	className,
	maxVisibleLines = 240,
}: SyncActivityTerminalProps) {
	const {
		syncEvents,
		walletEvents,
		hasActiveSync,
		clearSyncEvents,
		clearWalletEvents,
	} = useWalletToolbox();
	const [stickToBottom, setStickToBottom] = useState(true);
	const scrollRef = useRef<HTMLDivElement | null>(null);

	// Merge both event streams into a single timeline sorted by timestamp
	const timeline = useMemo(() => {
		const entries: TimelineEntry[] = [];
		for (const e of walletEvents) entries.push({ kind: "wallet", event: e });
		for (const e of syncEvents) entries.push({ kind: "log", event: e });
		entries.sort((a, b) => a.event.timestamp - b.event.timestamp);
		return entries.slice(-maxVisibleLines);
	}, [walletEvents, syncEvents, maxVisibleLines]);

	const totalCount = walletEvents.length + syncEvents.length;

	useEffect(() => {
		if (!scrollRef.current || !stickToBottom || totalCount === 0) return;
		scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
	}, [totalCount, stickToBottom]);

	const clearAll = () => {
		clearSyncEvents();
		clearWalletEvents();
	};

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
						Monitor
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
						{hasActiveSync ? "Active" : "Idle"}
					</span>
				</div>
				<div className="flex items-center gap-2">
					<span className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-400/70">
						{totalCount} events
					</span>
					<Button
						variant="ghost"
						size="sm"
						className="h-7 px-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
						onClick={clearAll}
						disabled={totalCount === 0}
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
				className="h-64 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-5"
			>
				{timeline.length === 0 ? (
					<p className="py-12 text-center text-[11px] uppercase tracking-[0.14em] text-zinc-500">
						Waiting for wallet activity...
					</p>
				) : (
					<div className="space-y-0.5">
						{timeline.map((entry) => (
							<div
								key={`${entry.kind}-${entry.event.id}`}
								className="grid grid-cols-[90px_1fr] gap-3 whitespace-pre-wrap break-words"
							>
								<span className="text-cyan-300/70">
									{formatTimestamp(entry.event.timestamp)}
								</span>
								{entry.kind === "wallet" ? (
									<WalletEventRow event={entry.event} />
								) : (
									<LogEventRow event={entry.event} />
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</section>
	);
}
