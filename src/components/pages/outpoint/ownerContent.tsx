"use client";

import JDenticon from "@/components/JDenticon";
import CancelListingModal from "@/components/modal/cancelListing";
import type { Listing } from "@/types/bsv20";
import type { OrdUtxo } from "@/types/ordinals";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { IoSend } from "react-icons/io5";
import { PiCoinLight } from "react-icons/pi";

const OwnerContent = ({ artifact }: { artifact: OrdUtxo }) => {
	useSignals();
	const showCancelModal = useSignal(false);
	const isListing = artifact.data?.list !== undefined;

	return (
		<div>
			<div
				className="mx-auto border border-neutral text-neutral-content mb-4 p-4 rounded flex items-center w-fit gap-2 font-mono tooltip tooltip-right"
				data-tip={artifact.owner}
			>
				<JDenticon hashOrValue={artifact.owner} className="w-8 h-8" /> You own
				this item
			</div>

			<div className="h-64 text-[#AAA] font-mono test-sm">
				This is an inscription. There are many like it, but this one is yours.
				It was created at block height {artifact.origin?.num?.split(":")[0]},
				and acquired by you at block height {artifact.height}.
			</div>

			<div className="flex justify-end gap-2">
				{isListing && (
					<button
						type="button"
						className="btn"
						onClick={() => {
							showCancelModal.value = true;
						}}
					>
						Cancel
					</button>
				)}
				{!isListing && (
					<button type="button" className="btn">
						<PiCoinLight />
						Sell
					</button>
				)}
				<button type="button" className="btn">
					<IoSend /> Send
				</button>
			</div>

			{showCancelModal.value && (
				<CancelListingModal
					onClose={() => {
						showCancelModal.value = false;
					}}
					onCancelled={() => {
						console.log("listing cancelled");
						showCancelModal.value = false;
					}}
					listing={artifact as Listing}
				/>
			)}
		</div>
	);
};

export default OwnerContent;
