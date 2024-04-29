"use client";

import { OrdUtxo } from "@/types/ordinals";
import { useSignal } from "@preact/signals-react";
import { toBitcoin } from "satoshi-bitcoin-ts";
import Artifact from "../artifact";
import BuyArtifactModal from "../modal/buyArtifact";

interface Props {
	satoshis: bigint;
	listing: OrdUtxo;
}

const BuyBtn = ({ satoshis = 0n, listing }: Props) => {
	const showBuy = useSignal(false);

	const clickBuy = () => {
		showBuy.value = true;
	};

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

	const close = () => {
		showBuy.value = false;
	};

	return (
		<>
			<button type="button" className="btn btn-ghost" onClick={clickBuy}>
				{toBitcoin(satoshis.toString())} BSV
			</button>
			{showBuy.value && (
				<BuyArtifactModal
					listing={listing}
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
