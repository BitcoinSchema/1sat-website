import { API_HOST } from "@/constants";
import { OutpointTab } from "@/types/common";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import OutpointPage from ".";
import OwnerContent from "./ownerContent";

interface Props {
	outpoint: string;
}

const OutpointOwner = async ({ outpoint }: Props) => {
	let artifact: OrdUtxo | undefined;

	try {
		const url = `${API_HOST}/api/inscriptions/${outpoint}`;
		const { promise } = http.customFetch<OrdUtxo>(url);
		artifact = await promise;
	} catch (e) {
		console.log(e);
	}

	if (!artifact) {
		return <div>Artifact not found</div>;
	}

	const content = <OwnerContent artifact={artifact} />;

	return (
		<OutpointPage
			artifact={artifact}
			outpoint={outpoint}
			content={content}
			activeTab={OutpointTab.Owner}
		/>
	);
};

export default OutpointOwner;
