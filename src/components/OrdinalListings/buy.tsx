"use client";

import { Button } from "@/components/ui/button";
import type { OrdUtxo } from "@/types/ordinals";
import { useSignal } from "@preact/signals-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { toBitcoin } from "satoshi-token";
import Artifact from "../artifact";
import BuyArtifactModal from "../modal/buyArtifact";
import { getOutpoints } from "./helpers";

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
				media: "bg-card text-center p-0 w-full",
			}}
			artifact={listing}
			sizes={"100vw"}
			showFooter={false}
			showListingTag={false}
			to={`/outpoint/${listing?.outpoint}`}
		/>
	);

	const close = useCallback(() => {
		showBuy.value = false;
	}, [showBuy]);

	return (
		<>
			<Button
				type="button"
				variant="default"
				size="sm"
				onClick={clickBuy}
				className="rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-mono uppercase text-[10px] tracking-widest h-8"
			>
				{toBitcoin(satoshis.toString())} BSV
			</Button>
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
