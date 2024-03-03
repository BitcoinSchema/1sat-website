"use client";

import JDenticon from "@/components/JDenticon";
import CancelListingModal from "@/components/modal/cancelListing";
import { ordAddress } from "@/signals/wallet/address";
import { Listing } from "@/types/bsv20";
import { OrdUtxo } from "@/types/ordinals";
import { useSignal, useSignals } from "@preact/signals-react/runtime";

const ListingContent = ({ artifact }: { artifact: OrdUtxo }) => {
	useSignals();
	const showCancelModal = useSignal(false);
	const isOwner = artifact.owner === ordAddress.value;
	return (
		<div>
			<div>Listing</div>
			<div>Owner</div>
			<div>
				<JDenticon hashOrValue={artifact.owner} />
				{artifact.owner} {artifact.owner === ordAddress.value ? "me" : ""}
			</div>
			<div>Price</div>
			<div>{artifact.data?.list?.price}</div>

			{isOwner && (
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
			{showCancelModal.value && (
				<CancelListingModal
					onClose={() => {
						showCancelModal.value = false;
					}}
					listing={artifact as Listing}
				/>
			)}
		</div>
	);
};

export default ListingContent;
