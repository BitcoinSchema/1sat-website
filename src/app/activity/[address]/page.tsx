import { API_HOST } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

const AddressPage = async ({ params }: { params: { address: string } }) => {
	// fetch address history
	const historyUrl = `${API_HOST}/api/txos/address/${params.address}/history`;
	const { promise } = http.customFetch<OrdUtxo[]>(historyUrl);
	const history = await promise;
	// fetch txos
	const txosUrl = `${API_HOST}/api/txos/address/${params.address}/unspent`;
	const { promise: txosPromise } = http.customFetch<OrdUtxo[]>(txosUrl);
	const txos = await txosPromise;

	//
	return (
		<div className="mx-auto">
			<h1 className="text-3xl font-bold mb-4">Address: {params.address}</h1>
			<div>
				<h2>History</h2>
				<pre>{JSON.stringify(history, null, 2)}</pre>
			</div>
			<div>
				<h2>TXOs</h2>
				<pre>{JSON.stringify(txos, null, 2)}</pre>
			</div>
		</div>
	);
};

export default AddressPage;
