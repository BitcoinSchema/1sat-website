import { API_HOST } from "@/constants";
import type { CollectionStats } from "@/types/collection";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import OutpointPage from ".";
import CollectionContent from "./collectionContent";
import { OutpointTab } from "./tabs";

interface Props {
	outpoint: string;
}

const OutpointCollection = async ({ outpoint }: Props) => {
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

	// console.log({ artifact });
	const isCollection =
		artifact?.origin?.data?.map?.subType === "collection" ||
		artifact?.origin?.data?.map?.subType === "collectionItem";

	if (!isCollection) {
		return <div>Not a collection</div>;
	}

	// Get the Ordinal TXO
	let collection: OrdUtxo | undefined;
	const collectionUrl = `${API_HOST}/api/txos/${artifact.origin?.data?.map?.subTypeData.collectionId}`;
	try {
		const { promise: promiseCollection } =
			http.customFetch<OrdUtxo>(collectionUrl);
		collection = await promiseCollection;
	} catch (e) {
		console.error("Error fetching collection", e, collectionUrl);
	}

	// Get the collection stats
	let _stats: CollectionStats | undefined;
	const collectionStatsUrl = `${API_HOST}/api/collections/${artifact.origin?.data?.map?.subTypeData.collectionId}/stats`;
	try {
		const { promise } = http.customFetch<CollectionStats>(collectionStatsUrl);
		_stats = (await promise) || [];
	} catch (e) {
		console.error(e);
	}

	if (!collection) {
		return <div>Collection not found</div>;
	}

	const content = (
		<CollectionContent artifact={artifact} collection={collection} />
	);

	return (
		<OutpointPage
			artifact={artifact}
			outpoint={outpoint}
			content={content}
			activeTab={OutpointTab.Collection}
		/>
	);
};

export default OutpointCollection;
