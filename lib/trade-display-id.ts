const STORAGE_KEY = "trade_display_ids";

const inMemoryMap = new Map<string, string>();

function loadFromStorage() {
	if (typeof window === "undefined") {
		return;
	}

	const raw = sessionStorage.getItem(STORAGE_KEY);
	if (!raw) {
		return;
	}

	try {
		const parsed = JSON.parse(raw) as Record<string, string>;
		for (const [userId, displayId] of Object.entries(parsed)) {
			if (typeof displayId === "string" && displayId.trim()) {
				inMemoryMap.set(userId, displayId.trim());
			}
		}
	} catch {
		// Ignore malformed stored data.
	}
}

function persistToStorage() {
	if (typeof window === "undefined") {
		return;
	}

	const entries = Object.fromEntries(inMemoryMap.entries());
	sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function registerTradeDisplayId(userId: string, displayId: string) {
	const normalizedUserId = userId.trim();
	const normalizedDisplayId = displayId.trim();
	if (!normalizedUserId || !normalizedDisplayId) {
		return;
	}

	if (inMemoryMap.size === 0) {
		loadFromStorage();
	}

	if (inMemoryMap.get(normalizedUserId) === normalizedDisplayId) {
		return;
	}

	inMemoryMap.set(normalizedUserId, normalizedDisplayId);
	persistToStorage();
}

export function resolveTradeDisplayId(userId: string): string | null {
	const normalizedUserId = userId.trim();
	if (!normalizedUserId) {
		return null;
	}

	if (inMemoryMap.size === 0) {
		loadFromStorage();
	}

	return inMemoryMap.get(normalizedUserId) ?? null;
}
