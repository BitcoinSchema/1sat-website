'use client';

import MarketPage from "@/components/pages/market";
import { Lrc20MarketPage } from "@/components/pages/market/lrc20";
import { OrdinalsMarketPage } from "@/components/pages/market/ordinals";
import { AssetType } from "@/constants";

const Market = ({ params }: { params: { tab: AssetType } }) => {
	switch (params.tab) {
		case AssetType.Ordinals:
			return <OrdinalsMarketPage />;
		case AssetType.BSV20:
			return <MarketPage selectedAssetType={AssetType.BSV20} />;
		case AssetType.BSV21:
			return <MarketPage selectedAssetType={AssetType.BSV21} />;
		case AssetType.LRC20:
			return <Lrc20MarketPage />;
		default:
			return null;
	}
};
export default Market;
