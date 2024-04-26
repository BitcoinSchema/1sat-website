import WalletBsv20 from "@/components/Wallet/bsv20";
import WalletOrdinals from "@/components/Wallet/ordinals";
import { AssetType } from "@/constants";
import { getCapitalizedAssetType } from "@/utils/assetType";

const AddressPage = ({
	params,
}: {
	params: { address: string; type: AssetType };
}) => {
	return (
		<div className="mx-auto">
			<h1 className="text-3xl font-bold mb-4">
				Address: {params.address}
			</h1>
			{params.type === AssetType.BSV20 ||
			params.type === AssetType.BSV21 ? (
				<WalletBsv20 address={params.address} type={params.type} />
			) : (
				<WalletOrdinals address={params.address} />
			)}
		</div>
	);
};

export default AddressPage;

export async function generateMetadata({
	params,
}: {
	params: { address: string; type: AssetType };
}) {
	const { address, type } = params;
	const assetType = getCapitalizedAssetType(type);

	return {
		title: `${assetType} activity for address ${address}`,
		description: `View the ${assetType} activity for the address ${address} on 1SatOrdinals.`,
		openGraph: {
			title: `${assetType} activity for address ${address}`,
			description: `View the ${assetType} activity for the address ${address} on 1SatOrdinals.`,
		},
		twitter: {
			card: "summary_large_image",
			title: `${assetType} activity for address ${address}`,
			description: `View the ${assetType} activity for the address ${address} on 1SatOrdinals.`,
		},
	};
}
