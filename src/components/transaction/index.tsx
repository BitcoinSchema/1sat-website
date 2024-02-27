"use client";

import { IODisplay, InputOutpoint } from "@/app/outpoint/[outpoint]/[tab]/page";
import { bsvWasmReady } from "@/signals/wallet";
import { computed, effect, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { P2PKHAddress, PublicKey, Transaction } from "bsv-wasm-web";
import Link from "next/link";
import React from "react";
import { FaSpinner } from "react-icons/fa";
import { FaHashtag } from "react-icons/fa6";
import { toBitcoin } from "satoshi-bitcoin-ts";
import JDenticon from "../JDenticon";
import { iterationFee } from "../pages/inscribe/bsv20";
import { showDetails } from "../pages/outpoint/heading";

interface DisplayIOProps {
	rawtx: string;
	inputOutpoints: InputOutpoint[];
}

const DisplayIO: React.FC<DisplayIOProps> = ({ rawtx, inputOutpoints }) => {
	// Return a React component that calls the add_one method on the wasm module
	useSignals();
	const ioIns = useSignal<IODisplay[] | null>(null);
	const ioOuts = useSignal<IODisplay[] | null>(null);
	const attempted = useSignal(false);

	effect(() => {
		const fire = async () => {
			console.log({ rawtx });
			const tx = Transaction.from_hex(rawtx);

			const numInputs = tx.get_ninputs();
			const numOutputs = tx.get_noutputs();
			ioIns.value = [];
			for (let i = 0; i < numInputs; i++) {
				const input = tx.get_input(i)!;
				const inScript = input?.get_unlocking_script()?.to_asm_string();
				const pubKeyHash = inScript?.split(" ")[1]!;
				console.log({ inScript, pubKeyHash });
				const address = P2PKHAddress.from_pubkey(
					PublicKey.from_hex(pubKeyHash),
				).to_string();
				const txid = input.get_prev_tx_id_hex();
				const amount = input.get_satoshis()!;
				ioIns.value.push({ address, index: i, txid, amount });
			}

			ioOuts.value = [];
			for (let i = 0; i < numOutputs; i++) {
				const output = tx.get_output(i)!;
				// decode p2pkh output
				const outScript = output?.get_script_pub_key().to_asm_string();

				if (
					outScript.startsWith("OP_RETURN") ||
					outScript.startsWith("OP_FALSE OP_RETURN")
				) {
					ioOuts.value.push({
						script: "OP_RETURN",
						index: i,
						txid: tx.get_id_hex(),
						amount: BigInt(0),
					});
					continue;
				}
				if (outScript.startsWith("OP_DUP OP_HASH160")) {
					// Look for p2pkh output
					const pubKeyHash = outScript.split(" ")[2];

					const address = P2PKHAddress.from_pubkey_hash(
						Buffer.from(pubKeyHash, "hex"),
					).to_string();

					const index = i;
					const txid = tx.get_id_hex();
					const amount = output.get_satoshis();
					ioOuts.value.push({ address, index, txid, amount });
				} else {
					const amount = output.get_satoshis();
          
					ioOuts.value.push({
            script: `Script: ${outScript.slice(0, 20)}...${outScript.slice(-20)}`,
						index: i,
						txid: tx.get_id_hex(),
						amount,
					});
				}
			}
		};
		if (!attempted.value && rawtx && bsvWasmReady.value) {
			attempted.value = true;
			fire();
		}
	});

	const inputs = computed(() => {
		return (
			ioIns.value && (
				<ul className="border rounded p-2 border-[#1a1a1a] bg-[#111]">
					{ioIns.value?.map((io, i) => {
						const sats = inputOutpoints[io.index].satoshis;

						return (
							<li key={i} className="flex gap-2 justify-between my-2 relative">
								<Link href={`/outpoint/${io.txid}_${io.index}`}>
									<span className="text-xl font-mono flex items-center gap-1">
										<FaHashtag />
										{io.index}
									</span>
								</Link>
								<div className="flex flex-col w-full">
									<Link
										className="text-xs w-fit flex items-center"
										href={`/activity/${io.address}/ordinals`}
									>
										<JDenticon
											hashOrValue={io.address}
											className="w-6 h-6 mr-2"
										/>
										{io.address || io.script}
									</Link>
									<Link
										className="text-xs w-fit text-[#555]"
										href={`/outpoint/${io.txid}_${io.index}`}
									>
										via {truncate(io.txid)} [{io.index}]
									</Link>
								</div>
								<div className="text-xs text-nowrap absolute bottom-0 right-0 text-red-400">
									{sats > BigInt(iterationFee)
										? `${toBitcoin(sats.toString())} BSV`
										: `${sats} sats`}
								</div>
							</li>
						);
					})}
				</ul>
			)
		);
	});

	const outputs = computed(() => {
		return (
			<ul className="border rounded p-2 border-[#1a1a1a] bg-[#111]">
				{ioOuts.value?.map((io, i) => {
					const sats = io.amount;
					return (
						<li key={i} className="flex gap-2 justify-between my-2 relative">
							<Link href={`/outpoint/${io.txid}_${io.index}`}>
								<span className="text-xl font-mono flex items-center gap-1">
									<FaHashtag />
									{io.index}
								</span>
							</Link>
							<div className="flex flex-col w-full">
								<Link
									className="text-xs flex w-fit items-center"
									href={`/activity/${io.address}/ordinals`}
								>
									{io.address && <JDenticon
										hashOrValue={io.address}
										className="w-6 h-6 mr-2"
									/>}
									{io.address || io.script}
								</Link>
								<Link
									className="text-xs w-fit text-[#555]"
									href={`/outpoint/${io.txid}_${io.index}`}
								>
									Spend {truncate(io.txid)} [{io.index}]
								</Link>
							</div>
							<div className="text-xs text-nowrap absolute bottom-0 right-0 text-emerald-400">
								{sats > BigInt(iterationFee)
									? `${toBitcoin(sats.toString())} BSV`
									: `${sats} sats`}
							</div>
						</li>
					);
				})}
			</ul>
		);
	});

	const details = computed(() => {
		return (
			inputs.value &&
			outputs.value && (
				<>
					<div className="flex-1 w-1/2">
						<h2 className="my-4 text-lg">Inputs</h2>
						{inputs}
					</div>
					<div className="flex-1 w-1/2">
						<h2 className="my-4 text-lg">Outputs</h2>
						{outputs}
					</div>
				</>
			)
		);
	});

	if (!details.value) {
		return (
			<div className="mx-auto w-fit py-12 flex items-center font-mono text-sm">
				<FaSpinner className="animate-spin mr-2" /> Loading
			</div>
		);
	}

	return (
		<>
			<div className="flex w-full rounded gap-4 mb-4">
				{showDetails.value && details.value}
			</div>
		</>
	);
};

export default DisplayIO;

const truncate = (str: string) => {
	// does this txid => "123456...9876ab"
	return `${str.slice(0, 6)}...${str.slice(-6)}`;
};
