"use client";

export interface ReceiveAddressState {
	currentIndex: number;
	maxDerivedIndex: number;
	windowSize: number;
	lastRotationOutpoint?: string;
	updatedAt: number;
}

interface StorageScope {
	chain: "main" | "test";
	identityKey: string;
}

export const RECEIVE_STATE_KEY_PREFIX = "wallet_receive_state_v1";

export const DEFAULT_RECEIVE_WINDOW_SIZE = 5;

export function createDefaultReceiveAddressState(
	windowSize = DEFAULT_RECEIVE_WINDOW_SIZE,
): ReceiveAddressState {
	return {
		currentIndex: 0,
		maxDerivedIndex: Math.max(0, windowSize - 1),
		windowSize,
		updatedAt: Date.now(),
	};
}

function getStateKey(scope: StorageScope): string {
	return `${RECEIVE_STATE_KEY_PREFIX}:${scope.chain}:${scope.identityKey}`;
}

function hasWindowInvariants(state: ReceiveAddressState): boolean {
	if (!Number.isInteger(state.currentIndex) || state.currentIndex < 0) {
		return false;
	}
	if (!Number.isInteger(state.maxDerivedIndex) || state.maxDerivedIndex < 0) {
		return false;
	}
	if (!Number.isInteger(state.windowSize) || state.windowSize <= 0) {
		return false;
	}
	if (state.maxDerivedIndex < state.currentIndex) {
		return false;
	}
	return true;
}

export function loadReceiveAddressState(
	scope: StorageScope,
	windowSize = DEFAULT_RECEIVE_WINDOW_SIZE,
): ReceiveAddressState {
	if (typeof window === "undefined") {
		return createDefaultReceiveAddressState(windowSize);
	}

	try {
		const raw = window.localStorage.getItem(getStateKey(scope));
		if (!raw) {
			return createDefaultReceiveAddressState(windowSize);
		}
		const parsed = JSON.parse(raw) as Partial<ReceiveAddressState>;
		const state: ReceiveAddressState = {
			currentIndex: parsed.currentIndex ?? 0,
			maxDerivedIndex:
				parsed.maxDerivedIndex ??
				Math.max(0, (parsed.windowSize ?? windowSize) - 1),
			windowSize: parsed.windowSize ?? windowSize,
			lastRotationOutpoint: parsed.lastRotationOutpoint,
			updatedAt: parsed.updatedAt ?? Date.now(),
		};
		if (!hasWindowInvariants(state)) {
			return createDefaultReceiveAddressState(windowSize);
		}
		return {
			...state,
			windowSize,
			maxDerivedIndex: Math.max(
				state.maxDerivedIndex,
				state.currentIndex + windowSize - 1,
			),
		};
	} catch {
		return createDefaultReceiveAddressState(windowSize);
	}
}

export function saveReceiveAddressState(
	scope: StorageScope,
	state: ReceiveAddressState,
): void {
	if (typeof window === "undefined") {
		return;
	}
	if (!hasWindowInvariants(state)) {
		return;
	}
	const normalized: ReceiveAddressState = {
		...state,
		updatedAt: Date.now(),
	};
	window.localStorage.setItem(getStateKey(scope), JSON.stringify(normalized));
}

export function clearReceiveAddressState(scope: StorageScope): void {
	if (typeof window === "undefined") {
		return;
	}
	window.localStorage.removeItem(getStateKey(scope));
}
