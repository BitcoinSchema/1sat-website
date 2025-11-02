import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { getRandomInt } from "@/utils/number";
import SlideShow from "./slideshow";
import FlowGrid from "./flowgrid";

// Generate weighted random offset favoring recent items
function getWeightedOffset(): number {
  const random = Math.random();

  if (random < 0.7) {
    // 70% chance: very recent (0-200)
    return getRandomInt(0, 200);
  } else if (random < 0.9) {
    // 20% chance: recent (200-500)
    return getRandomInt(200, 500);
  } else {
    // 10% chance: older (500-1000)
    return getRandomInt(500, 1000);
  }
}

const FlowLoader = async ({ artifact }: { artifact?: OrdUtxo }) => {
  // Always include very recent items, then weighted random offsets
  const offsets = [
    0,   // Always newest
    25,  // Very recent
    getWeightedOffset()  // Weighted random
  ];

  // Fetch both images and videos for content variety
  const imagePromises = offsets.map(offset =>
    http.customFetch<OrdUtxo[]>(
      `${API_HOST}/api/market?limit=40&offset=${offset}&type=image`
    ).promise
  );

  // Always fetch recent videos
  const videoPromise = http.customFetch<OrdUtxo[]>(
    `${API_HOST}/api/market?limit=20&offset=${getWeightedOffset()}&type=video`
  ).promise;

  const fetchPromises = [...imagePromises, videoPromise];

  let allArtifacts: OrdUtxo[] = [];

  try {
    const results = await Promise.all(fetchPromises);
    // Flatten all results
    allArtifacts = results.flat();
  } catch (error) {
    console.error('Error fetching artifacts:', error);
  }

  if (!allArtifacts || allArtifacts.length === 0) {
    return null;
  }

  // Deduplicate by outpoint
  const seen = new Set<string>();
  const collectionCounts = new Map<string, number>();
  const maxPerCollection = 15; // Limit items per collection for more diversity

  // Helper to get collection ID
  const getCollectionId = (a: OrdUtxo): string => {
    // Try multiple collection identifiers for better grouping
    return a.origin?.data?.map?.subTypeData?.collectionName ||
           a.origin?.data?.map?.subTypeData?.collection ||
           a.data?.map?.collectionId ||
           a.origin?.data?.map?.tx_id ||
           a.origin?.data?.map?.app || // Group by app if no collection
           'uncategorized';
  };

  // Filter and limit per collection
  let artifacts = allArtifacts.filter(a => {
    const outpoint = a.outpoint || `${a.txid}_${a.vout}`;
    if (seen.has(outpoint)) return false;

    const collectionId = getCollectionId(a);
    const collectionCount = collectionCounts.get(collectionId) || 0;

    // Skip if we already have too many from this collection
    if (collectionCount >= maxPerCollection) return false;

    seen.add(outpoint);
    collectionCounts.set(collectionId, collectionCount + 1);
    return true;
  });

  // Interleave results from different collections for better mixing
  const byCollection = new Map<string, OrdUtxo[]>();
  artifacts.forEach(a => {
    const collectionId = getCollectionId(a);
    if (!byCollection.has(collectionId)) {
      byCollection.set(collectionId, []);
    }
    byCollection.get(collectionId)?.push(a);
  });

  // Interleave: take one from each collection in round-robin fashion
  const interleaved: OrdUtxo[] = [];
  const collectionArrays = Array.from(byCollection.values());
  let maxLength = Math.max(...collectionArrays.map(arr => arr.length));

  for (let i = 0; i < maxLength; i++) {
    for (const arr of collectionArrays) {
      if (i < arr.length) {
        interleaved.push(arr[i]);
      }
    }
  }

  artifacts = interleaved;

  if (artifact) {
    // Remove duplicate if it exists in the fetched results
    artifacts = artifacts.filter(a => a.txid !== artifact.txid);
    artifacts.unshift(artifact);
  }

  return (
    <FlowGrid
      initialArtifacts={artifacts}
      className="rounded-lg shadow-2xl min-h-96 mx-auto px-4 max-w-[100rem] h-full"
    />
  );
};

export default FlowLoader;
