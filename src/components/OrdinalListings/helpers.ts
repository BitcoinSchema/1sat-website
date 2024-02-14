import { API_HOST, resultsPerPage } from "@/constants";
import { Collection } from "@/types/collection";
import { OrdUtxo } from "@/types/ordinals";
import { Signal } from "@preact/signals-react";
import { uniq } from "lodash";
import { ArtifactType, artifactTypeMap } from "../artifact";

interface GroupedCollection {
	name: string;
	collections: Collection[];
}

export const checkOutpointFormat = (outpoint: string) => {
	// ensure txid_vout format
	const split = outpoint.split("_");
	if (split.length !== 2) {
		return false;
	}
	if (split[0].length !== 64) {
		return false;
	}
	if (Number.isNaN(parseInt(split[1]))) {
		return false;
	}
	return true;
};

export const getOrdUtxos = async ({
	address,
	pageParam,
	selectedType,
}: {
	address?: string;
	pageParam: number;
	selectedType?: ArtifactType;
}) => {
	if (!address) return;
	console.log("getOrdUtxos called", address, pageParam, selectedType);
	const offset = resultsPerPage * pageParam;
	let url = `${API_HOST}/api/txos/address/${address}/unspent?limit=${resultsPerPage}&offset=${offset}&dir=DESC&status=all&bsv20=false`;
	if (!address) {
		url = `${API_HOST}/api/market?limit=${resultsPerPage}&offset=${offset}&dir=DESC`;
	}
  if (selectedType && selectedType > 0) {
    url += `&type=${artifactTypeMap.get(selectedType)}`;
  }
	const res = await fetch(url);
	// filter for the selected type
	const json = res.json() as Promise<OrdUtxo[]>;
	
	const result = await json;
	const final = selectedType
		? result.filter((o) => {
				return o.origin?.data?.insc?.file.type?.startsWith(
					artifactTypeMap.get(selectedType) as string,
				);
		  })
		: result;
	return final;
};

export const getOutpoints = async (ids: string[], script: boolean) => {
	const url = `${API_HOST}/api/txos/outpoints?script=${script}`;
	console.log("almost", url, "with", ids);
	const uniqueIds = uniq(ids);
	console.log("hitting", url, "with", uniqueIds);

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
		case "image/gif":
		case "image/jpg":
		case "image/jpeg":
		case "image/webp":
		case "image/png":
			return (
				listing?.origin?.data?.map?.name ||
				listing?.origin?.data?.map?.subTypeData?.name ||
				listing?.origin?.data?.map?.app ||
				"Unknown Name"
			);
		case "text/html": {
			// extract the title from the html
			const html = listing?.origin?.data?.insc?.text;
			const title = html?.match(/<title>(.*)<\/title>/)?.[1];
			return title || listing?.origin.num;
		}
		case "text/json":
			return listing?.origin?.data?.insc.text || listing?.origin.num;
		case "text/plain":
			return listing?.origin?.data?.insc.text || listing?.origin.num;
		default:
			return listing?.origin?.num || "Unknown";
	}
};

export const listingCollection = (
	listing: OrdUtxo,
	collections: Signal<OrdUtxo[]>,
) => {
	if (listing?.origin?.data?.map) {
		const collectionId = listing?.origin.data.map.subTypeData?.collectionId;
		if (!collectionId) {
			return null;
		}
		const collection = collections.value.find(
			(c) => c.outpoint === collectionId,
		)?.origin?.data?.map;
		if (collection) {
			return collection;
		}
	}
};
