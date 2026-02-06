/** Simple in-memory sliding-window rate limiter for CWI auth endpoints. */

interface RateEntry {
	count: number;
	resetAt: number;
}

const store = new Map<string, RateEntry>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(now: number): void {
	if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
	lastCleanup = now;
	for (const [key, entry] of store) {
		if (entry.resetAt <= now) {
			store.delete(key);
		}
	}
}

/**
 * Check whether a request from `key` is within the rate limit.
 * Returns `true` if the request is allowed, `false` if it should be rejected.
 */
export function checkRateLimit(
	key: string,
	maxRequests: number,
	windowMs: number,
): boolean {
	const now = Date.now();
	cleanup(now);

	const entry = store.get(key);
	if (!entry || entry.resetAt <= now) {
		store.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}

	if (entry.count >= maxRequests) {
		return false;
	}

	entry.count++;
	return true;
}
