"use client";

import { useCWIRelay } from "@/lib/hooks/use-cwi-relay";

/**
 * Client component that mounts the CWI relay in the wallet tab.
 * Renders nothing — just activates the relay hook.
 */
export function CWIRelayProvider() {
	useCWIRelay();
	return null;
}
