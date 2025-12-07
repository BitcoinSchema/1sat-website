"use client";

import { MousePointer2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { TradeDialog } from "./trade-dialog";

interface Cursor {
	id: string;
	x: number; // Percentage 0-100
	y: number; // Percentage 0-100
	color: string;
	label: string;
}

const COLORS = ["#ff3366", "#33ccff", "#33ff99", "#ffcc33", "#cc33ff"];

export function SharedPresence() {
	const [cursors, setCursors] = useState<Cursor[]>([]);
	const [selectedPeer, setSelectedPeer] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Initialize mock cursors
		const mockCursors: Cursor[] = Array.from({ length: 4 }).map((_, i) => ({
			id: `peer-${Math.random().toString(36).substr(2, 5)}`,
			x: Math.random() * 80 + 10,
			y: Math.random() * 80 + 10,
			color: COLORS[i % COLORS.length],
			label: `User ${Math.floor(Math.random() * 1000)}`,
		}));
		setCursors(mockCursors);

		// Animate cursors
		const interval = setInterval(() => {
			setCursors((prev) =>
				prev.map((cursor) => ({
					...cursor,
					x: Math.max(5, Math.min(95, cursor.x + (Math.random() - 0.5) * 10)),
					y: Math.max(5, Math.min(95, cursor.y + (Math.random() - 0.5) * 10)),
				})),
			);
		}, 2000);

		return () => clearInterval(interval);
	}, []);

	const handleCursorClick = (e: React.SyntheticEvent, cursor: Cursor) => {
		e.stopPropagation();
		setSelectedPeer(cursor.label);
	};

	const handleContextMenu = (e: React.SyntheticEvent, cursor: Cursor) => {
		e.preventDefault();
		e.stopPropagation();
		setSelectedPeer(cursor.label);
	};
	return (
		<div
			ref={containerRef}
			className="w-full h-full overflow-hidden pointer-events-none"
		>
			{cursors.map((cursor) => (
				<button
					key={cursor.id}
					type="button" // Important for buttons
					className="absolute transition-all duration-[2000ms] ease-in-out pointer-events-auto cursor-pointer group p-0 border-none bg-transparent hover:scale-110 z-50" // Adjust styling
					style={{
						left: `${cursor.x}%`,
						top: `${cursor.y}%`,
						width: "fit-content", // To ensure it doesn't take full width
						height: "fit-content", // To ensure it doesn't take full height
					}}
					onClick={(e) => handleCursorClick(e, cursor)}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							handleCursorClick(e as React.SyntheticEvent, cursor); // Fix 'any' here
						}
					}}
					onContextMenu={(e) => handleContextMenu(e, cursor)}
				>
					<div className="relative">
						<MousePointer2
							className="w-5 h-5 transform -rotate-12 drop-shadow-md"
							style={{ color: cursor.color, fill: cursor.color }}
						/>
						<div
							className="absolute left-4 top-4 px-2 py-1 text-xs rounded-full text-white font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
							style={{ backgroundColor: cursor.color }}
						>
							{cursor.label}
						</div>
						<div className="absolute -inset-4 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse -z-10" />
					</div>
				</button>
			))}

			<TradeDialog
				open={!!selectedPeer}
				onOpenChange={(open) => !open && setSelectedPeer(null)}
				peerId={selectedPeer || ""}
			/>
		</div>
	);
}
