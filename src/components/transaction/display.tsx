"use client";

import type {
	IODisplay,
	InputOutpoint,
} from "@/app/outpoint/[outpoint]/[tab]/page";
import { computed, effect, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type React from "react";
import { FaSpinner } from "react-icons/fa";
import { FaHashtag } from "react-icons/fa6";
import { toBitcoin } from "satoshi-bitcoin-ts";
import { showDetails } from ".";
import JDenticon from "../JDenticon";
import { iterationFee } from "../pages/inscribe/bsv20";
import { Hash, Transaction, Utils } from "@bsv/sdk";
const { toBase58Check } = Utils;
interface DisplayIOProps {
	rawtx?: string;
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
		const fire = async (rawTx: string) => {
			// console.log({ rawtx });
			const tx = Transaction.fromHex(rawTx);

			const numInputs = tx.inputs.length;
			const numOutputs = tx.outputs.length;
			ioIns.value = [];
			for (let i = 0; i < numInputs; i++) {
				const input = tx.inputs[i];
				const inScript = input?.unlockingScript;
				const data = inScript?.chunks[1].data;

				if (!inScript || !data || data.length !== 66) {
					continue;
				}
				const hash = Hash.ripemd160(data);
				const address = toBase58Check(hash);

				const txid = input.sourceTXID as string;
				// TODO: This would need to be looked up.
				const amount = 0; // input.get_satoshis()!;
				ioIns.value.push({ address, index: i, txid, amount });
			}

			ioOuts.value = [];
			for (const [index, output] of tx.outputs.entries()) {
				const outScript = output?.lockingScript.toASM();

				if (
					outScript.startsWith("OP_RETURN") ||
					outScript.startsWith("OP_FALSE OP_RETURN") ||
					outScript.startsWith("0 OP_RETURN")
				) {
					const parts = outScript.slice(0, 25).split(" ");
					const isRun = parts[2] === Buffer.from("run").toString("hex");
					ioOuts.value.push({
						script: isRun ? "Run (OP_RETURN)" : "OP_RETURN",
						index,
						txid: tx.id("hex"),
						amount: output.satoshis || 0,
					});
					continue;
				}
				if (outScript.startsWith("OP_DUP OP_HASH160")) {
					// Look for p2pkh output
					const pubKeyHash = outScript.split(" ")[2];

					const data = output.lockingScript.chunks[1].data;
					if (!data || data.length !== 20) {
						continue;
					}
					const address = toBase58Check(data);
					const txid = tx.id("hex");
					const amount = output.satoshis || 0;
					ioOuts.value.push({ address, index, txid, amount });
				} else {
					const amount = output.satoshis || 0;

					ioOuts.value.push({
						script: `Script: ${outScript.slice(
							0,
							20,
						)}...${outScript.slice(-20)}`,
						index,
						txid: tx.id("hex"),
						amount,
					});
				}
			}
		};
		if (showDetails.value && !attempted.value && rawtx) {
			attempted.value = true;
			fire(rawtx);
		}
	});

	const inputs = computed(() => {
		return (
			inputOutpoints.length > 0 &&
			ioIns.value && (
				<ul className="rounded bg-gradient-to-b from-[#010101] to-black">
					{ioIns.value?.map((io, i) => {
						const sats = inputOutpoints[io.index].satoshis;
						const itemClass =
							"cursor-pointer p-2 rounded flex gap-2 justify-between p-4 relative hover:bg-neutral/50";
						return (
							// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
							<li
								key={`input-${io.txid}-${io.index}`}
								className={itemClass}
								onClick={() => router.push(`/outpoint/${io.txid}_${io.index}`)}
							>
								<span className="md:text-xl font-mono flex items-center gap-1">
									<FaHashtag />
									{io.index}
								</span>
								<div className="flex w-full">
									{io.address && (
										<JDenticon
											hashOrValue={io.address}
											className="w-6 h-6 md:w-10 md:h-10 mr-1 md:mr-2"
										/>
									)}
									<div className="flex flex-col w-full">
										<Link
											className="text-xs flex w-fit items-center"
											target={!io.address ? "_blank" : ""}
											href={
												io.address
													? `/activity/${io.address}/ordinals`
													: `https://whatsonchain.com/tx/${io.txid}?output=${io.index}`
											}
										>
											<button
												type="button"
												className={`${
													io.address ? "md:text-base" : ""
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
						// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
						<li
							key={`output-${io.txid}-${io.index}`}
							className={itemClass}
							onClick={() => router.push(`/outpoint/${io.txid}_${io.index}`)}
						>
							<span
								className={`md:text-xl font-mono flex items-center gap-1 ${
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
										className="w-6 h-6 md:w-10 md:h-10 mr-1 md:mr-2"
									/>
								)}
								<div className="flex flex-col w-full">
									<Link
										className="text-xs flex w-fit items-center"
										target={!io.address ? "_blank" : ""}
										href={
											io.address
												? `/activity/${io.address}/ordinals`
												: `https://whatsonchain.com/tx/${io.txid}?output=${io.index}`
										}
									>
										<button
											type="button"
											className={`${
												io.address ? "md:text-base" : ""
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
					<div className="md:flex-1 md:w-1/2">
						<h2 className="my-4 text-xl font-mono font-semibold">Inputs</h2>
						{inputs}
					</div>
					<div className="md:flex-1 md:w-1/2">
						<h2 className="my-4 text-xl font-mono font-semibold">Outputs</h2>
						{outputs}
					</div>
				</>
			)
		);
	});

	if (!details.value) {
		return (
			<div className="mx-auto w-fit py-12 items-center font-mono text-sm">
				<FaSpinner className="animate-spin mr-2" />
			</div>
		);
	}

	return (
		showDetails.value && (
			<>
				<div className="w-full rounded gap-4 mb-4 flex-col md:flex-row flex overflow-x-auto">
					{details.value}
				</div>
			</>
		)
	);
};

export default DisplayIO;

export const truncate = (str?: string) => {
	// does this txid => "123456...9876ab"
	return str ? `${str.slice(0, 6)}...${str.slice(-6)}` : "";
};
