"use client";

import { useCallback } from "react";
import { useCopyToClipboard } from "usehooks-ts";
import { useSound } from "@/hooks/use-sound";
import type { SoundName } from "@/lib/sounds";

interface UseCopyWithSoundOptions {
	successSound?: SoundName;
}

/**
 * Wrapper around useCopyToClipboard that plays a sound on successful copy.
 *
 * @param options.successSound - Sound to play on success. Default: "success"
 * @returns [copiedValue, copy] - Same API as useCopyToClipboard
 */
export function useCopyWithSound(options: UseCopyWithSoundOptions = {}) {
	const { successSound = "success" } = options;
	const [copiedValue, copyFn] = useCopyToClipboard();
	const { play } = useSound();

	const copy = useCallback(
		async (text: string) => {
			const success = await copyFn(text);
			if (success) {
				play(successSound);
			}
			return success;
		},
		[copyFn, play, successSound],
	);

	return [copiedValue, copy] as const;
}
