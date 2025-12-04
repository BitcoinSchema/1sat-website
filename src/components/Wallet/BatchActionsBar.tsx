"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	clearSelection,
	selectedCount,
	selectedOutpoints,
} from "@/signals/wallet/selection";
import { useSignals } from "@preact/signals-react/runtime";
import { Layers, List, Send, X } from "lucide-react";

interface BatchActionsBarProps {
	onSend?: (outpoints: string[]) => void;
	onList?: (outpoints: string[]) => void;
}

export const BatchActionsBar = ({ onSend, onList }: BatchActionsBarProps) => {
	useSignals();

	const count = selectedCount.value;

	if (count === 0) return null;

	const handleSend = () => {
		onSend?.(Array.from(selectedOutpoints.value));
	};

	const handleList = () => {
		onList?.(Array.from(selectedOutpoints.value));
	};

	return (
		<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
			<div className="flex items-center gap-1 p-1.5 bg-zinc-950 border border-zinc-800 shadow-2xl shadow-black">
				{/* Status Block */}
				<div className="flex items-center gap-3 px-3 py-1.5 bg-zinc-900 border border-zinc-800 mr-1">
					<Layers className="w-4 h-4 text-green-500" />
					<span className="font-mono text-sm font-bold text-zinc-200">
						{count}{" "}
						<span className="text-zinc-500 text-xs font-normal">SELECTED</span>
					</span>
				</div>

				{/* Actions */}
				{onSend && (
					<Button
						onClick={handleSend}
						className="rounded-none bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono text-xs uppercase h-10 px-4"
					>
						<Send className="w-3 h-3 mr-2" />
						Send
					</Button>
				)}

				{onList && (
					<Button
						onClick={handleList}
						className="rounded-none bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-mono text-xs uppercase h-10 px-4"
					>
						<List className="w-3 h-3 mr-2" />
						List
					</Button>
				)}

				<Separator orientation="vertical" className="h-6 bg-zinc-800 mx-1" />

				<Button
					onClick={clearSelection}
					variant="ghost"
					className="rounded-none hover:bg-red-900/20 hover:text-red-400 text-zinc-500 h-10 w-10 p-0"
				>
					<X className="w-4 h-4" />
				</Button>
			</div>
		</div>
	);
};

export default BatchActionsBar;
