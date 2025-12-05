import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import { NextRequest, NextResponse } from "next/server";

// Cached item with expiration
type CachedItem = OrdUtxo & { _cachedAt: number };

// In-memory cache for the feed pool
// In production, this should use Redis or similar
let feedPool: CachedItem[] = [];
let isRefilling = false;
let poolInitialized = false;
const ITEM_TTL = 60 * 60 * 1000; // 1 hour per item (increased from 30 min)
const MIN_POOL_SIZE = 300; // Trigger refill below this (reduced from 800)
const POOL_SIZE = 1000; // Max items in pool (reduced from 2000)
const API_TIMEOUT = 5000; // 5 second timeout for API calls

// Helper to fetch with timeout
async function fetchWithTimeout(url: string, timeout: number = API_TIMEOUT): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    return [];
  }
}

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
  return item.origin?.data?.map?.subTypeData?.collectionName ||
         item.origin?.data?.map?.subTypeData?.collection ||
         item.data?.map?.collectionId ||
         item.origin?.data?.map?.tx_id ||
         item.origin?.data?.map?.app ||
         'uncategorized';
}

// Interleave items by collection for diversity
function interleaveByCollection(items: OrdUtxo[]): OrdUtxo[] {
  const byCollection = new Map<string, OrdUtxo[]>();
  const collectionCounts = new Map<string, number>();
  const maxPerCollection = 30; // Reduced from 50

  items.forEach(item => {
    const collectionId = getCollectionId(item);
    const count = collectionCounts.get(collectionId) || 0;

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

// Lightweight pool refresh - non-blocking
async function refreshFeedPool() {
  // Don't block - return immediately and fill in background
  if (isRefilling) return;
  
  isRefilling = true;
  
  // Fill pool in background
  (async () => {
    try {
      const now = Date.now();
      
      // Fetch just a few pages to start quickly
      const promises = [
        fetchWithTimeout(`${API_HOST}/api/market?limit=40&offset=0&type=image`, 3000),
        fetchWithTimeout(`${API_HOST}/api/market?limit=40&offset=40&type=image`, 3000),
        fetchWithTimeout(`${API_HOST}/api/market?limit=10&offset=0&type=video`, 3000),
      ];

      const results = await Promise.allSettled(promises);
      const allItems = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<any>).value)
        .flat() as OrdUtxo[];

      // Deduplicate
      const seen = new Set<string>();
      const deduplicated = allItems.filter(item => {
        const outpoint = item.outpoint || `${item.txid}_${item.vout}`;
        if (seen.has(outpoint)) return false;
        seen.add(outpoint);
        return true;
      });

      // Interleave by collection for diversity
      const interleaved = interleaveByCollection(deduplicated);

      // Add timestamps
      const withTimestamps: CachedItem[] = interleaved.map(item => ({
        ...item,
        _cachedAt: now
      }));

      feedPool = seededShuffle(withTimestamps.slice(0, POOL_SIZE), Date.now());
      poolInitialized = true;
      
      console.log(`Feed pool initialized with ${feedPool.length} items`);
      
      // Continue filling in background if needed
      if (feedPool.length < MIN_POOL_SIZE) {
        backgroundExpand();
      }
    } catch (error) {
      console.error('Error refreshing feed pool:', error);
      poolInitialized = true; // Mark as initialized even on error
    } finally {
      isRefilling = false;
    }
  })();
}

// Expand pool with more content
async function backgroundExpand() {
  try {
    const now = Date.now();
    const existingOutpoints = new Set(feedPool.map(item => item.outpoint));
    
    // Fetch more content with varied offsets
    const offsets = [100, 200, 300, 500, 750, 1000];
    const promises = offsets.map(offset =>
      fetchWithTimeout(`${API_HOST}/api/market?limit=20&offset=${offset}&type=image`, 3000)
    );
    
    const results = await Promise.allSettled(promises);
    const allItems = results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<any>).value)
      .flat() as OrdUtxo[];
    
    // Filter new items only
    const newItems = allItems.filter(item => {
      const outpoint = item.outpoint || `${item.txid}_${item.vout}`;
      return !existingOutpoints.has(outpoint);
    });
    
    // Add to pool
    const withTimestamps: CachedItem[] = newItems.map(item => ({
      ...item,
      _cachedAt: now
    }));
    
    feedPool.push(...withTimestamps);
    
    // Limit pool size
    if (feedPool.length > POOL_SIZE) {
      feedPool = feedPool.slice(0, POOL_SIZE);
    }
    
    console.log(`Expanded pool by ${withTimestamps.length} items. Total: ${feedPool.length}`);
  } catch (error) {
    console.error('Error expanding pool:', error);
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cursor = parseInt(searchParams.get('cursor') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '30', 10);
  const now = Date.now();

  // Initialize pool if needed (non-blocking)
  if (!poolInitialized && feedPool.length === 0) {
    refreshFeedPool(); // This returns immediately
    
    // Return empty for first request while pool initializes
    // Client will retry
    return NextResponse.json({
      items: [],
      nextCursor: null,
      total: 0,
      poolInitializing: true
    });
  }

  // Filter expired items
  const validItems = feedPool.filter(item => now - item._cachedAt < ITEM_TTL);
  
  // Update pool if many items expired
  if (validItems.length < feedPool.length * 0.5) {
    feedPool = validItems;
    if (!isRefilling) {
      backgroundExpand(); // Non-blocking expansion
    }
  }

  // Trigger background refill if pool is low
  if (feedPool.length < MIN_POOL_SIZE && !isRefilling) {
    backgroundExpand();
  }

  // Return paginated results
  const start = cursor;
  const end = Math.min(start + limit, feedPool.length);
  const items = feedPool.slice(start, end).map(({ _cachedAt, ...item }) => item);
  const nextCursor = end < feedPool.length ? end : null;

  return NextResponse.json({
    items,
    nextCursor,
    total: feedPool.length,
  });
}

// Manual refresh endpoint
export async function POST() {
  poolInitialized = false;
  feedPool = [];
  await refreshFeedPool();
  
  // Wait a bit for initial pool to fill
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return NextResponse.json({
    success: true,
    poolSize: feedPool.length
  });
}