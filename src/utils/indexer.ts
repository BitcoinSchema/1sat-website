import { ORDINALS_V5_INDEXER_HOST } from "@/constants";

/**
 * Notify the v5 ordinals indexer about a successfully broadcast transaction.
 * Fire-and-forget - errors are logged but don't affect the caller.
 */
export const notifyIndexer = async (txid: string): Promise<void> => {
	try {
		const url = `${ORDINALS_V5_INDEXER_HOST}/submit/${txid}`;
		const res = await fetch(url, { method: "GET" });
		if (!res.ok) {
			console.warn(`Indexer notification failed: ${res.status} ${res.statusText}`);
		} else {
			console.log(`Indexer notified: ${txid}`);
		}
	} catch (err) {
		console.warn("Failed to notify indexer:", err);
	}
};

