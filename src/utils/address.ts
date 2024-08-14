import { API_HOST, resultsPerPage } from "@/constants";
import { WocUtxo, WocUtxoResults } from "@/types/common";
import type { OrdUtxo } from "@/types/ordinals";
import { uniq } from "lodash";
import * as http from "./httpClient";
import { type CollectionSubTypeData, fetchNftUtxos, fetchPayUtxos, type Utxo } from "js-1sat-ord";
import { PrivateKey } from "@bsv/sdk";

export const addressFromWif = (payPk: string) => {
	const pk = PrivateKey.fromWif(payPk);
	return pk && payPk && pk.toAddress().toString();
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


// // TODO: Implement this
// export const getCollectionUtxos = async (address: string | null) => {
//   // dummy OrdUtxo
//   const dummy = {
//     outpoint: "abc123",
//     data: {
//       map: {
//         name: "Unnamed Collection",
//       },
//     },
//   } as unknown as OrdUtxo
//   if (!address) {
//     return [dummy]
//     // throw new Error("No address provided");
//   }
//   const q = {
//     map: {
//       subType: "collection",
//     },
//   };
//   const response = await fetch(`${API_HOST}/api/txos/address/${address}/unspent`, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(q),
//   });
//   if (!response.ok) {
//     return [dummy]
//     // throw new Error("Failed to fetch collection UTXOs");
//   }

//   return ((await response.json()) || []).concat([dummy]);
// };


export const getCollectionUtxos = async (address: string | null): Promise<OrdUtxo[]> => {
  // Dummy data for testing
  const dummyCollections: OrdUtxo[] = [
    {
      outpoint: "abc123",
      data: {
        map: {
          app: "1sat.market",
          type: "ord",
          subType: "collection",
          name: "Test Collection 1",
          subTypeData: JSON.stringify({
            description: "This is a test collection",
            quantity: 100,
            rarityLabels: [
              { label: "Common", percentage: "0.50" },
              { label: "Rare", percentage: "0.30" },
              { label: "Epic", percentage: "0.15" },
              { label: "Legendary", percentage: "0.05" },
            ],
            traits: {
              Color: {
                values: ["Red", "Blue", "Green"],
                occurancePercentages: ["0.33", "0.33", "0.34"],
              },
              Size: {
                values: ["Small", "Medium", "Large"],
                occurancePercentages: ["0.25", "0.50", "0.25"],
              },
              Shape: {
                values: ["Circle", "Square", "Triangle"],
                occurancePercentages: ["0.40", "0.40", "0.20"],
              },
            },
          } as CollectionSubTypeData),
        },
      },
    },
    {
      outpoint: "def456",
      data: {
        map: {
          app: "1sat.market",
          type: "ord",
          subType: "collection",
          name: "Test Collection 2",
          subTypeData: JSON.stringify({
            description: "Another test collection",
            quantity: 50,
            rarityLabels: [
              { label: "Normal", percentage: "0.70" },
              { label: "Uncommon", percentage: "0.20" },
              { label: "Super Rare", percentage: "0.10" },
            ],
            traits: {
              Element: {
                values: ["Fire", "Water", "Earth", "Air"],
                occurancePercentages: ["0.25", "0.25", "0.25", "0.25"],
              },
              Power: {
                values: ["Low", "Medium", "High"],
                occurancePercentages: ["0.40", "0.40", "0.20"],
              },
            },
          } as CollectionSubTypeData),
        },
      },
    },
  ] as unknown as OrdUtxo[];

  // Simulating an API call delay
  // await new Promise(resolve => setTimeout(resolve, 500));

  return dummyCollections;
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
