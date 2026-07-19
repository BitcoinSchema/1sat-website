import MarketPage from "@/components/pages/market";
import { API_HOST, AssetType } from "@/constants";
import type { BSV20 } from "@/types/bsv20";
import { getCapitalizedAssetType } from "@/utils/assetType";
import { isValidOutpoint } from "@/utils/validation";
import { notFound, redirect } from "next/navigation";

// Cache rendered pages at the CDN and revalidate in the background.
// The empty generateStaticParams opts the route into ISR.
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

const Market = async ({
  params,
}: {
  params: { tab: AssetType; id: string };
}) => {
  // hit the details request

  // BSV21 ids (and ordinals listings) are outpoints — reject junk early
  if (
    (params.tab === AssetType.BSV21 || params.tab === AssetType.Ordinals) &&
    !isValidOutpoint(params.id)
  ) {
    notFound();
  }

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
      notFound();
  }
};
export default Market;

export async function generateMetadata({
  params,
}: {
  params: { tab: AssetType; id: string };
}) {
  let ticker: string | undefined;
  const assetType = getCapitalizedAssetType(params.tab);
  if (params.tab === AssetType.BSV20) {
    ticker = params.id;
  } else if (params.tab === AssetType.BSV21 && isValidOutpoint(params.id)) {
    try {
      const detailsUrl = `${API_HOST}/api/bsv20/id/${params.id}`;
      const res = await fetch(detailsUrl, { next: { revalidate: 300 } });
      if (res.ok) {
        const details = (await res.json()) as BSV20;
        ticker = details.sym;
      }
    } catch (e) {
      // fall through to generic metadata
    }
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
