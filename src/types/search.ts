import type { AssetType } from "@/constants";

export type Autofill = {
	tick: string;
	id: string;
	icon?: string;
	type: AssetType.BSV20 | AssetType.BSV21;
};
