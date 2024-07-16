import MarketPage from "@/components/pages/market";
import { AssetType, SortBy } from "@/constants";

const Search = async ({ params, searchParams }: { params: { term: string }, searchParams: { 
  sort: SortBy, 
  dir: "asc" | "desc"
} }) => {
  // &q=${btoa(JSON.stringify({
  //   insc: {
  //     json: {
  //       p: "",
  //     },
  //   },
  // }))}

  // const { promise } = http.customFetch<OrdUtxo[]>(`
  //   ${API_HOST}/api/market?sort=recent&dir=desc&limit=20&offset=0&text=${params.term}
  // `);
  // const artifacts = await promise;

  return (
    <MarketPage
      showTabs={false}
      title={params.term}
      term={params.term}
      sort={searchParams.sort || SortBy.MostRecentSale}
      dir={searchParams.dir || "asc"}
      // imageListings={artifacts}
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
