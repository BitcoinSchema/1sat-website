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
			<div className="flex items-center gap-1 p-1.5 bg-background border border-border shadow-2xl shadow-black/50 rounded-md">
				{/* Status Block */}
				<div className="flex items-center gap-3 px-3 py-1.5 bg-muted border border-border mr-1 rounded-sm">
					<Layers className="w-4 h-4 text-primary" />
					<span className="font-mono text-sm font-bold text-foreground">
						{count}{" "}
						<span className="text-muted-foreground text-xs font-normal">SELECTED</span>
					</span>
				</div>

				{/* Actions */}
				{onSend && (
					<Button
						onClick={handleSend}
						variant="secondary"
						className="rounded-sm bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground border border-border font-mono text-xs uppercase h-10 px-4"
					>
						<Send className="w-3 h-3 mr-2" />
						Send
					</Button>
				)}

				{onList && (
					<Button
						onClick={handleList}
						variant="secondary"
						className="rounded-sm bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground border border-border font-mono text-xs uppercase h-10 px-4"
					>
						<List className="w-3 h-3 mr-2" />
						List
					</Button>
				)}

				<Separator orientation="vertical" className="h-6 bg-border mx-1" />

				<Button
					onClick={clearSelection}
					variant="ghost"
					className="rounded-sm hover:bg-destructive/20 hover:text-destructive text-muted-foreground h-10 w-10 p-0"
				>
					<X className="w-4 h-4" />
				</Button>
			</div>
		</div>
	);
};

export default BatchActionsBar;
