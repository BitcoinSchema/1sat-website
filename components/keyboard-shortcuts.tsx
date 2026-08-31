"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import * as React from "react";
import { useStackFeatures } from "@/lib/hooks/use-stack-features";

export function KeyboardShortcuts() {
	const router = useRouter();
	const { resolvedTheme, setTheme } = useTheme();
	const features = useStackFeatures().data?.features;
	// We can't easily access both sidebar contexts here because they are nested.
	// This component needs to be inside the context to toggle.
	// But we have TWO contexts.

	// Strategy: This component handles NAVIGATION shortcuts only.
	// Sidebar toggles need to be handled where the context is available (in Layout).

	const gPressedAt = React.useRef(0);

	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ignore if typing in an input
			if (
				e.target instanceof HTMLElement &&
				(e.target.matches("input, textarea, select") ||
					e.target.isContentEditable)
			) {
				return;
			}

			const key = e.key.toLowerCase();
			if ((e.metaKey || e.ctrlKey) && e.shiftKey && key === "d") {
				e.preventDefault();
				setTheme(resolvedTheme === "dark" ? "light" : "dark");
				return;
			}

			if (gPressedAt.current && e.timeStamp - gPressedAt.current <= 1000) {
				gPressedAt.current = 0;
				switch (key) {
					case "h":
						router.push("/");
						break;
					case "w":
						router.push("/wallet");
						break;
					case "m":
						if (features?.ordinalMarket) router.push("/market/ordinals");
						break;
					case "v":
						if (features?.bsv21) router.push("/market/bsv21");
						break;
					case "i":
						if (features?.inscribe) router.push("/inscribe");
						break;
					case "d":
						router.push("/docs");
						break;
					case "s":
						router.push("/settings");
						break;
					case "o":
						if (features?.ordinals) router.push("/wallet/ordinals");
						break;
					case "1":
						if (features?.bsv21) router.push("/wallet/bsv21");
						break;
					case ",":
						router.push("/wallet/settings");
						break;
					case "y":
						router.push("/wallet/history");
						break;
					case "a":
						if (features?.activity) router.push("/activity");
						break;
				}
			} else if (key === "g") {
				gPressedAt.current = e.timeStamp;
			} else {
				gPressedAt.current = 0;
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [features, resolvedTheme, router, setTheme]);

	return null;
}
