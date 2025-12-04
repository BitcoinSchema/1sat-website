import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import FlowGrid from "./flowgrid";

// Fetch minimal initial data for SSR to avoid blocking
// The client will fetch the rest via infinite scroll
async function fetchInitialArtifacts(): Promise<OrdUtxo[]> {
  // Skip SSR fetching, let client handle everything
  // This prevents blocking and makes the page load faster
  return [];
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