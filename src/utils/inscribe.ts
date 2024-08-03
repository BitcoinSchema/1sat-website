"use client";

import { toastErrorProps } from "@/constants";
import { payPk, pendingTxs } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { PendingTransaction } from "@/types/preview";
import {
	createOrdinal,
	createOrdinalWithData,
	type Inscription,
	type MAP,
	type Payment,
	type RemoteSigner,
	type Utxo,
} from "@/utils/js-1sat-ord";
import toast from "react-hot-toast";
import { readFileAsBase64 } from "./file";
import { setPendingTxs } from "@/signals/wallet/client";
import { PrivateKey } from "@bsv/sdk";

export const handleInscribing = async (
	payPk: string,
	fileAsBase64: string,
	fileContentType: string,
	ordAddress: string,
	changeAddress: string,
	fundingUtxo: Utxo,
	metadata?: MAP, // MAP,
	payments: Payment[] = [],
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
	console.log("Inscribing with", { metadata });
	const signer = {
		// idKey // optional id key
		keyHost: "http://localhost:21000",
	} as RemoteSigner;

	const { spentOutpoints, tx } = await createOrdinal(
		[fundingUtxo],
		ordAddress,
		paymentPk,
		changeAddress,
		0.05,
		[inscription],
		metadata, // optional metadata
		undefined,
		payments,
	);
	return { spentOutpoints, tx };
};

// same as haleInscribing but takes multiple utxos and multiple inscriptions
export const handleBulkInscribing = async (
	payPk: string,
	inscriptions: Inscription[],
	ordAddress: string,
	changeAddress: string,
	fundingUtxos: Utxo[],
	metadata?: MAP,
	payments: Payment[] = [],
) => {
	const why = payments;
	const paymentPk = PrivateKey.from_wif(payPk);

	const signer = {
		keyHost: "http://localhost:21000",
	} as RemoteSigner;

	const { tx, spentOutpoints } = await createOrdinal(
		fundingUtxos,
		ordAddress,
		paymentPk,
		changeAddress,
		0.05,
		inscriptions,
		metadata, // optional metadata
		undefined,
		why, // payments
	);
	return { tx, spentOutpoints }
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
	data: StringOrBufferArray,
) => {
	const why = payments;
	const paymentPk = PrivateKey.from_wif(payPk);

	const signer = {
		keyHost: "http://localhost:21000",
	} as RemoteSigner;

	const { tx, spentOutpoints } = await createOrdinalWithData(
		fundingUtxos,
		ordAddress,
		paymentPk,
		changeAddress,
		0.05,
		inscriptions,
		metadata, // optional metadata
		undefined,
		why, // payments
		data,
	);
	return { tx, spentOutpoints };
};

export const inscribeFile = async (utxo: Utxo, file: File, metadata?: any) => {
	if (!file?.type || !utxo) {
		throw new Error("File or utxo not provided");
	}

	//   setInscribeStatus(FetchStatus.Loading);
	try {
		const fileAsBase64 = await readFileAsBase64(file);
		try {
			// setInscribeStatus(FetchStatus.Loading);

			const { tx, spentOutpoints } = await handleInscribing(
				payPk.value!,
				fileAsBase64,
				file.type,
				ordAddress.value!,
				fundingAddress.value!,
				utxo,
				metadata,
			);
			const satsIn = utxo!.satoshis;
			const satsOut = Number(tx.satoshis_out());
			if (satsIn && satsOut) {
				const fee = satsIn - satsOut;
				if (fee < 0) {
					console.error("Fee inadequate");
					toast.error("Fee Inadequate", toastErrorProps);
					// setInscribeStatus(FetchStatus.Error);
					throw new Error("Fee inadequate");
				}
				const result = {
					rawTx: tx.to_hex(),
					size: tx.get_size(),
					fee,
					numInputs: tx.get_ninputs(),
					numOutputs: tx.get_noutputs(),
					txid: tx.get_id_hex(),
					spentOutpoints,
					metadata,
				} as PendingTransaction;
				console.log(Object.keys(result));

				setPendingTxs([result]);
				//setInscribeStatus(FetchStatus.Success);
				return result;
			}
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
	const why = payments;
	const fileAsBase64 = Buffer.from(text).toString("base64");
	// normalize utxo to array
	const utxos = Array.isArray(utxo) ? utxo : [utxo];
	// duplicate inscription * iterations and pass in the array
	let num = iterations;
	const inscriptions: Inscription[] = [];
	while (num--) {
		inscriptions.push({ dataB64: fileAsBase64, contentType });
	}
	const { tx, spentOutpoints } = await handleBulkInscribing(
		payPk.value!,
		inscriptions,
		ordAddress.value!,
		fundingAddress.value!,
		utxos,
		undefined,
		why, // payments
	);
	const satsIn = utxos.reduce((acc, utxo) => acc + utxo.satoshis, 0);
	const satsOut = Number(tx.satoshis_out());
	const fee = satsIn - satsOut;
	const result = {
		rawTx: tx.to_hex(),
		size: tx.get_size(),
		fee,
		numInputs: tx.get_ninputs(),
		numOutputs: tx.get_noutputs(),
		txid: tx.get_id_hex(),
		spentOutpoints,
		iterations,
	} as PendingTransaction;
	setPendingTxs([result]);
	return result;
};
export type StringOrBufferArray = (string | Buffer)[];

export const inscribeUtf8WithData = async (
	text: string,
	contentType: string,
	utxo: Utxo | Utxo[],
	iterations: number | undefined,
	payments: Payment[] | undefined,
	data: StringOrBufferArray,
	returnTo?: string,
) => {
	const why = payments;
	const fileAsBase64 = Buffer.from(text).toString("base64");
	// normalize utxo to array
	const utxos = Array.isArray(utxo) ? utxo : [utxo];
	// duplicate inscription * iterations and pass in the array
	let num = iterations || 1;
	const inscriptions: Inscription[] = [];
	while (num--) {
		inscriptions.push({ dataB64: fileAsBase64, contentType });
	}
	const { spentOutpoints, tx } = await handleBulkInscribingWithData(
		payPk.value!,
		inscriptions,
		ordAddress.value!,
		fundingAddress.value!,
		utxos,
		undefined,
		why || [], // payments
		data,
	);
	const satsIn = utxos.reduce((acc, utxo) => acc + utxo.satoshis, 0);
	const satsOut = Number(tx.satoshis_out());
	const fee = satsIn - satsOut;
	const result = {
		rawTx: tx.to_hex(),
		size: tx.get_size(),
		fee,
		numInputs: tx.get_ninputs(),
		numOutputs: tx.get_noutputs(),
		txid: tx.get_id_hex(),
		spentOutpoints,
		iterations,
	} as PendingTransaction;
	if (returnTo) {
		result.returnTo = returnTo;
	}
	setPendingTxs([result]);
	return result;
};
