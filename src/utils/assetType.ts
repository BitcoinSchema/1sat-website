import { AssetType } from "@/constants";

export function getCapitalizedAssetType(assetType: AssetType) {
	if (
		[AssetType.BSV20, AssetType.BSV21, AssetType.LRC20].includes(assetType)
	) {
		return assetType.toUpperCase();
	} else {
		return assetType.charAt(0).toUpperCase() + assetType.slice(1);
	}
}
