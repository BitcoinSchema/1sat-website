import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import ListingContent from "./listingContent";

interface Props {
	outpoint: string;
}

const ListingServer = async ({ outpoint }: Props) => {
	let artifact: OrdUtxo | undefined;
	let bsv20: OrdUtxo | undefined;
	try {
		const url = `${API_HOST}/api/bsv20/outpoint/${outpoint}`;
		const { promise } = http.customFetch<OrdUtxo>(url);
		bsv20 = await promise;
	} catch (e) {
		console.log(e);
	}

	try {
		const url = `${API_HOST}/api/inscriptions/${outpoint}`;
		const { promise } = http.customFetch<OrdUtxo>(url);
		artifact = await promise;
	} catch (e) {
		console.log(e);
	}

	if (!artifact && !bsv20) {
		return <div>Artifact not found</div>;
	}

	return <ListingContent artifact={artifact || bsv20!} />;
};

export default ListingServer;
