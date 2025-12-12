import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import FlowGrid from "./flowgrid";

// Fetch minimal initial data for SSR
async function fetchInitialArtifacts(): Promise<OrdUtxo[]> {
	try {
		// Fetch just a small amount for initial render
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3000);

		const response = await fetch(
			`${API_HOST}/api/market?limit=20&offset=0&type=image`,
			{
				signal: controller.signal,
				next: { revalidate: 60 },
			},
		);

		clearTimeout(timeoutId);

		if (!response.ok) return [];
		const data = await response.json();
		return Array.isArray(data) ? data.slice(0, 20) : [];
	} catch (error) {
		console.error("Error fetching initial artifacts:", error);
		return [];
	}
}

const FlowLoader = async ({ artifact }: { artifact?: OrdUtxo }) => {
	// Fetch directly from external API during SSR
	const artifacts = await fetchInitialArtifacts();

	if (artifact && artifacts.length > 0) {
		// Remove duplicate if it exists in the fetched results
		const filtered = artifacts.filter((a) => a.txid !== artifact.txid);
		filtered.unshift(artifact);
		return (
			<FlowGrid
				initialArtifacts={filtered}
				className="rounded-lg shadow-2xl min-h-96 mx-auto px-4 max-w-full xl:max-w-[100rem]"
			/>
		);
	}

	return (
		<FlowGrid
			initialArtifacts={artifacts}
			className="rounded-lg shadow-2xl min-h-96 mx-auto px-4 max-w-[100rem]"
		/>
	);
};

export default FlowLoader;
