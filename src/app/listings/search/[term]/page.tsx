import SearchPage from "@/components/pages/search";
import { API_HOST, AssetType } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

const Search = async ({
  params,
}: {
  params: Promise<{ term: string; bsv20Matches?: string }>;
}) => {
  const { term, bsv20Matches } = await params;
  // &q=${btoa(JSON.stringify({
  //   insc: {
  //     json: {
  //       p: "",
  //     },
  //   },
  // }))}

  console.log("term", term);
  // &bsv20Matches=${bsv20Matches}
  const { promise } = http.customFetch<OrdUtxo[]>(`
    ${API_HOST}/api/market?dir=desc&limit=20&offset=0&text=${decodeURIComponent(term)}
  `, {
    method: "POST"
  });
  const artifacts = await promise;

  const matches = bsv20Matches ? bsv20Matches.split(",") : [];

  return (
    <SearchPage
      title={decodeURIComponent(term)}
      imageListings={artifacts}
      selectedAssetType={AssetType.Ordinals}
      bsv20Matches={matches}
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
