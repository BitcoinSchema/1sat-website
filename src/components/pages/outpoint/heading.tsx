"use client";

import { Signal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import Link from "next/link";
import { CgClose } from "react-icons/cg";
import { TbGridDots } from "react-icons/tb";

export const showDetails = new Signal<boolean>(true);

const OutpointHeading = ({ outpoint }: { outpoint: string }) => {
	useSignals();
	const toggleDetails = () => {
		showDetails.value = !showDetails.value;
	};
	const txid = outpoint.split("_")[0];
	return (
		<>
			<div className="mb-4 w-full">
				<h1 className="text-[#aaa] text-xl">Transaction</h1>
				<Link
					className="text-xs font-mono text-[#555]"
					href={`https://whatsonchain.com/tx/${txid}`}
					target="_blank"
				>
					{txid}
				</Link>
			</div>
			<div className=" cursor-pointer hover:text-blue-400 flex justify-end w-full text-sm text-[#555]">
				<div className="btn btn-sm flex items-center w-fit" onClick={toggleDetails}>
					{!showDetails.value ? (
						<TbGridDots className="w-12" />
					) : (
						<CgClose className="w-12" />
					)}
				</div>
			</div>
		</>
	);
};

export default OutpointHeading;
