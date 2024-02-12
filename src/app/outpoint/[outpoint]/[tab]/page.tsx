import OutpointHeading from "@/components/pages/outpoint/heading";
import OutpointInscription from "@/components/pages/outpoint/inscription";
import OutpointTimeline from "@/components/pages/outpoint/timeline";
import OutpointToken from "@/components/pages/outpoint/token";
import DisplayIO from "@/components/transaction";
import { OutpointTab } from "@/types/common";
import { Transaction } from "bsv-wasm";
import { Suspense } from "react";
import { FaSpinner } from "react-icons/fa";

type OutpointParams = {
	outpoint: string;
	tab: string;
};

export type IODisplay = {
	address: string;
	index: number;
	txid: string;
	amount: bigint;
};

export type InputOutpoint = {
	script: string;
	satoshis: bigint;
	txid: string;
	vout: number;
};

const Outpoint = async ({ params }: { params: OutpointParams }) => {
	// get tx details
	const txid = params.outpoint.split("_")[0];
	const response = await fetch(
		`https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/hex`,
	);
	const rawTx = await response.text();
	{
		/* TODO: fetch the connected inputs because getting satoshis will fail otherwise */
	}

	// parse the raw tx
	const tx = Transaction.from_hex(rawTx);
	let inputOutpoints: InputOutpoint[] = [];
	const numInputs = tx.get_ninputs();
	for (let i = 0; i < numInputs; i++) {
		const input = tx.get_input(i);
		const txid = input?.get_prev_tx_id_hex()!;
		const vout = input?.get_vout()!;
		// fetch each one
		const spentOutpointResponse = await fetch(
			`https://junglebus.gorillapool.io/v1/txo/get/${txid}_${vout}`,
			{
				headers: {
					Accept: "application/octet-stream",
				},
			},
		);
		const res = await spentOutpointResponse.arrayBuffer();
		const { script, satoshis } = parseOutput(res);

		// const s = Script.fromHex(script).toASM();
		inputOutpoints.push({ script, satoshis, txid, vout });
	}

	const spendResponse = await fetch(
		`https://junglebus.gorillapool.io/v1/txo/spend/${params.outpoint}`,
		{
			headers: {
				Accept: "application/octet-stream",
			},
		},
	);

	// if spendTxid is empty here, this is not spent. if its populated, its a binary txid where it was spent
	const buffer = await spendResponse.arrayBuffer();
	if (!buffer.byteLength) {
		console.log("not spent");
	}
	const spendTxid = Buffer.from(buffer).toString("hex");
	console.log({ spendTxid });

	const content = () => {
		const outpoint = params.outpoint;
		const tab = params.tab as OutpointTab;
		switch (tab as OutpointTab) {
			case OutpointTab.Timeline:
				return <OutpointTimeline outpoint={outpoint} />;
			case OutpointTab.Inscription:
				return <OutpointInscription outpoint={outpoint} />;
			case OutpointTab.Token:
				return <OutpointToken outpoint={outpoint} />;
		}
	};

	return (
		<Suspense fallback={<div className="mx-auto h-full"><FaSpinner className="animate-spin" /></div>}>
			<div className="max-w-6xl mx-auto w-full">
				<div className="flex">
					<OutpointHeading outpoint={params.outpoint} />
				</div>
				<DisplayIO rawtx={rawTx} inputOutpoints={inputOutpoints} />
				{content()}
			</div>
		</Suspense>
	);
};

export default Outpoint;

function parseVarInt(hex: string): [number, string] {
	let len = 1;
	let value = parseInt(hex.substring(0, 2), 16);

	if (value < 0xfd) {
		return [value, hex.substring(2)];
	} else if (value === 0xfd) {
		len = 3;
	} else if (value === 0xfe) {
		len = 5;
	} else {
		len = 9;
	}

	value = parseInt(hex.substring(2, len * 2), 16);
	return [value, hex.substring(len * 2)];
}

function parseOutput(output: ArrayBuffer): {
	satoshis: bigint;
	script: string;
} {
	// Extract the amount (8 bytes) and convert from little-endian format
	const view = new DataView(output);
	const satoshis = view.getBigUint64(0, true); // true for little-endian

	// Convert the rest of the buffer to hex and extract the script
	const hex = Buffer.from(output.slice(8)).toString("hex");
	const [scriptLength, remainingHex] = parseVarInt(hex);
	const script = remainingHex.substring(0, scriptLength * 2);

	return {
		satoshis: satoshis,
		script: script,
	};
}
