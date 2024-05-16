import MarketPage from "@/components/pages/market";
import { API_HOST, AssetType } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
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
      redirect(`/outpoint/${params.id}`);
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
  const detailsUrl = `${API_HOST}/api/bsv20/${params.tab === AssetType.BSV20 ? "tick" : "id"
    }/${params.id}`;

  const details = await fetch(detailsUrl).then(
    (res) => res.json() as Promise<OrdUtxo>
  );

  const assetType = getCapitalizedAssetType(params.tab);

  const name =
    details.origin?.data?.map?.name ||
    details.origin?.data?.bsv20?.tick ||
    details.origin?.data?.bsv20?.sym ||
    details.origin?.data?.insc?.json?.tick ||
    details.origin?.data?.insc?.json?.p ||
    details.origin?.data?.insc?.file.type ||
    "Mystery Outpoint";

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
