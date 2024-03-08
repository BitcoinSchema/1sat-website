"use client";

import { IODisplay, InputOutpoint } from "@/app/outpoint/[outpoint]/[tab]/page";
import { bsvWasmReady } from "@/signals/wallet";
import { computed, effect, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { P2PKHAddress, PublicKey, Transaction } from "bsv-wasm-web";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
	outputSpends: string[];
	vout: number;
}

const DisplayIO: React.FC<DisplayIOProps> = ({
	rawtx,
	inputOutpoints,
	outputSpends,
	vout,
}) => {
	// Return a React component that calls the add_one method on the wasm module
	useSignals();
	const router = useRouter();
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
						script: `Script: ${outScript.slice(0, 20)}...${outScript.slice(
							-20,
						)}`,
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
				<ul className="rounded bg-gradient-to-b from-[#010101] to-black">
					{ioIns.value?.map((io, i) => {
						const sats = inputOutpoints[io.index].satoshis;
						const itemClass =
							"cursor-pointer p-2 rounded flex gap-2 justify-between p-4 relative hover:bg-neutral/50";
						return (
							<li
								key={i}
								className={itemClass}
								onClick={() => router.push(`/outpoint/${io.txid}_${io.index}`)}
							>
								<span className="text-xl font-mono flex items-center gap-1">
									<FaHashtag />
									{io.index}
								</span>
								<div className="flex w-full">
									{io.address && (
										<JDenticon
											hashOrValue={io.address}
											className="w-10 h-10 mr-2"
										/>
									)}
									<div className="flex flex-col w-full">
										<Link
											className="text-xs flex w-fit items-center"
											target={io.address ? "_blank" : ""}
											href={
												io.address
													? `/activity/${io.address}/ordinals`
													: `https://whatsonchain.com/tx/${io.txid}?output=${io.index}`
											}
										>
											<button
												type="button"
												className={`${
													io.address ? "text-base" : ""
												} btn-outline ${
													io.index === vout ? "text-white" : "text-white/50"
												} rounded font-mono flex items-center px-1 gap-1`}
											>
												{io.address || io.script}
											</button>
										</Link>
										<Link
											className="text-xs w-fit text-[#555]"
											href={`/outpoint/${io.txid}_${io.index}`}
										>
											<button
												type="button"
												className="btn-outline rounded font-mono opacity-50 hover:opacity-100 transition px-1"
											>
												via {truncate(io.txid)} [{io.index}]
											</button>
										</Link>
									</div>
								</div>
								<div className="text-xs font-mono text-nowrap absolute bottom-0 right-0 mb-2 mr-2 text-white/50">
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
			// tailwind gradient to black on bottom
			<ul className="rounded bg-gradient-to-b from-[#010101] to-black">
				{ioOuts.value?.map((io, i) => {
					const sats = io.amount;
					const itemClass = `cursor-pointer p-2 rounded flex gap-2 justify-between p-4 relative ${
						vout === i ? "bg-neutral text-warning" : "hover:bg-neutral/50 "
					}`;
					return (
						<li
							key={i}
							className={itemClass}
							onClick={() => router.push(`/outpoint/${io.txid}_${io.index}`)}
						>
							<span
								className={`text-xl font-mono flex items-center gap-1 ${
									io.index === vout ? "" : ""
								}`}
							>
								<FaHashtag />
								{io.index}
							</span>
							<div className="flex w-full">
								{io.address && (
									<JDenticon
										hashOrValue={io.address}
										className="w-10 h-10 mr-2"
									/>
								)}
								<div className="flex flex-col w-full">
									<Link
										className="text-xs flex w-fit items-center"
										target={io.address ? "_blank" : ""}
										href={
											io.address
												? `/activity/${io.address}/ordinals`
												: `https://whatsonchain.com/tx/${io.txid}?output=${io.index}`
										}
									>
										<button
											type="button"
											className={`${
												io.address ? "text-base" : ""
											} btn-outline ${
												io.index === vout ? "text-white" : "text-white/50"
											} rounded font-mono flex items-center px-1 gap-1`}
										>
											{io.address || io.script}
										</button>
									</Link>
									{outputSpends[io.index] && (
										<Link
											className="text-xs w-fit text-[#555]"
											href={`/outpoint/${outputSpends[io.index]}`}
										>
											<button
												type="button"
												className="btn-outline rounded font-mono opacity-50 hover:opacity-100 transition px-1"
											>
												Spend {truncate(outputSpends[io.index])} [{io.index}]
											</button>
										</Link>
									)}
								</div>
							</div>
							<div className="text-xs font-mono text-nowrap absolute bottom-0 right-0 mb-2 mr-2 text-white/50">
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
						<h2 className="my-4 text-xl font-mono font-semibold">Inputs</h2>
						{inputs}
					</div>
					<div className="flex-1 w-1/2">
						<h2 className="my-4 text-xl font-mono font-semibold">Outputs</h2>
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
