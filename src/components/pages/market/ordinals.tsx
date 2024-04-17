'use client';

import { API_HOST, AssetType } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { useQuery } from "@tanstack/react-query";
import MarketPage from ".";

export function OrdinalsMarketPage() {
	// TODO: Featured ordinals

	const { data: imageListings } = useQuery({
		queryKey: ["market", "ordinals"],
		queryFn: async () => {
			const urlImages = `${API_HOST}/api/market?sort=recent&dir=desc&limit=20&offset=0&type=image/png`;
			const { promise } = http.customFetch<OrdUtxo[]>(urlImages);

			return promise;
		},
	});

	return (
		<MarketPage
			imageListings={imageListings}
			selectedAssetType={AssetType.Ordinals}
		/>
	);
}
