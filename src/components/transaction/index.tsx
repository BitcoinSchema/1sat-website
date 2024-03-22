"use client";

import { IODisplay, InputOutpoint } from "@/app/outpoint/[outpoint]/[tab]/page";
import { bsvWasmReady } from "@/signals/wallet";
import { computed, effect, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { P2PKHAddress, Transaction } from "bsv-wasm-web";
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
        // This fails sometimes
        // Error: elliptic curve point encoding error
        // example: 2f3f1dee2b87ef7eb0c1079cdaa32b61bc55571c17518e967490e80a85e89f8c_0
        // inScript "01000000000000001976a91417a1d887cdd2f17c693918052f7545cb87f0a83488ac de201500000000001976a91423a515c2179a8929a11b542ad7bd79f37e72142c88aca00f0000000000001976a91434fac3bc0f7678d5b64c3c5e4cb9f83818ccb36388ac 01000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000009cbeaf5b29226ca92d20d27485e811626f0acdd25a4cd040a36c9355c507d0cc00000000fd5c032097dfd76851bf465e8f715593b217714858bbe9570ff3bd5e33840a34e20ff0262102ba79df5f8ae7604a9830f03c7933028186aede0675a16f025dc4f8be8eec0382201008ce7480da41702918d1ec8e6849ba32b4d65b1e40dc669c31a1e6306b266c000014899a7314db82a0211031a0e787c99f71ea2a0f9222a0860100000000001976a914a6ee9bdc37e3341787fa569df2f32b22bad285ed88ac615179547a75537a537a537a0079537a75527a527a7575615579008763567901c161517957795779210ac407f0e4bd44bfc207355a778b046225a7068fc59ee7eda43ad905aadbffc800206c266b30e6a1319c66dc401e5bd6b432ba49688eecd118297041da8074ce081059795679615679aa0079610079517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01007e81517a75615779567956795679567961537956795479577995939521414136d08c5ed2bf3ba048afe6dcaebafeffffffffffffffffffffffffffffff00517951796151795179970079009f63007952799367007968517a75517a75517a7561527a75517a517951795296a0630079527994527a75517a6853798277527982775379012080517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f517f7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e7c7e01205279947f7754537993527993013051797e527e54797e58797e527e53797e52797e57797e0079517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a75517a756100795779ac517a75517a75517a75517a75517a75517a75517a75517a75517a7561517a75517a756169587951797e58797eaa577961007982775179517958947f7551790128947f77517a75517a75618777777777777777777767557951876351795779a9876957795779ac7777777777777777670068680100000000000000ffffffffafb140f2c11a3dba787f2ddf2077f70ff41da4044e3aff0d9eb666e799e9d0d700000000c1000000 0"        // pubKeyHash "de201500000000001976a91423a515c2179a8929a11b542ad7bd79f37e72142c88aca00f0000000000001976a91434fac3bc0f7678d5b64c3c5e4cb9f83818ccb36388ac"
        const address = P2PKHAddress.from_pubkey_hash(
          Buffer.from(pubKeyHash, "hex"),
        ).to_string() || "";
				// const address = P2PKHAddress.from_pubkey(
				// 	PublicKey.from_hex(pubKeyHash),
				// ).to_string();
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
