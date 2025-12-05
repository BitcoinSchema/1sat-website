import Timeline from "@/components/Timeline";
import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import OutpointPage from ".";
import { OutpointTab } from "./tabs";

interface Props {
	outpoint: string;
}

const OutpointTimeline = async ({ outpoint }: Props) => {
	let listing: OrdUtxo | undefined;
	let history: OrdUtxo[] = [];
	let spends: OrdUtxo[] = [];

	try {
		const url = `${API_HOST}/api/inscriptions/${outpoint}`;
		const { promise } = http.customFetch<OrdUtxo>(url);
		listing = await promise;
		if (listing.origin?.outpoint) {
			try {
				const urlHistory = `${API_HOST}/api/inscriptions/${listing.origin.outpoint}/history`;
				const { promise: promiseHistory } =
					http.customFetch<OrdUtxo[]>(urlHistory);
				history = await promiseHistory;

				const spendOutpoints = history
					.filter((h) => h.spend)
					.map((h) => h.outpoint);
				const urlSpends = `${API_HOST}/api/txos/outpoints`;
				const { promise: promiseSpends } = http.customFetch<OrdUtxo[]>(
					urlSpends,
					{
						method: "POST",
						body: JSON.stringify(spendOutpoints),
					},
				);

				spends = await promiseSpends;
			} catch (e) {
				console.error("Failed to get inscription history", e);
			}
		}
	} catch (e) {
		console.error("Failed to get inscription", e);
	}
	if (!listing) {
		return (
			<div>
				Outpoint Not found
				<div>{outpoint}</div>
			</div>
		);
	}
	return (
		<OutpointPage
			artifact={listing}
			history={history}
			spends={spends}
			outpoint={outpoint}
			content={<Timeline history={history} spends={spends} listing={listing} />}
			activeTab={OutpointTab.Timeline}
		/>
	);
};

export default OutpointTimeline;
