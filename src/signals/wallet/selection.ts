"use client";

import { computed, signal } from "@preact/signals-react";
import type { OrdUtxo } from "@/types/ordinals";

// --- Selection State ---
export const selectedOutpoints = signal<Set<string>>(new Set());
export const selectedCount = computed(() => selectedOutpoints.value.size);
export const isSelectionMode = computed(() => selectedOutpoints.value.size > 0);

// --- Search State ---
export const searchQuery = signal<string>("");

// --- Selection Actions ---

export const toggleSelection = (outpoint: string) => {
	const next = new Set(selectedOutpoints.value);
	if (next.has(outpoint)) {
		next.delete(outpoint);
	} else {
		next.add(outpoint);
	}
	selectedOutpoints.value = next;
};

export const clearSelection = () => {
	selectedOutpoints.value = new Set();
};

export const selectAll = (outpoints: string[]) => {
	selectedOutpoints.value = new Set(outpoints);
};

export const isSelected = (outpoint: string): boolean => {
	return selectedOutpoints.value.has(outpoint);
};

// --- ThemeToken Detection ---

export const isThemeToken = (ord: OrdUtxo): boolean => {
	const map = ord.origin?.data?.map;
	return map?.type === "theme" || map?.app === "ThemeToken";
};
