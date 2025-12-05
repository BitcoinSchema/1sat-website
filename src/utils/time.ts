// BSV blockchain started at block 0 on 2009-01-03
// Average block time is ~10 minutes
const GENESIS_TIMESTAMP = 1231006505000; // January 3, 2009 18:15:05 UTC
const AVERAGE_BLOCK_TIME_MS = 10 * 60 * 1000; // 10 minutes in milliseconds

/**
 * Estimate timestamp from block height
 * Note: This is an approximation as block times vary
 */
export function estimateTimestampFromHeight(height: number): number {
	return GENESIS_TIMESTAMP + height * AVERAGE_BLOCK_TIME_MS;
}

/**
 * Format a timestamp as "X time ago"
 */
export function timeAgo(timestamp: number): string {
	const now = Date.now();
	const diff = now - timestamp;

	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const months = Math.floor(days / 30);
	const years = Math.floor(days / 365);

	if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
	if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
	if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
	if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
	if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
	return "just now";
}

/**
 * Format block height as "X time ago"
 */
export function blockHeightToTimeAgo(height: number): string {
	const timestamp = estimateTimestampFromHeight(height);
	return timeAgo(timestamp);
}
