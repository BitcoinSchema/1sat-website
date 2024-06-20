import ListingsPage from "@/components/pages/listings";
import { API_HOST, AssetType } from "@/constants";
import type { BSV20TXO, OrdUtxo } from "@/types/ordinals";
import { getCapitalizedAssetType } from "@/utils/assetType";
import * as http from "@/utils/httpClient";

const Listings = async ({ params }: { params: { tab: AssetType } }) => {
  switch (params.tab) {
    case AssetType.Ordinals:
      // const urlImages = `${API_HOST}/api/market?sort=recent&dir=desc&limit=20&offset=0&type=image/png`;
      // const { promise } = http.customFetch<OrdUtxo[]>(urlImages);
      // const imageListings = await promise;
      return (
        <ListingsPage
          // imageListings={imageListings}
          selectedAssetType={AssetType.Ordinals}
        />
      );
    case AssetType.BSV20:
      return <ListingsPage selectedAssetType={AssetType.BSV20} />;
    case AssetType.BSV21:
      const urlV2Tokens = `${API_HOST}/api/bsv20/market?sort=price_per_token&dir=asc&limit=20&offset=0&type=v2`;
      const { promise: promiseBsv21 } =
        http.customFetch<BSV20TXO[]>(urlV2Tokens);
      const tokenListingsv2 = await promiseBsv21;
      return (
        <ListingsPage
          tokenListingsv2={tokenListingsv2}
          selectedAssetType={AssetType.BSV21}
        />
      );
    default:
      return null;
  }
};
export default Listings;

export async function generateMetadata({
  params,
}: {
  params: { tab: AssetType };
}) {
  const { tab } = params;
  const assetType = getCapitalizedAssetType(tab);

  return {
    title: `${assetType} Listings - 1SatOrdinals`,
    description: `Explore ${assetType} listings on 1SatOrdinals.`,
    openGraph: {
      title: `${assetType} Listings - 1SatOrdinals`,
      description: `Explore ${assetType} listings on 1SatOrdinals.`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${assetType} Listings - 1SatOrdinals`,
      description: `Explore ${assetType} listings on 1SatOrdinals.`,
    },
  };
}
