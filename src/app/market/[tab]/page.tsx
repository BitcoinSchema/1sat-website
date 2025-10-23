import MarketPage from "@/components/pages/market";
import { AssetType, type SortBy } from "@/constants";
import { getCapitalizedAssetType } from "@/utils/assetType";

const Market = async ({ params, searchParams }: { params: Promise<{ tab: AssetType }>, searchParams: Promise<{ sort: SortBy, dir: "asc" | "desc" }> }) => {
  const { tab } = await params;
  const { sort, dir } = await searchParams;
  console.log("APP/MARKET/[TAB]/page", { tab, sort, dir });
  switch (tab) {
    case AssetType.Ordinals:
      return (
        <MarketPage
          selectedAssetType={AssetType.Ordinals}
          sort={sort}
          dir={dir}
        />
      );
    case AssetType.BSV20:
      return <MarketPage selectedAssetType={AssetType.BSV20} sort={sort} dir={dir} />;
    case AssetType.BSV21:
      return <MarketPage selectedAssetType={AssetType.BSV21} sort={sort} dir={dir} />;
    default:
      return null;
  }
};
export default Market;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tab: AssetType }>;
}) {
  const { tab } = await params;
  const assetType = getCapitalizedAssetType(tab);

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
