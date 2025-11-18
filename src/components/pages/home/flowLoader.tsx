import type { OrdUtxo } from "@/types/ordinals";
import FlowGrid from "./flowgrid";

const FlowLoader = async ({ artifact }: { artifact?: OrdUtxo }) => {
  let artifacts: OrdUtxo[] = [];

  try {
    // Fetch from the feed API which handles pooling and deduplication
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/feed?cursor=0&limit=60`, {
      cache: 'no-store' // Always get fresh data on server
    });

    if (!response.ok) {
      throw new Error(`Feed API returned ${response.status}`);
    }

    const result = await response.json() as { items: OrdUtxo[], nextCursor: number | null, total: number };
    artifacts = result.items || [];
  } catch (error) {
    console.error('Error fetching initial artifacts:', error);
    // Return empty array instead of null to prevent hydration issues
    artifacts = [];
  }

  if (artifact && artifacts.length > 0) {
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
