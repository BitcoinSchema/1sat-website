"use client"

import type { MarketData } from "@/components/pages/TokenMarket/list";
import ListingForm from "@/components/pages/TokenMarket/listingForm";
import { bsv20Utxos, ordUtxos, utxos } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { getBsv20Utxos, getUtxos } from "@/utils/address";
import { useSignals } from "@preact/signals-react/runtime";

interface CreateTokenListingModalProps {
	onClose: () => void;
	ticker: Partial<MarketData>;
	initialPrice?: string;
	open: boolean;
}

const CreateTokenListingModal: React.FC<CreateTokenListingModalProps> = ({
	onClose,
	ticker,
	initialPrice,
	open,
}) => {
	useSignals();

	const listing = {
		tick: "tick",
		pricePer: initialPrice || "0",
	};

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<dialog
			id={`create-token-listing-modal-${listing.tick}`}
			className="modal backdrop-blur"
			open={open}
			onClick={() => onClose()}
		>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<div className="modal-box" onClick={(e) => e.stopPropagation()}>
				<h3 className="font-bold text-lg flex items-center justify-between">
					<span>Listing {ticker.tick || ticker.sym}</span>
					<span className="text-[#555] text-xs tooltip" data-tip="Last Price">{listing.pricePer} sat/token</span>
				</h3>
				<ListingForm
					initialPrice={listing.pricePer}
					ticker={ticker}
					listedCallback={async () => {
						onClose();

						// refresh ord utxos
						if (fundingAddress.value && ordAddress.value) {
							const bu = await getBsv20Utxos(
								ordAddress.value,
								0,
								ticker.id,
							);
							bsv20Utxos.value = (bsv20Utxos.value || []).concat(bu);
							utxos.value = await getUtxos(fundingAddress.value);
						}
					}}
				/>
			</div>
		</dialog>
	);
};

export default CreateTokenListingModal;
