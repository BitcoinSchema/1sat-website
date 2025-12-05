import { API_HOST, AssetType } from "@/constants";
import type { BSV20TXO, OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";

interface Props {
	outpoint: string;
}

const TokenContent = async ({ outpoint }: Props) => {
	let _artifact: BSV20TXO | undefined;
	let inscription: OrdUtxo | undefined;
	try {
		const url = `${API_HOST}/api/bsv20/outpoint/${outpoint}`;
		const { promise } = http.customFetch<BSV20TXO>(url);
		_artifact = await promise;
	} catch (e) {
		console.log(e);
	}

	try {
		const url = `${API_HOST}/api/inscriptions/${outpoint}`;
		const { promise } = http.customFetch<OrdUtxo>(url);
		inscription = await promise;
	} catch (e) {
		console.log(e);
	}

	return inscription?.data?.bsv20 ? (
		<div>
			<div className="text-[#555]">
				Asset Type:{" "}
				{inscription.data.bsv20.id ? AssetType.BSV21 : AssetType.BSV20}
			</div>
			<div>op {inscription.data.bsv20.op}</div>
			<div className="flex items-center gap-2">
				<div>
					{inscription.data.bsv20.amt}{" "}
					{inscription.data.bsv20.tick || inscription.data.bsv20.sym}
				</div>
			</div>
			{inscription.data.bsv20.reason && (
				<div>Reason: {inscription.data.bsv20.reason}</div>
			)}
		</div>
	) : (
		<div>Not a token</div>
	);
};

export default TokenContent;
