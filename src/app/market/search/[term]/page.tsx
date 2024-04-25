import MarketPage from "@/components/pages/market";
import { API_HOST, AssetType } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

const Search = async ({ params }: { params: { term: string } }) => {
	// &q=${btoa(JSON.stringify({
	//   insc: {
	//     json: {
	//       p: "",
	//     },
	//   },
	// }))}

	const { promise } = http.customFetch<OrdUtxo[]>(`
    ${API_HOST}/api/market?sort=recent&dir=desc&limit=20&offset=0&text=${params.term}
  `);
	const artifacts = await promise;

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

export async function generateMetadata({
	params,
}: {
	params: { term: string };
}) {
	const searchTerm = params.term;

	return {
		title: `Search Results for "${searchTerm}" - 1SatOrdinals`,
		description: `Explore listings for "${searchTerm}" on 1SatOrdinals.`,
		openGraph: {
			title: `Search Results for "${searchTerm}" - 1SatOrdinals`,
			description: `Explore listings for "${searchTerm}" on 1SatOrdinals.`,
			type: "website",
		},
		twitter: {
			card: "summary",
			title: `Search Results for "${searchTerm}" - 1SatOrdinals`,
			description: `Explore listings for "${searchTerm}" on 1SatOrdinals.`,
		},
	};
}
