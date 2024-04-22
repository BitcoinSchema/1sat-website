"use client";

import SignerPage from "@/components/pages/signer";
import { API_HOST } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { useQuery } from "@tanstack/react-query";

const Signer = ({ params }: { params: { address: string } }) => {
	const { data: history, isLoading: isLoadingHistory } = useQuery({
		queryKey: ["signer", params.address],
		queryFn: async () => {
			const { promise } = http.customFetch<OrdUtxo[]>(
				`${API_HOST}/api/txos/address/${params.address}/history`
			);

			return promise;
		},
	});

	if (isLoadingHistory) {
		return <div className="mx-auto">Loading...</div>;
	}

	return <SignerPage {...params} history={history ?? []} />;
};

export default Signer;
