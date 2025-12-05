import { SATS_PER_KB, } from "@/constants";
import { notifyIndexer } from "@/utils/indexer";
import type { PrivateKey } from "@bsv/sdk";
import {
	fetchPayUtxos,
	oneSatBroadcaster,
	type Payment,
	sendUtxos,
	type SendUtxosConfig,
} from "js-1sat-ord";

export const sweepUtxos = async (
	paymentPk: PrivateKey,
	fromAddress: string,
	to: string,
) => {
	const utxos = await fetchPayUtxos(fromAddress);
	if (!utxos.length) {
		throw new Error("No utxos to sweep");
	}
	const amount =
		utxos.map((utxo) => utxo.satoshis).reduce((a, b) => a + b, 0) - 1;
	const payments: Payment[] = [
		{
			to,
			amount,
		},
	];
	const config: SendUtxosConfig = {
		utxos,
		paymentPk,
		payments,
		satsPerKb: SATS_PER_KB,
	};
	const { tx } = await sendUtxos(config);
	const { txid, status } = await tx.broadcast(oneSatBroadcaster());
	if (status === "success") {
		console.log("Change sweep:", txid);
		notifyIndexer(txid);
		return amount;
	}
	if (status === "error") {
		throw new Error("Error broadcasting tx");
	}
};
