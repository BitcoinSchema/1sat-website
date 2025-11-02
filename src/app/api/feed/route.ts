import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import { NextRequest, NextResponse } from "next/server";

// In-memory cache for the feed pool
// In production, this should use Redis or similar
let feedPool: OrdUtxo[] = [];
let lastRefreshTime = 0;
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const POOL_SIZE = 500; // Total items in pool

// Seeded shuffle for deterministic but random-looking results
function seededShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let currentIndex = arr.length;

  // Simple seeded random number generator
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(random() * currentIndex);
    currentIndex--;
    [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
  }

  return arr;
}

// Helper to get collection ID
function getCollectionId(item: OrdUtxo): string {
  // Try multiple collection identifiers for better grouping
  return item.origin?.data?.map?.subTypeData?.collectionName ||
         item.origin?.data?.map?.subTypeData?.collection ||
         item.data?.map?.collectionId ||
         item.origin?.data?.map?.tx_id ||
         item.origin?.data?.map?.app || // Group by app if no collection
         'uncategorized';
}

// Interleave items by collection for diversity
function interleaveByCollection(items: OrdUtxo[]): OrdUtxo[] {
  const byCollection = new Map<string, OrdUtxo[]>();
  const collectionCounts = new Map<string, number>();
  const maxPerCollection = 20; // Limit per collection in the pool

  items.forEach(item => {
    const collectionId = getCollectionId(item);
    const count = collectionCounts.get(collectionId) || 0;

    // Skip if we have too many from this collection
    if (count >= maxPerCollection) return;

    if (!byCollection.has(collectionId)) {
      byCollection.set(collectionId, []);
    }
    byCollection.get(collectionId)?.push(item);
    collectionCounts.set(collectionId, count + 1);
  });

  const interleaved: OrdUtxo[] = [];
  const collectionArrays = Array.from(byCollection.values());
  const maxLength = Math.max(...collectionArrays.map(arr => arr.length), 0);

  for (let i = 0; i < maxLength; i++) {
    for (const arr of collectionArrays) {
      if (i < arr.length) {
        interleaved.push(arr[i]);
      }
    }
  }

  return interleaved;
}

// Generate weighted random offset favoring recent items
function getWeightedOffset(): number {
  // Use exponential distribution to favor lower offsets (more recent items)
  // This gives us ~70% from first 200 items, ~20% from 200-500, ~10% from 500+
  const random = Math.random();

  if (random < 0.7) {
    // 70% chance: very recent (0-200)
    return Math.floor(Math.random() * 200);
  } else if (random < 0.9) {
    // 20% chance: recent (200-500)
    return 200 + Math.floor(Math.random() * 300);
  } else {
    // 10% chance: older (500-1000)
    return 500 + Math.floor(Math.random() * 500);
  }
}

// Refresh the feed pool from API
async function refreshFeedPool() {
  try {
    // Always include very recent items (0-100) and then weighted random offsets
    const offsets = [
      0,    // Always include the newest
      10,   // Very recent
      25,   // Very recent
      50,   // Recent
      ...Array.from({ length: 16 }, () => getWeightedOffset()) // 16 weighted random offsets
    ].sort((a, b) => a - b); // Sort to avoid duplicates efficiently

    // Fetch both images and videos for content variety
    const imagePromises = offsets.map(offset =>
      fetch(`${API_HOST}/api/market?limit=40&offset=${offset}&type=image`)
        .then(res => res.json())
        .catch(() => [])
    );

    // Generate weighted video offsets (always include recent videos)
    const videoOffsets = [0, 10, 25, getWeightedOffset(), getWeightedOffset()];
    const videoPromises = videoOffsets.map(offset =>
      fetch(`${API_HOST}/api/market?limit=10&offset=${offset}&type=video`)
        .then(res => res.json())
        .catch(() => [])
    );

    const fetchPromises = [...imagePromises, ...videoPromises];

    const results = await Promise.all(fetchPromises);
    const allItems = results.flat() as OrdUtxo[];

    // Deduplicate by outpoint only - no collection limiting for larger pool
    const seen = new Set<string>();

    const deduplicated = allItems.filter(item => {
      const outpoint = item.outpoint || `${item.txid}_${item.vout}`;
      if (seen.has(outpoint)) return false;
      seen.add(outpoint);
      return true;
    });

    // Interleave by collection for diversity
    const interleaved = interleaveByCollection(deduplicated);

    // Shuffle with true randomness on each refresh
    feedPool = seededShuffle(interleaved.slice(0, POOL_SIZE), Date.now());
    lastRefreshTime = Date.now();

    console.log(`Feed pool refreshed with ${feedPool.length} items from ${allItems.length} total`);
  } catch (error) {
    console.error('Error refreshing feed pool:', error);
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cursor = parseInt(searchParams.get('cursor') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '30', 10);

  // Refresh pool if needed
  const needsRefresh = feedPool.length === 0 ||
                      (Date.now() - lastRefreshTime > REFRESH_INTERVAL);

  if (needsRefresh) {
    await refreshFeedPool();
  }

  // Return paginated results
  const start = cursor;
  const end = Math.min(start + limit, feedPool.length);
  const items = feedPool.slice(start, end);
  const nextCursor = end < feedPool.length ? end : null;

  return NextResponse.json({
    items,
    nextCursor,
    total: feedPool.length,
  });
}

// Optionally allow manual refresh via POST
export async function POST() {
  await refreshFeedPool();
  return NextResponse.json({
    success: true,
    poolSize: feedPool.length
  });
}
