"use client";

import type { OrdUtxo } from "@/types/ordinals";
import { useSignal } from "@preact/signals-react";
import { useCallback, useEffect, useState } from "react";
import { toBitcoin } from "satoshi-token";
import Artifact from "../artifact";
import BuyArtifactModal from "../modal/buyArtifact";
import { getOutpoints } from "./helpers";
import toast from "react-hot-toast";

interface Props {
	satoshis: bigint;
	listing: OrdUtxo;
}

const BuyBtn = ({ satoshis = 0n, listing }: Props) => {
	const showBuy = useSignal(false);
	const [listingWithScript, setListingWithScript] = useState<OrdUtxo>(
		listing,
	);

	const clickBuy = useCallback(() => {
		showBuy.value = true;
	}, [showBuy]);

	useEffect(() => {
		// if the script is missing we have to get it
		if (!listingWithScript.script) {
			getOutpoints([listing.outpoint], true)
				.then((res) => {
					if (res.length) {
						setListingWithScript(res[0]);
					}
				})
				.catch((e) => {
					toast.error("Failed to get listing script");
				});
		}
	}, [listing.outpoint, listingWithScript]);

	const content = (
		<Artifact
			classNames={{
				wrapper: "bg-transparent",
				media: "rounded bg-[#111] text-center p-0 w-full mr-2",
			}}
			artifact={listing}
			sizes={"100vw"}
			showFooter={false}
			priority={false}
			showListingTag={false}
			to={`/outpoint/${listing?.outpoint}`}
		/>
	);

	const close = useCallback(() => {
		showBuy.value = false;
	}, [showBuy]);

	return (
		<>
			<button type="button" className="btn btn-ghost" onClick={clickBuy}>
				{toBitcoin(satoshis.toString())} BSV
			</button>
			{listingWithScript.script && showBuy.value && (
				<BuyArtifactModal
					listing={listingWithScript}
					price={satoshis}
					onClose={close}
					content={content}
					showLicense={false}
				/>
			)}
		</>
	);
};

export default BuyBtn;
