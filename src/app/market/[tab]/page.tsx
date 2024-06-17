import MarketPage from "@/components/pages/market";
import { AssetType, type SortBy } from "@/constants";
import { getCapitalizedAssetType } from "@/utils/assetType";

const Market = async ({ params, searchParams }: { params: { tab: AssetType,  }, searchParams: { sort: SortBy, dir: "asc" | "desc" } }) => {
  console.log("APP/MARKET/[TAB]/page", { params, searchParams });
  switch (params.tab) {
    case AssetType.Ordinals:
      return (
        <MarketPage
          selectedAssetType={AssetType.Ordinals}
          sort={searchParams.sort}
          dir={searchParams.dir}
        />
      );
    case AssetType.BSV20:
      return <MarketPage selectedAssetType={AssetType.BSV20} sort={searchParams.sort} dir={searchParams.dir} />;
    case AssetType.BSV21:
      return <MarketPage selectedAssetType={AssetType.BSV21} sort={searchParams.sort} dir={searchParams.dir} />;
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
