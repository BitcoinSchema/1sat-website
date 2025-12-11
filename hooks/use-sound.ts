"use client";

import { useCallback, useEffect, useRef } from "react";
import { SOUND_VOLUMES, SOUNDS, type SoundName } from "@/lib/sounds";

/**
 * Hook for playing UI sounds.
 *
 * Uses Web Audio API with HTMLAudioElement for broad compatibility.
 * Sounds are preloaded on mount for instant playback.
 *
 * @example
 * const { play } = useSound();
 * <button onClick={() => play("click")}>Click me</button>
 */
export function useSound() {
	const audioCache = useRef<Map<SoundName, HTMLAudioElement>>(new Map());

	// Preload sounds on mount
	useEffect(() => {
		if (typeof window === "undefined") return;

		for (const [name, path] of Object.entries(SOUNDS)) {
			const audio = new Audio(path);
			audio.preload = "auto";
			audio.volume = SOUND_VOLUMES[name as SoundName];
			audioCache.current.set(name as SoundName, audio);
		}

		return () => {
			audioCache.current.clear();
		};
	}, []);

	const play = useCallback((sound: SoundName, volumeOverride?: number) => {
		const audio = audioCache.current.get(sound);
		if (!audio) return;

		// Apply volume override if provided
		if (volumeOverride !== undefined) {
			audio.volume = Math.max(0, Math.min(1, volumeOverride));
		} else {
			audio.volume = SOUND_VOLUMES[sound];
		}

		// Reset and play
		audio.currentTime = 0;
		audio.play().catch(() => {
			// Silently fail if audio can't play (user hasn't interacted, etc.)
		});
	}, []);

	return { play };
}
