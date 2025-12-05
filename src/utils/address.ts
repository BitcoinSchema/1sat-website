import { API_HOST, resultsPerPage } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import { uniq } from "lodash";
import * as http from "./httpClient";
import { fetchPayUtxos, type Utxo } from "js-1sat-ord";
import { PrivateKey } from "@bsv/sdk";

export const addressFromWif = (payPk: string) => {
	const pk = PrivateKey.fromWif(payPk);
	return pk && payPk && pk.toAddress();
};

export const getBsv21Utxos = async (
	address: string,
	offset: number,
	id?: string,
) => {
	let url = `${API_HOST}/api/bsv20/${address}/id/${id}?limit=${resultsPerPage}&offset=${offset}&dir=DESC&listing=true`;
	if (id) {
		url += `&id=${id}`;
	}
	const { promise } = http.customFetch<OrdUtxo[]>(url);

	return (await promise) || [];
};

export const getBsv20Utxos = async (
	address: string,
	offset: number,
	tick?: string,
) => {
	let url = `${API_HOST}/api/bsv20/${address}/tick/${tick}?limit=${resultsPerPage}&offset=${offset}&dir=DESC&listing=true`;
	if (tick) {
		url += `&tick=${tick}`;
	}
	const { promise } = http.customFetch<OrdUtxo[]>(url);

	return (await promise) || [];
};

export const getOrdUtxos = async (address: string, nextOffset: number) => {
	const { promise } = http.customFetch<OrdUtxo[]>(
		`${API_HOST}/api/txos/address/${address}/unspent?limit=${resultsPerPage}&offset=${nextOffset}&dir=DESC&status=all&bsv20=false`,
	);
	return (await promise) || [];
};

export const getUtxos = async (address: string): Promise<Utxo[]> => {

  // use gorillapool
  try {
    return await fetchPayUtxos(address);
    
  } catch (e) {
    console.log("error", e);
    return [];
  }
  
	// try {
	// 	// Try beta endpoint first
	// 		// `https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent` // deprecated
	// 		// `https://ordinals.gorillapool.io/api/txos/address/${address}/unspent?bsv20=false`
	// 		`https://api.whatsonchain.com/v1/bsv/main/address/${address}/unconfirmed/unspent`,
	// 	);
	// 	const u = (await promise).result;
	// 	const { promise: promiseConfirmed } = http.customFetch<WocUtxoResults>(
	// 		`https://api.whatsonchain.com/v1/bsv/main/address/${address}/confirmed/unspent`,
	// 	);
	// 	const c = (await promiseConfirmed).result;

	// 	return u.concat(c).map((u) => {
	// 		return {
	// 			satoshis: u.value,
	// 			txid: u.tx_hash,
	// 			vout: u.tx_pos,
	// 			script: P2PKHAddress.from_string(address)
	// 				.get_locking_script()
	// 				.to_asm_string(),
	// 		};
	// 	});
	// } catch (e) {
	// 	console.log("error", e);

	// 	const { promise } = http.customFetch<WocUtxo[]>(
	// 		// `https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent` // deprecated
	// 		// `https://ordinals.gorillapool.io/api/txos/address/${address}/unspent?bsv20=false`
	// 		`https://api.whatsonchain.com/v1/bsv/main/address/${address}/unspent`,
	// 	);
	// 	const utxos = await promise;

	// 	return utxos.map((u) => {
	// 		return {
	// 			satoshis: u.value,
	// 			txid: u.tx_hash,
	// 			vout: u.tx_pos,
	// 			script: P2PKHAddress.from_string(address)
	// 				.get_locking_script()
	// 				.to_asm_string(),
	// 		};
	// 	});
	// }
};

export const getOutpoints = async (ids: string[], script: boolean) => {
	const url = `${API_HOST}/api/txos/outpoints?script=${script}`;
	console.log("almost", url, "with", ids);
	const uniqueIds = uniq(ids);
	console.log("hitting", url, "with", uniqueIds);

	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(uniqueIds),
	});
	const json = (await res.json()) as OrdUtxo[];
	return json;
};
