"use client";

import { API_HOST } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import OutpointPage from ".";
import ListingContent from "./listingContent";
import { OutpointTab } from "./tabs";
import { useQuery } from "@tanstack/react-query";

interface Props {
	outpoint: string;
}

const OutpointListing = ({ outpoint }: Props) => {
	const { data: bsv20 } = useQuery<OrdUtxo>({
		queryKey: ["inscription", "outpoint", outpoint],
		queryFn: () => {
			const { promise } = http.customFetch<OrdUtxo>(
				`${API_HOST}/api/inscriptions/${outpoint}`
			);

			return promise;
		},
		staleTime: 1000 * 60 * 5,
	});

	const { data: artifact } = useQuery<OrdUtxo>({
		queryKey: ["bsv20", "outpoint", outpoint],
		queryFn: () => {
			const { promise } = http.customFetch<OrdUtxo>(
				`${API_HOST}/api/bsv20/outpoint/${outpoint}`
			);

			return promise;
		},
		staleTime: 1000 * 60 * 5,
	});

	console.log({ artifact, bsv20 });
	const listing = artifact?.data?.list || bsv20?.data?.list;
	const content = listing ? (
		<ListingContent artifact={artifact || bsv20!} />
	) : (
		<div>Not a listing</div>
	);

	return (
		<OutpointPage
			artifact={artifact || bsv20!}
			outpoint={outpoint}
			content={content}
			activeTab={OutpointTab.Listing}
		/>
	);
};

export default OutpointListing;
