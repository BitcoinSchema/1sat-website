"use client";

import CollectionPage from "@/components/pages/collection";
import { API_HOST } from "@/constants";
import { CollectionStats } from "@/types/collection";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import {
	COOM_BANNERS_BY_OUTPOINT,
	COOM_OUTPOINTS_BY_SLUGS,
	COOM_SLUGS_AND_OUTPOINTS,
} from "../constants";
import {
	fetchCollectionItems,
	fetchCollectionMarket,
} from "@/utils/fetchCollectionData";
import { useQuery } from "@tanstack/react-query";
import { FaSpinner } from "react-icons/fa";

const CoOMCollection = ({ params }: { params: { outpoint: string } }) => {
	let outpoint = params.outpoint;
	const isCoom = COOM_SLUGS_AND_OUTPOINTS.includes(outpoint);
	const isCoomSlug = isCoom && !!COOM_OUTPOINTS_BY_SLUGS[outpoint];

	if (isCoomSlug) {
		outpoint = COOM_OUTPOINTS_BY_SLUGS[outpoint];
	}

	// Get the Ordinal TXO
	const { data: collection } = useQuery<OrdUtxo>({
		queryKey: ["collection", "outpoint", outpoint],
		queryFn: () => {
			const { promise } = http.customFetch<OrdUtxo>(
				`${API_HOST}/api/txos/${outpoint}`
			);
			return promise;
		},
		staleTime: 1000 * 60 * 5,
		enabled: !!outpoint,
	});

	// Get the collection stats
	const { data: stats } = useQuery<CollectionStats>({
		queryKey: ["collection", "stats", outpoint],
		queryFn: () => {
			const { promise } = http.customFetch<CollectionStats>(
				`${API_HOST}/api/collections/${outpoint}/stats`
			);
			return promise;
		},
		staleTime: 1000 * 60 * 5,
		enabled: !!outpoint,
	});

	// Get the collection items
	const q = {
		map: {
			subTypeData: {
				collectionId: outpoint,
			},
		},
	};

	const { data: items, isLoading: isLoadingItems } = useQuery<OrdUtxo[]>({
		queryKey: ["collection", "items", outpoint],
		queryFn: () => fetchCollectionItems(q),
		staleTime: 1000 * 60 * 5,
		enabled: !!outpoint,
	});

	const { data: market, isLoading: isLoadingMarket } = useQuery<OrdUtxo[]>({
		queryKey: ["collection", "market", outpoint],
		queryFn: async () => {
			const response = await fetchCollectionMarket(q);
			return response || [];
		},
		staleTime: 1000 * 60 * 5,
		enabled: !!outpoint,
	});

	if (isLoadingItems || isLoadingMarket) {
		return (
			<div className="flex justify-center">
				<FaSpinner className="animate-spin" />
			</div>
		);
	}

	if (!collection || !stats) {
		return <div>Collection not found</div>;
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
			bannerImage={COOM_BANNERS_BY_OUTPOINT[outpoint]}
		/>
	);
};

export default CoOMCollection;
