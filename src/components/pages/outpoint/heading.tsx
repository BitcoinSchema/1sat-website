"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CgClose } from "react-icons/cg";
import { TbGridDots } from "react-icons/tb";
import { Button } from "@/components/ui/button";

const OutpointHeading = ({
	outpoint,
	toggleDetails,
	showing,
}: {
	outpoint: string;
	toggleDetails: () => void;
	showing: boolean;
}) => {
	const txid = outpoint.split("_")[0];

	// useEffect(() => {
	//   console.log({ showDetails: showing });
	// }, [showing]);

	const button = useMemo(() => {
		return showing ? <CgClose /> : <TbGridDots />;
	}, [showing]);

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
				<Button
					size="sm"
					variant="outline"
					className="w-fit"
					onClick={toggleDetails}
				>
					{button}
				</Button>
			</div>
		</>
	);
};

export default OutpointHeading;
