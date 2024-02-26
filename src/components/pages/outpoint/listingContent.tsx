"use client";

import JDenticon from "@/components/JDenticon";
import { ordAddress } from "@/signals/wallet/address";
import { OrdUtxo } from "@/types/ordinals";
import { useSignals } from "@preact/signals-react/runtime";

const ListingContent = ({ artifact }: { artifact: OrdUtxo }) => {
	useSignals();

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
      <button type="button" className="btn">Cancel</button>
		</div>
	);
};

export default ListingContent;
