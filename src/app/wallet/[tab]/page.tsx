import WalletBsv20 from "@/components/Wallet/bsv20";
import WalletHistory from "@/components/Wallet/history";
import WalletOrdinals from "@/components/Wallet/ordinals";
import { WalletTab } from "@/components/Wallet/tabs";
import WalletLayout from "@/components/Wallet/WalletLayout";

import { getCapitalizedAssetType } from "@/utils/assetType";

// Wallet pages are client-rendered — build them statically and 404 anything
// that isn't a known tab (e.g. /wallet/[object Object]) without invoking a
// serverless function
export const dynamicParams = false;

export function generateStaticParams() {
	return Object.values(WalletTab).map((tab) => ({ tab }));
}

const WalletPage = async ({
	params,
}: {
	params: Promise<{ tab: WalletTab }>;
}) => {
	const { tab } = await params;

	const getContent = () => {
		switch (tab) {
			case WalletTab.Ordinals:
				return <WalletOrdinals />;
			case WalletTab.BSV20:
			case WalletTab.BSV21:
				return <WalletBsv20 type={tab} />;
			case WalletTab.History:
				return <WalletHistory />;
			default:
				return <WalletOrdinals />;
		}
	};

	return <WalletLayout tab={tab}>{getContent()}</WalletLayout>;
};

export default WalletPage;

export async function generateMetadata({
	params,
}: {
	params: Promise<{ tab: WalletTab }>;
}) {
	const { tab } = await params;
	const assetType = getCapitalizedAssetType(tab);

	return {
		title: `Manage ${assetType} Wallet - 1SatOrdinals`,
		description: `Manage your ${assetType} wallet on 1SatOrdinals.`,
		openGraph: {
			title: `Manage ${assetType} Wallet - 1SatOrdinals`,
			description: `Manage your ${assetType} wallet on 1SatOrdinals.`,
			type: "website",
		},
		twitter: {
			card: "summary",
			title: `Manage ${assetType} Wallet - 1SatOrdinals`,
			description: `Manage your ${assetType} wallet on 1SatOrdinals.`,
		},
	};
}
