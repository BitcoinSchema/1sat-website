"use client";

import { useCallback, useEffect, useState } from "react";

const SOUND_MUTED_KEY = "1sat_sound_muted";

function getInitialMuted(): boolean {
	if (typeof window === "undefined") return false;
	// Respect prefers-reduced-motion
	if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
		return true;
	}
	return window.localStorage.getItem(SOUND_MUTED_KEY) === "1";
}

const listeners: Set<() => void> = new Set();
let globalMuted: boolean | null = null;

function getGlobalMuted(): boolean {
	if (globalMuted === null) {
		globalMuted = getInitialMuted();
	}
	return globalMuted;
}

function setGlobalMuted(value: boolean) {
	globalMuted = value;
	if (typeof window !== "undefined") {
		window.localStorage.setItem(SOUND_MUTED_KEY, value ? "1" : "0");
	}
	for (const listener of listeners) {
		listener();
	}
}

/**
 * Hook for managing global sound mute state.
 * Persists to localStorage. Respects prefers-reduced-motion.
 */
export function useSoundSettings() {
	const [muted, setMuted] = useState(getGlobalMuted);

	useEffect(() => {
		const listener = () => setMuted(getGlobalMuted());
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}, []);

	// Listen for prefers-reduced-motion changes
	useEffect(() => {
		if (typeof window === "undefined") return;
		const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
		const handler = (e: MediaQueryListEvent) => {
			if (e.matches) {
				setGlobalMuted(true);
			}
		};
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, []);

	const toggleMuted = useCallback(() => {
		setGlobalMuted(!getGlobalMuted());
	}, []);

	return { muted, toggleMuted };
}

/**
 * Check if sound is globally muted (non-hook version for use-sound).
 */
export function isSoundMuted(): boolean {
	return getGlobalMuted();
}
