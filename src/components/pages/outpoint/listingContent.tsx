"use client";

import JDenticon from "@/components/JDenticon";
import CancelListingModal from "@/components/modal/cancelListing";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { Listing } from "@/types/bsv20";
import { OrdUtxo } from "@/types/ordinals";
import { useSignal, useSignals } from "@preact/signals-react/runtime";

const ListingContent = ({ artifact }: { artifact: OrdUtxo }) => {
	useSignals();
  const showCancelModal = useSignal(false);
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
      
      <button type="button" className="btn" onClick={() => {
        showCancelModal.value = true;
      }}>Cancel</button>
      {showCancelModal.value && <CancelListingModal onClose={
        () => {
          showCancelModal.value = false;
        }
      } listing={artifact as Listing} indexerAddress={fundingAddress.value || ""} />}
		</div>
	);
};

export default ListingContent;
