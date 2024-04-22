'use client';

import MarketPage from "@/components/pages/market";
import { Lrc20MarketPage } from "@/components/pages/market/lrc20";
import { AssetType } from "@/constants";
import { useRouter } from "next/navigation";

const Market =  ({
	params,
}: {
	params: { tab: AssetType; id: string };
}) => {
	// hit the details request
	const {push} = useRouter()

	const tickOrId = decodeURIComponent(params.id);
	switch (params.tab) {
		case AssetType.Ordinals:
			//       const urlImages = `https://1sat-api-production.up.railway.app/market/${params.tab}/${params.id}`;
			// const { promise } = http.customFetch(urlImages);
			// const marketData = await promise;
			// console.log(marketData);
			// TODO: redirect to outpoint page
			push(`/outpoint/${params.id}`);
		case AssetType.BSV20:
			return (
				<MarketPage selectedAssetType={AssetType.BSV20} id={tickOrId} />
			);
		case AssetType.BSV21:
			return (
				<MarketPage selectedAssetType={AssetType.BSV21} id={tickOrId} />
			);
		case AssetType.LRC20: {
			return <Lrc20MarketPage />;
		}
		default:
			return null;
	}
};

export default Market;
