import SearchPage from "@/components/pages/search";
import { API_HOST, AssetType } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

const Search = async ({
  params,
}: {
  params: { term: string; bsv20Matches?: string };
}) => {
  // &q=${btoa(JSON.stringify({
  //   insc: {
  //     json: {
  //       p: "",
  //     },
  //   },
  // }))}

  console.log("term", params.term);
  // &bsv20Matches=${params.bsv20Matches}
  const { promise } = http.customFetch<OrdUtxo[]>(`
    ${API_HOST}/api/market?dir=desc&limit=20&offset=0&text=${decodeURIComponent(params.term)}
  `, {
    method: "POST"
  });
  const artifacts = await promise;

  const matches = params.bsv20Matches ? params.bsv20Matches.split(",") : [];

  return (
    <SearchPage
      title={decodeURIComponent(params.term)}
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
