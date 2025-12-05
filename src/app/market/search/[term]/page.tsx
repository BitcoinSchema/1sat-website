import MarketPage from "@/components/pages/market";
import { AssetType, SortBy } from "@/constants";

const Search = async ({
	params,
	searchParams,
}: {
	params: Promise<{ term: string }>;
	searchParams: Promise<{
		sort: SortBy;
		dir: "asc" | "desc";
	}>;
}) => {
	const { term } = await params;
	const { sort, dir } = await searchParams;
	// &q=${btoa(JSON.stringify({
	//   insc: {
	//     json: {
	//       p: "",
	//     },
	//   },
	// }))}

	// const { promise } = http.customFetch<OrdUtxo[]>(`
	//   ${API_HOST}/api/market?sort=recent&dir=desc&limit=20&offset=0&text=${term}
	// `);
	// const artifacts = await promise;

	return (
		<MarketPage
			showTabs={false}
			title={term}
			term={term}
			sort={sort || SortBy.MostRecentSale}
			dir={dir || "asc"}
			// imageListings={artifacts}
			selectedAssetType={AssetType.Ordinals}
		/>
	);
};

export default Search;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ term: string }>;
}) {
	const { term } = await params;
	const searchTerm = term;

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
