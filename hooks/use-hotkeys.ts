"use client";

import { useEffect } from "react";

export function useHotkeys(
	key: string,
	callback: () => void,
	deps: unknown[] = [],
) {
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				(event.metaKey || event.ctrlKey) &&
				event.key.toLowerCase() === key.toLowerCase()
			) {
				event.preventDefault();
				callback();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [key, callback, ...deps]);
}
