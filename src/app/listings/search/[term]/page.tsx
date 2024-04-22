"use client";

import ListingsPage from "@/components/pages/listings";
import { API_HOST, AssetType } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { useQuery } from "@tanstack/react-query";

const Search = ({ params }: { params: { term: string } }) => {
	// &q=${btoa(JSON.stringify({
	//   insc: {
	//     json: {
	//       p: "",
	//     },
	//   },
	// }))}

	const { data: artifacts } = useQuery({
		queryKey: ["search", params.term],
		queryFn: async () => {
			const { promise } = http.customFetch<OrdUtxo[]>(
				`${API_HOST}/api/market?sort=recent&dir=desc&limit=20&offset=0&text=${params.term}`
			);
			return promise;
		},
	});

	return (
		<ListingsPage
			showTabs={false}
			title={params.term}
			imageListings={artifacts}
			selectedAssetType={AssetType.Ordinals}
		/>
	);
};

export default Search;
