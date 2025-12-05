import { ORDINALS_V5_INDEXER_HOST } from "@/constants";

/**
 * Notify the v5 ordinals indexer to ingest a successfully broadcast transaction.
 * Fire-and-forget - errors are logged but don't affect the caller.
 */
export const notifyIndexer = async (txid: string): Promise<void> => {
	try {
		const url = `${ORDINALS_V5_INDEXER_HOST}/v5/tx/${txid}/ingest`;
		const res = await fetch(url, { method: "POST" });
		if (!res.ok) {
			console.warn(`V5 indexer ingest failed: ${res.status} ${res.statusText}`);
		} else {
			console.log(`V5 indexer ingesting: ${txid}`);
		}
	} catch (err) {
		console.warn("Failed to notify v5 indexer:", err);
	}
};

