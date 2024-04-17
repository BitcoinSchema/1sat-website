"use client";

import Timeline from "@/components/Timeline";
import { API_HOST } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import OutpointPage from ".";
import { OutpointTab } from "./tabs";
import { useQuery } from "@tanstack/react-query";
import { FaSpinner } from "react-icons/fa";

interface Props {
	outpoint: string;
}

const OutpointTimeline = ({ outpoint }: Props) => {
	const { data: listing } = useQuery<OrdUtxo>({
		queryKey: ["inscription", "outpoint", outpoint],
		queryFn: () => {
			const { promise } = http.customFetch<OrdUtxo>(
				`${API_HOST}/api/inscriptions/${outpoint}`
			);

			return promise;
		},
		staleTime: 1000 * 60 * 5,
	});

	const { data: history } = useQuery<OrdUtxo[]>({
		queryKey: [
			"inscriptions",
			"outpoint",
			outpoint,
			"history",
			listing?.origin?.outpoint,
		],
		queryFn: () => {
			if (!listing?.origin?.outpoint) {
				return [];
			}

			const urlHistory = `${API_HOST}/api/inscriptions/${listing.origin?.outpoint}/history`;
			const { promise } = http.customFetch<OrdUtxo[]>(urlHistory);

			return promise;
		},
		enabled: !!listing,
		staleTime: 1000 * 60 * 5,
	});

	const { data: spends } = useQuery<OrdUtxo[]>({
		queryKey: [
			"txos",
			"outpoints",
			history?.filter((h) => h.spend).map((h) => h.outpoint),
		],
		queryFn: () => {
			if (!history) {
				return [];
			}

			const spendOutpoints = history
				.filter((h) => h.spend)
				.map((h) => h.outpoint);

			const urlSpends = `${API_HOST}/api/txos/outpoints`;
			const { promise } = http.customFetch<OrdUtxo[]>(urlSpends, {
				method: "POST",
				body: JSON.stringify(spendOutpoints),
			});

			return promise;
		},
		enabled: !!history,
		staleTime: 1000 * 60 * 5,
	});

	if (!listing || !history || !spends) {
		return (
			<div className="flex justify-center">
				<FaSpinner className="animate-spin" />
			</div>
		);
	}

	return (
		<OutpointPage
			artifact={listing}
			history={history}
			spends={spends}
			outpoint={outpoint}
			content={
				<Timeline history={history} spends={spends} listing={listing} />
			}
			activeTab={OutpointTab.Timeline}
		/>
	);
};

export default OutpointTimeline;
