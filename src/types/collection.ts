import type { OrdUtxo } from "./ordinals";

export interface CollectionStats {
	count: number;
	max: number;
}

export enum KnownSubType {
	Collection = "collection",
}

type Trait = {
	name: string;
	value: string;
};

type CollectionItem = {
	collectionId: number;
	name: string;
	description: string;
	image: string;
	mintNumber?: number;
	traits: Trait;
	[key: string]: string | number | [string, string][] | undefined | Trait;
};

export interface Collection extends OrdUtxo {
	map: {
		app: string;
		name: string;
		type: string;
		subType: KnownSubType;
		royalties: string;
		previewUrl: string;
		subTypeData: CollectionItem;
	};
	stats?: CollectionStats;
}

export type FetchItemsQuery = {
	map: {
		subTypeData: {
			collectionId: string;
		};
	};
};
