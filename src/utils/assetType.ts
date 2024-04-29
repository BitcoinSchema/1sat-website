import type { WalletTab } from "@/components/Wallet/tabs";
import { AssetType } from "@/constants";

export function getCapitalizedAssetType(assetType: AssetType | WalletTab) {
	const types: (AssetType | WalletTab)[] = [
		AssetType.BSV20,
		AssetType.BSV21,
		AssetType.LRC20,
	];
	if (types.includes(assetType)) {
		return assetType.toUpperCase();
	}
	return assetType.charAt(0).toUpperCase() + assetType.slice(1);
}
