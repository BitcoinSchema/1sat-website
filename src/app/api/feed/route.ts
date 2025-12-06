import { type NextRequest, NextResponse } from "next/server";
import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";

const API_TIMEOUT = 5000;

// Helper to fetch with timeout
async function fetchWithTimeout(
  url: string,
  timeout: number = API_TIMEOUT,
): Promise<OrdUtxo[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!response.ok) return [];
    return await response.json();
  } catch (_error) {
    clearTimeout(timeoutId);
    return [];
  }
}

// Stateless feed API - no caching, passes through to external API
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cursor = parseInt(searchParams.get("cursor") || "0", 10);
  const limit = parseInt(searchParams.get("limit") || "30", 10);

  try {
    // Fetch images and videos with the cursor as offset
    const [images, videos] = await Promise.all([
      fetchWithTimeout(
        `${API_HOST}/api/market?limit=${limit}&offset=${cursor}&type=image`,
      ),
      fetchWithTimeout(
        `${API_HOST}/api/market?limit=${Math.ceil(limit / 3)}&offset=${Math.floor(cursor / 3)}&type=video`,
      ),
    ]);

    // Interleave: mostly images with some videos mixed in
    const items: OrdUtxo[] = [];
    const seen = new Set<string>();

    let imgIdx = 0;
    let vidIdx = 0;

    while (items.length < limit && (imgIdx < images.length || vidIdx < videos.length)) {
      // Add 3 images, then 1 video
      for (let i = 0; i < 3 && imgIdx < images.length && items.length < limit; i++) {
        const item = images[imgIdx++];
        const outpoint = item.outpoint || `${item.txid}_${item.vout}`;
        if (!seen.has(outpoint)) {
          seen.add(outpoint);
          items.push(item);
        }
      }

      if (vidIdx < videos.length && items.length < limit) {
        const item = videos[vidIdx++];
        const outpoint = item.outpoint || `${item.txid}_${item.vout}`;
        if (!seen.has(outpoint)) {
          seen.add(outpoint);
          items.push(item);
        }
      }
    }

    // Calculate next cursor based on what we got
    const nextCursor = items.length >= limit ? cursor + limit : null;

    return NextResponse.json({
      items,
      nextCursor,
      total: items.length,
    });
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json({
      items: [],
      nextCursor: null,
      total: 0,
      error: "Failed to fetch feed",
    });
  }
}

// Refresh endpoint - now just returns success since there's no cache
export async function POST() {
  return NextResponse.json({
    success: true,
    message: "Feed is now stateless, no cache to refresh",
  });
}
