import MarketPage from "@/components/pages/market";
import { AssetType } from "@/constants";
import { getCapitalizedAssetType } from "@/utils/assetType";

const Market = async ({ params }: { params: { tab: AssetType } }) => {
  switch (params.tab) {
    case AssetType.Ordinals:
      // TODO: Featured ordinals
      // const urlImages = `${API_HOST}/api/market?sort=recent&dir=desc&limit=20&offset=0&type=image/png`;
      // const { promise } = http.customFetch<OrdUtxo[]>(urlImages);
      // const imageListings = await promise;
      return (
        <MarketPage
          // imageListings={imageListings}
          selectedAssetType={AssetType.Ordinals}
        />
      );
    case AssetType.BSV20:
      return <MarketPage selectedAssetType={AssetType.BSV20} />;
    case AssetType.BSV21:
      return <MarketPage selectedAssetType={AssetType.BSV21} />;
    default:
      return null;
  }
};
export default Market;

export async function generateMetadata({
  params,
}: {
  params: { tab: AssetType };
}) {
  const assetType = getCapitalizedAssetType(params.tab);

  return {
    title: `${assetType} Market Listings - 1SatOrdinals`,
    description: `Explore market listings for ${assetType} on 1SatOrdinals.`,
    openGraph: {
      title: `${assetType} Market Listings - 1SatOrdinals`,
      description: `Explore market listings for ${assetType} on 1SatOrdinals.`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${assetType} Market Listings - 1SatOrdinals`,
      description: `Explore market listings for ${assetType} on 1SatOrdinals.`,
    },
  };
}
