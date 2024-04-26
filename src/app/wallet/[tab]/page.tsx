import WalletBsv20 from "@/components/Wallet/bsv20";
import WalletOrdinals from "@/components/Wallet/ordinals";
import { AssetType } from "@/constants";
import { getCapitalizedAssetType } from "@/utils/assetType";

const WalletPage = async ({ params }: { params: { tab: AssetType } }) => {
	return (
		<div className="mx-auto">
			{params.tab === AssetType.BSV20 ||
			params.tab === AssetType.BSV21 ? (
				<WalletBsv20 type={params.tab} />
			) : (
				<WalletOrdinals />
			)}
		</div>
	);
};

export default WalletPage;

export async function generateMetadata({
	params,
}: {
	params: { tab: AssetType };
}) {
	const { tab } = params;
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
