import { signal } from "@preact/signals-react";
import type { BridgeMethod } from "@/types/bridge";

export type BridgePrompt = {
	id: string;
	method: BridgeMethod;
	origin: string;
	intent?: string;
	meta?: Record<string, unknown>;
};

export const bridgePrompt = signal<BridgePrompt | null>(null);
export const bridgeResolver = signal<((approved: boolean) => void) | null>(null);

