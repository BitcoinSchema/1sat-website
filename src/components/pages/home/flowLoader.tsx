import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import FlowGrid from "./flowgrid";

// Fetch initial data directly from external API during SSR
// This avoids the self-referential call to /api/feed
async function fetchInitialArtifacts(): Promise<OrdUtxo[]> {
  try {
    // Create an AbortController with 5 second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Fetch a reasonable amount of initial content
    const promises = [
      fetch(`${API_HOST}/api/market?limit=30&offset=0&type=image`, { 
        signal: controller.signal,
        next: { revalidate: 60 } // Cache for 1 minute
      }).then(res => res.ok ? res.json() : []).catch(() => []),
      
      fetch(`${API_HOST}/api/market?limit=10&offset=0&type=video`, { 
        signal: controller.signal,
        next: { revalidate: 60 }
      }).then(res => res.ok ? res.json() : []).catch(() => []),
    ];

    const results = await Promise.all(promises);
    clearTimeout(timeoutId);
    
    // Flatten and deduplicate
    const allItems = results.flat() as OrdUtxo[];
    const seen = new Set<string>();
    return allItems.filter(item => {
      const outpoint = item.outpoint || `${item.txid}_${item.vout}`;
      if (seen.has(outpoint)) return false;
      seen.add(outpoint);
      return true;
    }).slice(0, 60); // Return max 60 items
    
  } catch (error) {
    console.error('Error fetching initial artifacts:', error);
    // Return empty array - client will fetch via /api/feed
    return [];
  }
}

const FlowLoader = async ({ artifact }: { artifact?: OrdUtxo }) => {
  // Fetch directly from external API during SSR
  const artifacts = await fetchInitialArtifacts();

  if (artifact && artifacts.length > 0) {
    // Remove duplicate if it exists in the fetched results
    const filtered = artifacts.filter(a => a.txid !== artifact.txid);
    filtered.unshift(artifact);
    return (
      <FlowGrid
        initialArtifacts={filtered}
        className="rounded-lg shadow-2xl min-h-96 mx-auto px-4 max-w-[100rem] h-full"
      />
    );
  }

  return (
    <FlowGrid
      initialArtifacts={artifacts}
      className="rounded-lg shadow-2xl min-h-96 mx-auto px-4 max-w-[100rem] h-full"
    />
  );
};

export default FlowLoader;