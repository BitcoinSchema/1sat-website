import { API_HOST } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import OutpointPage from ".";
import { OutpointTab } from "./tabs";
import { useQuery } from "@tanstack/react-query";

interface Props {
	outpoint: string;
}

const OutpointToken = ({ outpoint }: Props) => {
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

	const content =
		artifact && artifact.data?.bsv20 ? (
			<div>
				<div>Token</div>
			</div>
		) : (
			<div>Not a token</div>
		);

	return (
		<OutpointPage
			artifact={artifact || bsv20!}
			outpoint={outpoint}
			content={content}
			activeTab={OutpointTab.Token}
		/>
	);
};

export default OutpointToken;
