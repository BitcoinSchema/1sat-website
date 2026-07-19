import { notFound, redirect } from "next/navigation";
import MarketPage from "@/components/pages/market";
import { API_HOST, AssetType } from "@/constants";
import type { BSV20 } from "@/types/bsv20";
import { getCapitalizedAssetType } from "@/utils/assetType";
import { isValidOutpoint } from "@/utils/validation";

// Cache rendered pages at the CDN and revalidate in the background.
// The empty generateStaticParams opts the route into ISR.
export const revalidate = 60;

export async function generateStaticParams() {
	return [];
}

const Market = async ({
	params,
}: {
	params: Promise<{ tab: AssetType; id: string }>;
}) => {
	const { tab, id } = await params;
	// hit the details request

	// BSV21 ids (and ordinals listings) are outpoints — reject junk early
	if (
		(tab === AssetType.BSV21 || tab === AssetType.Ordinals) &&
		!isValidOutpoint(id)
	) {
		notFound();
	}

	const tickOrId = decodeURIComponent(id);
	switch (tab) {
		case AssetType.Ordinals:
			//       const urlImages = `${MARKET_API_HOST}/market/${tab}/${id}`;
			// const { promise } = http.customFetch(urlImages);
			// const marketData = await promise;
			// console.log(marketData);
			// TODO: redirect to outpoint page
			return redirect(`/outpoint/${id}`);
		case AssetType.BSV20:
			return <MarketPage selectedAssetType={AssetType.BSV20} id={tickOrId} />;
		case AssetType.BSV21:
			return <MarketPage selectedAssetType={AssetType.BSV21} id={tickOrId} />;
		default:
			notFound();
	}
};
export default Market;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ tab: AssetType; id: string }>;
}) {
	const { tab, id } = await params;
	let ticker: string | undefined;
	const assetType = getCapitalizedAssetType(tab);
	if (tab === AssetType.BSV20) {
		ticker = id;
	} else if (tab === AssetType.BSV21 && isValidOutpoint(id)) {
		try {
			const detailsUrl = `${API_HOST}/api/bsv20/id/${id}`;
			const res = await fetch(detailsUrl, { next: { revalidate: 300 } });
			if (res.ok) {
				const details = (await res.json()) as BSV20;
				ticker = details.sym;
			}
		} catch (_e) {
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
