import { API_HOST, resultsPerPage } from "@/constants";
import type { Collection } from "@/types/collection";
import type { OrdUtxo } from "@/types/ordinals";
import { uniq } from "lodash";
import { ArtifactType, artifactTypeMap } from "../artifact";

interface GroupedCollection {
	name: string;
	collections: Collection[];
}

// api does this now
// export const shouldBeHidden = (listing: OrdUtxo) => {
//   if (listing.origin?.data?.bsv20 && !listing.data) {
//     // ignore "reciepts/remnants" from bsv20 transfers which are already accounted for in other outputs
//     // example: https://whatsonchain.com/tx/69a5956ee1cad8056f0c4d6ca4f87766080b36a75f2192d2cf75f1f668f446d6
//     return true;
//   }
// }

export const checkOutpointFormat = (outpoint: string) => {
	// ensure txid_vout format
	const split = outpoint.split("_");
	if (split.length !== 2) {
		return false;
	}
	if (split[0].length !== 64) {
		return false;
	}
	if (Number.isNaN(Number.parseInt(split[1], 10))) {
		return false;
	}
	return true;
};

// TODO: this is a duplicate of two other requests mixed in one getOrdUtxos and getMarketListings used by ./view
export const getOrdList = async ({
	address,
	pageParam,
	selectedType,
}: {
	address?: string;
	pageParam: number;
	selectedType: ArtifactType | null;
}) => {
	if (!address) return;
	// console.log("getOrdUtxos called", address, pageParam, selectedType);
	const offset = resultsPerPage * pageParam;
	let url = `${API_HOST}/api/txos/address/${address}/unspent?limit=${resultsPerPage}&offset=${offset}&dir=DESC&status=all&bsv20=false`;
	if (!address) {
		url = `${API_HOST}/api/market?limit=${resultsPerPage}&offset=${offset}&dir=DESC`;
	}

	if (selectedType && selectedType !== ArtifactType.All) {
		url += `&type=${artifactTypeMap.get(selectedType)}`;
	}
	// console.log("Using url", url);
	const res = await fetch(url);
	// filter for the selected type
	const json = res.json() as Promise<OrdUtxo[]>;

	const result = await json;
	const final =
		selectedType !== ArtifactType.All
			? result.filter((o) => {
					return o.origin?.data?.insc?.file.type?.startsWith(
						artifactTypeMap.get(
							selectedType as ArtifactType
						) as string
					);
			  })
			: result;
	return final;
};

export const getOutpoints = async (ids: string[], script: boolean) => {
	const url = `${API_HOST}/api/txos/outpoints?script=${script}`;
	// console.log("almost", url, "with", ids);
	const uniqueIds = uniq(ids);
	// console.log("hitting", url, "with", uniqueIds);

	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(uniqueIds),
	});
	const json = (await res.json()) as OrdUtxo[];
	return json;
};

export const mintNumber = (listing: OrdUtxo, collection: any) => {
	const listingData = listing?.origin?.data?.map;
	const mintNumber: string = listingData?.subTypeData?.mintNumber;
	const qty = collection?.subTypeData?.quantity;
	if (!qty || !mintNumber) {
		return null;
	}
	return `${mintNumber}/${qty}`;
};

export const listingName = (listing: OrdUtxo) => {
	if (listing?.origin?.data?.bsv20) {
		return listing?.origin.data.bsv20.tick;
	}
	switch (listing?.origin?.data?.insc?.file.type.split(";")[0]) {
      case "text/html": { 
      const nameFromMeta = listing?.origin?.data.map?.name || listing?.origin.data.map?.subTypeData.name 
      if (nameFromMeta) {
        return nameFromMeta
      }
      
			// extract the title from the html
			const html = listing?.origin?.data?.insc?.text;
			const title = html?.match(/<title>(.*)<\/title>/)?.[1];
			if (title) {
        return title;
			}
      }
		case "text/json":
			return listing?.origin?.data?.insc.text || listing?.origin.num;
		case "text/plain":
			return listing?.origin?.data?.insc.text || listing?.origin.num;
		default:
			// return listing?.origin?.num || "Unknown";
			return (
				listing?.origin?.data?.map?.name ||
				listing?.origin?.data?.map?.subTypeData?.name ||
				listing?.origin?.data?.map?.app ||
				listing?.origin?.num ||
				"Unknown Name"
			);
	}
};

export const listingCollection = (listing: OrdUtxo, collections: OrdUtxo[]) => {
	if (listing?.origin?.data?.map) {
		const collectionId = listing?.origin.data.map.subTypeData?.collectionId;
		if (!collectionId) {
			return null;
		}
		const collection = collections.find((c) => c.outpoint === collectionId)
			?.origin?.data?.map;
		if (collection) {
			return collection;
		}
	}
};
