"use client";

import { useEffect, useRef } from "react";
import { useSound } from "@/hooks/use-sound";
import { useSidebar } from "@/components/ui/sidebar";

interface SidebarSoundEffectsProps {
	volume?: number;
}

/**
 * Plays subtle open/close audio whenever the current sidebar context changes.
 * This keeps sound behavior outside the base shadcn sidebar component.
 */
export function SidebarSoundEffects({ volume = 0.2 }: SidebarSoundEffectsProps) {
	const { open, openMobile } = useSidebar();
	const { play } = useSound();
	const previousOpenRef = useRef<boolean | null>(null);
	const previousOpenMobileRef = useRef<boolean | null>(null);

	useEffect(() => {
		if (previousOpenRef.current === null) {
			previousOpenRef.current = open;
			return;
		}
		if (previousOpenRef.current !== open) {
			play("dialog", volume);
		}
		previousOpenRef.current = open;
	}, [open, play, volume]);

	useEffect(() => {
		if (previousOpenMobileRef.current === null) {
			previousOpenMobileRef.current = openMobile;
			return;
		}
		if (previousOpenMobileRef.current !== openMobile) {
			play("dialog", volume);
		}
		previousOpenMobileRef.current = openMobile;
	}, [openMobile, play, volume]);

	return null;
}

