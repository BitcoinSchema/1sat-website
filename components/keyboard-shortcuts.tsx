"use client";

"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

export function KeyboardShortcuts() {
	const router = useRouter();
	// We can't easily access both sidebar contexts here because they are nested.
	// This component needs to be inside the context to toggle.
	// But we have TWO contexts.

	// Strategy: This component handles NAVIGATION shortcuts only.
	// Sidebar toggles need to be handled where the context is available (in Layout).

	const [lastKey, setLastKey] = React.useState<string | null>(null);

	React.useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Ignore if typing in an input
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			const key = e.key.toLowerCase();

			if (lastKey === "g") {
				switch (key) {
					case "h":
						router.push("/");
						setLastKey(null);
						break;
					case "w":
						router.push("/wallet");
						setLastKey(null);
						break;
					case "m":
						router.push("/market/ordinals"); // Default market page
						setLastKey(null);
						break;
					case "b":
						router.push("/market/bsv20");
						setLastKey(null);
						break;
					case "v":
						router.push("/market/bsv21");
						setLastKey(null);
						break;
					case "i":
						router.push("/inscribe");
						setLastKey(null);
						break;
					case "e":
						router.push("/mine");
						setLastKey(null);
						break;
					case "d":
						router.push("/docs");
						setLastKey(null);
						break;
					case "s":
						router.push("/settings");
						setLastKey(null);
						break;
					case "o":
						router.push("/wallet/ordinals");
						setLastKey(null);
						break;
					case "2":
						router.push("/wallet/bsv20");
						setLastKey(null);
						break;
					case "1":
						router.push("/wallet/bsv21");
						setLastKey(null);
						break;
					case "l":
						router.push("/listings");
						setLastKey(null);
						break;
					case ",":
						router.push("/wallet/settings");
						setLastKey(null);
						break;
					case "y":
						router.push("/wallet/history");
						setLastKey(null);
						break;
					case "a":
						router.push("/activity");
						setLastKey(null);
						break;
					default:
						setLastKey(null); // Reset if invalid sequence
						break;
				}
			} else if (key === "g") {
				setLastKey("g");
				// Optional: Set a timeout to clear 'g' if next key doesn't come fast enough
				setTimeout(() => setLastKey(null), 1000);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [lastKey, router]);

	return null;
}
