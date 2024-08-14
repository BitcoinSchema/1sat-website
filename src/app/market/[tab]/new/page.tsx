import NewListingPage from "@/components/pages/market/new";
import type { AssetType } from "@/constants";
import { getCapitalizedAssetType } from "@/utils/assetType";

const Market = async ({ params }: { params: { tab: AssetType } }) => {
  return <NewListingPage type={params.tab} />;
};
export default Market;

export async function generateMetadata({
  params,
}: {
  params: { tab: AssetType };
}) {
  const assetType = getCapitalizedAssetType(params.tab);

  return {
    title: `Create New ${assetType} Listing - 1SatOrdinals`,
    description: `Create a new listing for ${assetType} on 1SatOrdinals.`,
    openGraph: {
      title: `Create New ${assetType} Listing - 1SatOrdinals`,
      description: `Create a new listing for ${assetType} on 1SatOrdinals.`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `Create New ${assetType} Listing - 1SatOrdinals`,
      description: `Create a new listing for ${assetType} on 1SatOrdinals.`,
    },
  };
}
