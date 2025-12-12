"use client";

import { type DependencyList, useEffect } from "react";

export function useHotkeys(
	key: string,
	callback: () => void,
	deps: DependencyList = [],
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
