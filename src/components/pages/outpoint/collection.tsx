"use client";

import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { useQuery } from "@tanstack/react-query";
import OutpointPage from ".";
import CollectionContent from "./collectionContent";
import { OutpointTab } from "./tabs";

interface Props {
	outpoint: string;
}

const OutpointCollection = ({ outpoint }: Props) => {
	const { data: artifact } = useQuery<OrdUtxo>({
		queryKey: ["inscription", "outpoint", outpoint],
		queryFn: () => {
			const { promise } = http.customFetch<OrdUtxo>(
				`${API_HOST}/api/inscriptions/${outpoint}`
			);
			return promise;
		},
		staleTime: 1000 * 60 * 5,
	});

	// Get the Ordinal TXO
	const { data: collection } = useQuery<OrdUtxo>({
		queryKey: [
			"collection",
			"outpoint",
			outpoint,
			artifact?.origin?.data?.map?.subTypeData.collectionId,
		],
		queryFn: () => {
			const { promise } = http.customFetch<OrdUtxo>(
				`${API_HOST}/api/txos/${artifact?.origin?.data?.map?.subTypeData.collectionId}`
			);
			return promise;
		},
		staleTime: 1000 * 60 * 5,
		enabled: !!artifact,
	});

	// Get the collection stats
	// const { data: stats } = useQuery<CollectionStats>({
	// 	queryKey: [
	// 		"collection",
	// 		"stats",
	// 		artifact?.origin?.data?.map?.subTypeData.collectionId,
	// 	],
	// 	queryFn: () => {
	// 		const { promise } = http.customFetch<CollectionStats>(
	// 			`${API_HOST}/api/collections/${artifact?.origin?.data?.map?.subTypeData.collectionId}/stats`
	// 		);
	// 		return promise;
	// 	},
	// 	staleTime: 1000 * 60 * 5,
	// 	enabled: !!artifact,
	// });

	if (!artifact) {
		return <div>Artifact not found</div>;
	}

	console.log({ artifact });
	const isCollection =
		artifact?.origin?.data?.map?.subType === "collection" ||
		artifact?.origin?.data?.map?.subType === "collectionItem";

	if (!isCollection) {
		return <div>Not a collection</div>;
	}

	if (!collection) {
		return <div>Collection not found</div>;
	}

	const content = (
		<CollectionContent artifact={artifact} collection={collection} />
	);

	return (
		<OutpointPage
			artifact={artifact}
			outpoint={outpoint}
			content={content}
			activeTab={OutpointTab.Collection}
		/>
	);
};

export default OutpointCollection;
