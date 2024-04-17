"use client";

import CollectionPage from "@/components/pages/collection";
import { API_HOST } from "@/constants";
import { CollectionStats } from "@/types/collection";
import { OrdUtxo } from "@/types/ordinals";
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

	const q = {
		map: {
			subTypeData: {
				collectionId: params.outpoint,
			},
		},
	};

	// Get the collection items
	const { data: items, isLoading: isLoadingItems } = useQuery<OrdUtxo[]>({
		queryKey: ["collection", "items", params.outpoint],
		queryFn: () => {
			const { promise } = http.customFetch<OrdUtxo[]>(
				`${API_HOST}/api/inscriptions/search?limit=100&q=${btoa(
					JSON.stringify(q)
				)}`
			);
			return promise;
		},
		staleTime: 1000 * 60 * 5,
		enabled: !!params.outpoint,
	});

	// Get the market listings
	const { data: market, isLoading: isLoadingMarket } = useQuery<OrdUtxo[]>({
		queryKey: ["collection", "market", params.outpoint],
		queryFn: () => {
			const { promise } = http.customFetch<OrdUtxo[]>(
				`${API_HOST}/api/market?limit=100&q=${btoa(JSON.stringify(q))}`
			);
			return promise;
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

	// combine collection items and market listings, favoring listings
	const both = market?.concat(
		items?.filter(
			(i) =>
				!market.find((m) => m.origin?.outpoint === i.origin?.outpoint)
		) ?? []
	);

	if (!collection || !stats || !both) {
		return <div>Collection not found</div>;
	}

	return (
		<CollectionPage stats={stats} items={both} collection={collection} />
	);
};

export default Collection;
