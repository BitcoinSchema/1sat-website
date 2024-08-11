import MarketPage from "@/components/pages/market";
import { API_HOST, AssetType } from "@/constants";
import type { BSV20 } from "@/types/bsv20";
import { getCapitalizedAssetType } from "@/utils/assetType";
import { redirect } from "next/navigation";

const Market = async ({
  params,
}: {
  params: { tab: AssetType; id: string };
}) => {
  // hit the details request

  const tickOrId = decodeURIComponent(params.id);
  switch (params.tab) {
    case AssetType.Ordinals:
      //       const urlImages = `${MARKET_API_HOST}/market/${params.tab}/${params.id}`;
      // const { promise } = http.customFetch(urlImages);
      // const marketData = await promise;
      // console.log(marketData);
      // TODO: redirect to outpoint page
  return redirect(`/outpoint/${params.id}`);
    case AssetType.BSV20:
      return (
        <MarketPage selectedAssetType={AssetType.BSV20} id={tickOrId} />
      );
    case AssetType.BSV21:
      return (
        <MarketPage selectedAssetType={AssetType.BSV21} id={tickOrId} />
      );
    default:
      return null;
  }
};
export default Market;

export async function generateMetadata({
  params,
}: {
  params: { tab: AssetType; id: string };
}) {
  let ticker: string | undefined;
  let icon: string | undefined;
  const assetType = getCapitalizedAssetType(params.tab);
  if (params.tab === AssetType.BSV20) {
    ticker = params.id;
  } else if (params.tab === AssetType.BSV21) {
    const detailsUrl = `${API_HOST}/api/bsv20/id/${params.id}`;
    const details = await fetch(detailsUrl).then(
      (res) => res.json() as Promise<BSV20>
    );
    ticker = details.sym;
    icon = details.icon || "b974de563db7ca7a42f421bb8a55c61680417404c661deb7a052773eb24344e3_0";
  }

  const name = ticker || "Mystery Outpoint";

  return {
    title: `${assetType} Market Listings for ${name} - 1SatOrdinals`,
    description: `Explore market listings for ${name} (${assetType}) on 1SatOrdinals.`,
    openGraph: {
      title: `${assetType} Market Listings for ${name} - 1SatOrdinals`,
      description: `Explore market listings for ${name} (${assetType}) on 1SatOrdinals.`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${assetType} Market Listings for ${name} - 1SatOrdinals`,
      description: `Explore market listings for ${name} (${assetType}) on 1SatOrdinals.`,
    },
  };
}
