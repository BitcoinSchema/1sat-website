import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import { getOutpoints } from "@/utils/address";
import * as http from "@/utils/httpClient";
import OutpointPage from ".";
import OwnerContent from "./ownerContent";
import { OutpointTab } from "./tabs";

interface Props {
	outpoint: string;
}

const OutpointOwner = async ({ outpoint }: Props) => {
	let artifact: OrdUtxo | undefined;
	let bsv20: OrdUtxo | undefined;
	try {
		const url = `${API_HOST}/api/bsv20/outpoint/${outpoint}`;
		const { promise } = http.customFetch<OrdUtxo>(url);
		bsv20 = await promise;
	} catch (e) {
		console.log("Failed to fetch bsv20 outpoint", e);
	}

	try {
		const url = `${API_HOST}/api/inscriptions/${outpoint}`;
		const { promise } = http.customFetch<OrdUtxo>(url);
		artifact = await promise;
	} catch (e) {
		console.log("Failed to fetch outpoint", e);
	}

	console.log({ artifact, bsv20 });

	const content = <OwnerContent artifact={artifact || bsv20!} />;

	if (artifact && !artifact?.script) {
		const results = await getOutpoints([artifact.outpoint], true);
		if (results?.length > 0) {
			console.log("results[0].script", results[0].script);
			artifact.script = results[0].script;
		}
	}

	return (
		<OutpointPage
			artifact={artifact || bsv20!}
			outpoint={outpoint}
			content={content}
			activeTab={OutpointTab.Owner}
		/>
	);
};

export default OutpointOwner;
