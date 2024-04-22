"use client";

import MarketPage from "@/components/pages/market";
import { API_HOST, AssetType } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { useQuery } from "@tanstack/react-query";

const fetchArtifacts = async (term: string) => {
	const { promise } = http.customFetch<OrdUtxo[]>(`
    ${API_HOST}/api/market?sort=recent&dir=desc&limit=20&offset=0&text=${term}
  `);
	return await promise;
};

const Search = ({ params }: { params: { term: string } }) => {
	const { data: artifacts, isLoading } = useQuery({
		queryKey: ["artifacts", "search", params.term],
		queryFn: () => fetchArtifacts(params.term),
	});

	if (isLoading) {
		return <div className="mx-auto">Loading...</div>;
	}

	return (
		<MarketPage
			showTabs={false}
			title={params.term}
			imageListings={artifacts}
			selectedAssetType={AssetType.Ordinals}
		/>
	);
};

export default Search;
