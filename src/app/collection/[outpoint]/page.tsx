"use client";

import CollectionPage from "@/components/pages/collection";
import { API_HOST } from "@/constants";
import { CollectionStats } from "@/types/collection";
import { OrdUtxo } from "@/types/ordinals";
import {
	fetchCollectionItems,
	fetchCollectionMarket,
} from "@/utils/fetchCollectionData";
import * as http from "@/utils/httpClient";
import { useQuery } from "@tanstack/react-query";
import { FaSpinner } from "react-icons/fa";

const Collection = ({ params }: { params: { outpoint: string } }) => {
	// Get the Ordinal TXO
	const { data: collection } = useQuery<OrdUtxo>({
		queryKey: ["collection", "outpoint", params.outpoint],
		queryFn: () => {
			const { promise } = http.customFetch<OrdUtxo>(
				`${API_HOST}/api/txos/${params.outpoint}`
			);
			return promise;
		},
		staleTime: 1000 * 60 * 5,
		enabled: !!params.outpoint,
	});

	// Get the collection stats
	const { data: stats } = useQuery<CollectionStats>({
		queryKey: ["collection", "stats", params.outpoint],
		queryFn: () => {
			const { promise } = http.customFetch<CollectionStats>(
				`${API_HOST}/api/collections/${params.outpoint}/stats`
			);
			return promise;
		},
		staleTime: 1000 * 60 * 5,
		enabled: !!params.outpoint,
	});

	// Get the collection items
	const q = {
		map: {
			subTypeData: {
				collectionId: params.outpoint,
			},
		},
	};

	const { data: items, isLoading: isLoadingItems } = useQuery<OrdUtxo[]>({
		queryKey: ["collection", "items", params.outpoint],
		queryFn: () => fetchCollectionItems(q),
		staleTime: 1000 * 60 * 5,
		enabled: !!params.outpoint,
	});

	const { data: market, isLoading: isLoadingMarket } = useQuery<OrdUtxo[]>({
		queryKey: ["collection", "market", params.outpoint],
		queryFn: async () => {
			const response = await fetchCollectionMarket(q);
			return response || [];
		},
		staleTime: 1000 * 60 * 5,
		enabled: !!params.outpoint,
	});

	if (isLoadingItems || isLoadingMarket) {
		return (
			<div className="flex justify-center">
				<FaSpinner className="animate-spin" />
			</div>
		);
	}

	if (!collection || !stats) {
		return <div className="flex justify-center">Collection not found</div>;
	}

	if (!items || !market) {
		return (
			<div className="flex justify-center">
				Collection items not found
			</div>
		);
	}

	return (
		<CollectionPage
			stats={stats}
			marketItems={market}
			items={items}
			collection={collection}
			query={q}
		/>
	);
};

export default Collection;
