"use client";

import { toastErrorProps } from "@/constants";
import { payPk, pendingTxs } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { PendingTransaction } from "@/types/preview";
import {
	createOrdinals,
	type Destination,
	type PreMAP,
	type CreateOrdinalsConfig,
	type Inscription,
	type MAP,
	type Payment,
	type RemoteSigner,
	type Utxo,
  type LocalSigner,
} from "js-1sat-ord";
import toast from "react-hot-toast";
import { readFileAsBase64 } from "./file";
import { setPendingTxs } from "@/signals/wallet/client";
import { PrivateKey } from "@bsv/sdk";

export const handleInscribing = async (
	payPk: string,
	fileAsBase64: string,
	fileContentType: string,
	ordAddress: string,
	utxos: Utxo[],
	metaData?: PreMAP, // MAP,
	additionalPayments: Payment[] = [],
  idWif?: string,
) => {
	const paymentPk = PrivateKey.fromWif(payPk);

	// inscription
	const inscription = {
		dataB64: fileAsBase64,
		contentType: fileContentType,
	};

	// const idKey = PrivateKey.from_wif(
	//   "L1tFiewYRivZciv146HnCPBWzV35BR65dsJWZBYkQsKJ8UhXLz6q"
	// );
  let signer: LocalSigner | undefined;
  if (idWif) {
    const idKey = PrivateKey.fromWif(idWif);
    console.log("Inscribing with", { metaData });
    signer = {
      idKey // optional id key
      // keyHost: "http://localhost:21000",
    } as LocalSigner; // RemoteSigner;
  }
  
	console.log("Inscribing with", { metaData });
	// const signer = {
	// 	// idKey // optional id key
	// 	keyHost: "http://localhost:21000",
	// } as RemoteSigner;

	const destinations: Destination[] = [
		{
			address: ordAddress,
      inscription
		},
	];

  // [fundingUtxo],
  // ordAddress,
  // paymentPk,
  // changeAddress,
  // 0.05,
  // [inscription],
  // metadata, // optional metadata
  // undefined,
  // payments,

	const config: CreateOrdinalsConfig = {
		utxos,
		destinations,
		paymentPk,
    metaData,
    additionalPayments,
    signer,
	};
	const { spentOutpoints, tx, payChange } = await createOrdinals(config);
	return { spentOutpoints, tx, payChange};
};

// same as haleInscribing but takes multiple utxos and multiple inscriptions
export const handleBulkInscribing = async (
	payPk: string,
	inscriptions: Inscription[],
	ordAddress: string,
	changeAddress: string,
	utxos: Utxo[],
	metaData?: PreMAP,
	additionalPayments: Payment[] = [],
) => {
	const paymentPk = PrivateKey.fromWif(payPk);

	// const signer = {
	// 	keyHost: "http://localhost:21000",
	// } as RemoteSigner;

  const destinations: Destination[] = inscriptions.map((inscription) => {
    return {
      address: ordAddress,
      inscription
    }
  });

	const config: CreateOrdinalsConfig = {
		utxos,
		destinations,
		paymentPk,
    metaData,
    additionalPayments,
    changeAddress,
	};

	const { tx, spentOutpoints, payChange } = await createOrdinals(config);
	return { tx, spentOutpoints, payChange };
};
// same as handleBulkInscribing but with data
export const handleBulkInscribingWithData = async (
	payPk: string,
	inscriptions: Inscription[],
	ordAddress: string,
	changeAddress: string,
	fundingUtxos: Utxo[],
	metadata: MAP | undefined,
	payments: Payment[],
) => {
	const paymentPk = PrivateKey.fromWif(payPk);

  // TODO: implement sigma signing
	const signer = {
		keyHost: "http://localhost:21000",
	} as RemoteSigner;

  const config: CreateOrdinalsConfig = {
    utxos: fundingUtxos,
    destinations: inscriptions.map((inscription) => {
      return {
        address: ordAddress,
        inscription
      }
    }),
    paymentPk,
    metaData: metadata,
    additionalPayments: payments,
    changeAddress,
  };
  
	const { tx, spentOutpoints } = await createOrdinals(config);
	// 	fundingUtxos,
	// 	ordAddress,
	// 	paymentPk,
	// 	changeAddress,
	// 	0.05,
	// 	inscriptions,
	// 	metadata, // optional metadata
	// 	undefined,
	// 	why, // payments
	// 	data,
	// );
	return { tx, spentOutpoints };
};

export const inscribeFile = async (
	utxos: Utxo[],
	file: File,
	metadata?: PreMAP,
) => {
	if (!file?.type || !utxos.length) {
		throw new Error("File or utxo not provided");
	}
  if (!payPk.value || !ordAddress.value) {
    throw new Error("Missing payPk or ordAddress");
  }

	//   setInscribeStatus(FetchStatus.Loading);
	try {
		const fileAsBase64 = await readFileAsBase64(file);
		try {
			// setInscribeStatus(FetchStatus.Loading);

			const { tx, spentOutpoints, payChange } = await handleInscribing(
				payPk.value,
				fileAsBase64,
				file.type,
				ordAddress.value,
				utxos,
				metadata,
			);

				const result = {
					rawTx: tx.toHex(),
					size: tx.toBinary().length,
					fee: tx.getFee(),
					numInputs: tx.inputs.length,
					numOutputs: tx.outputs.length,
					txid: tx.id('hex'),
					spentOutpoints,
          payChange,
					metadata,
				} as PendingTransaction;
				console.log(Object.keys(result));

				setPendingTxs([result]);
				//setInscribeStatus(FetchStatus.Success);
				return result;
			
		} catch (e) {
			console.error(e);
			//setInscribeStatus(FetchStatus.Error);
			throw e;
		}
	} catch (e) {
		//setInscribeStatus(FetchStatus.Error);
		toast.error(`Failed to inscribe ${e}`, toastErrorProps);
		console.error(e);
		throw e;
	}
};

export const inscribeUtf8 = async (
	text: string,
	contentType: string,
	utxo: Utxo | Utxo[],
	iterations = 1,
	payments: Payment[] = [],
) => {

  if (!payPk.value || !ordAddress.value || !fundingAddress.value) {
    throw new Error("Missing payPk, ordAddress or fundingAddress");
  }

	const fileAsBase64 = Buffer.from(text).toString("base64");
	// normalize utxo to array
	const utxos = Array.isArray(utxo) ? utxo : [utxo];
	// duplicate inscription * iterations and pass in the array
	let num = iterations;
	const inscriptions: Inscription[] = [];
	while (num--) {
		inscriptions.push({ dataB64: fileAsBase64, contentType });
	}
	const { tx, spentOutpoints, payChange } = await handleBulkInscribing(
		payPk.value,
		inscriptions,
		ordAddress.value,
		fundingAddress.value,
		utxos,
		undefined,
		payments,
	);
	const satsIn = utxos.reduce((acc, utxo) => acc + utxo.satoshis, 0);
	const satsOut = tx.outputs.reduce((acc, output) => acc + (output.satoshis || 0), 0);
	const fee = satsIn - satsOut;
	const result = {
		rawTx: tx.toHex(),
		size: tx.toBinary().length,
		fee,
		numInputs: tx.inputs.length,
		numOutputs: tx.outputs.length,
		txid: tx.id('hex'),
		spentOutpoints,
    payChange,
		iterations,
	} as PendingTransaction;
	setPendingTxs([result]);
	return result;
};
