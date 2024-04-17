"use client";

import OutpointCollection from "@/components/pages/outpoint/collection";
import OutpointHeading from "@/components/pages/outpoint/heading";
import OutpointInscription from "@/components/pages/outpoint/inscription";
import OutpointListing from "@/components/pages/outpoint/listing";
import OutpointTimeline from "@/components/pages/outpoint/timeline";
import OutpointToken from "@/components/pages/outpoint/token";
import DisplayIO from "@/components/transaction";
import { API_HOST } from "@/constants";
import { OutpointTab } from "@/types/common";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "bsv-wasm";
import Head from "next/head";
import { Suspense } from "react";
import { FaSpinner } from "react-icons/fa";

type OutpointParams = {
	outpoint: string;
	tab: string;
};

export type IODisplay = {
	address?: string;
	script?: string;
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

const Outpoint = ({ params }: { params: OutpointParams }) => {
	// get tx details
	const parts = params.outpoint.split("_");
	const txid = parts[0];
	const vout = parts.length > 1 ? parts[1] : "0";

	const { data: rawTx, isLoading: isLoadingRawTx } = useQuery({
		queryKey: ["tx", txid],
		queryFn: async () => {
			const response = await fetch(
				`https://api.whatsonchain.com/v1/bsv/main/tx/${txid}/hex`
			);

			const rawTx = await response.text();
			return rawTx;
		},
		staleTime: 1000 * 60 * 5,
	});
	{
		/* TODO: fetch the connected inputs because getting satoshis will fail otherwise */
	}

	// parse the raw tx

	const { data: inputOutpoints, isLoading: isLoadingInputOutpoints } =
		useQuery({
			queryKey: ["tx", txid, "inputs"],
			queryFn: async () => {
				if (!rawTx) {
					return [];
				}

				const tx = Transaction.from_hex(rawTx);
				const inputOutpoints: InputOutpoint[] = [];
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
						}
					);
					const res = await spentOutpointResponse.arrayBuffer();
					const { script, satoshis } = parseOutput(res);

					// const s = Script.fromHex(script).toASM();
					inputOutpoints.push({ script, satoshis, txid, vout });
				}

				return inputOutpoints;
			},
			enabled: !!rawTx,
			staleTime: 1000 * 60 * 5,
		});

	// get output outpoints
	const { data: outputOutpoints, isLoading: isLoadingOutputOutpoints } =
		useQuery({
			queryKey: ["tx", txid, "outputs"],
			queryFn: async () => {
				if (!rawTx) {
					return [];
				}

				const tx = Transaction.from_hex(rawTx);
				const outputOutpoints: string[] = [];
				const numOutputs = tx.get_noutputs();
				for (let i = 0; i < numOutputs; i++) {
					outputOutpoints.push(`${txid}_${i}`);
				}

				return outputOutpoints;
			},
			enabled: !!rawTx,
			staleTime: 1000 * 60 * 5,
		});

	const { data: outputSpends, isLoading: isLoadingOutputSpends } = useQuery({
		queryKey: ["tx", txid, "spends"],
		queryFn: async () => {
			if (!outputOutpoints) {
				return [];
			}

			const outputSpendsResponse = await fetch(`${API_HOST}/api/spends`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
				},
				body: JSON.stringify(outputOutpoints),
			});

			const outputSpends = await outputSpendsResponse.json();
			return outputSpends;
		},
		enabled: !!outputOutpoints,
		staleTime: 1000 * 60 * 5,
	});

	const { data: spendTxid } = useQuery({
		queryKey: ["tx", txid, "spend"],
		queryFn: async () => {
			if (!outputOutpoints) {
				return "";
			}

			const spendResponse = await fetch(
				`https://junglebus.gorillapool.io/v1/txo/spend/${txid}_${vout}`,
				{
					headers: {
						Accept: "application/octet-stream",
					},
				}
			);
			// if spendTxid is empty here, this is not spent. if its populated, its a binary txid where it was spent
			const buffer = await spendResponse.arrayBuffer();
			const spendTxid = Buffer.from(buffer).toString("hex");
			return spendTxid;
		},
		enabled: !!outputOutpoints,
		staleTime: 1000 * 60 * 5,
	});

	// check if outputs are spent
	console.log({ outputOutpoints, outputSpends });

	console.log({ spendTxid });

	const content = () => {
		const outpoint = `${txid}_${vout}`;
		const tab = params.tab as OutpointTab;
		switch (tab as OutpointTab) {
			case OutpointTab.Timeline:
				return <OutpointTimeline outpoint={outpoint} />;
			case OutpointTab.Inscription:
				return <OutpointInscription outpoint={outpoint} />;
			case OutpointTab.Token:
				return <OutpointToken outpoint={outpoint} />;
			case OutpointTab.Listing:
				return <OutpointListing outpoint={outpoint} />;
			case OutpointTab.Collection:
				return <OutpointCollection outpoint={outpoint} />;
		}
	};

	const isLoading =
		isLoadingRawTx ||
		isLoadingInputOutpoints ||
		isLoadingOutputSpends ||
		isLoadingOutputOutpoints;

	return (
		<>
			<Head>
				<meta property="og:image" content="<generated>" />
				<meta
					property="og:image:alt"
					content={`Outpoint ${txid}_${vout}`}
				/>
				<meta property="og:image:type" content="image/png" />
				<meta property="og:image:width" content="1200" />
				<meta property="og:image:height" content="630" />
			</Head>

			{isLoading ? (
				<div className="mx-auto h-full">
					<FaSpinner className="animate-spin" />
				</div>
			) : (
				<div className="max-w-6xl mx-auto w-full">
					<div className="flex">
						<OutpointHeading outpoint={`${txid}_${vout}`} />
					</div>
					<DisplayIO
						rawtx={rawTx}
						inputOutpoints={inputOutpoints}
						outputSpends={outputSpends}
						vout={parseInt(vout)}
					/>
					{content()}
				</div>
			)}
		</>
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
