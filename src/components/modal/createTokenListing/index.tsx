"use client"

import type { MarketData } from "@/components/pages/TokenMarket/list";
import ListingForm from "@/components/pages/TokenMarket/listingForm";
import { bsv20Utxos, utxos } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import { getBsv20Utxos, getUtxos } from "@/utils/address";
import { useSignals } from "@preact/signals-react/runtime";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

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
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen) onClose();
			}}
		>
			<DialogContent
				className="max-w-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				<DialogHeader className="flex flex-row items-center justify-between space-y-0">
					<DialogTitle>Listing {ticker.tick || ticker.sym}</DialogTitle>
					<span className="text-muted-foreground text-xs">
						Last Price: {listing.pricePer} sat/token
					</span>
				</DialogHeader>
				<Separator />
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
			</DialogContent>
		</Dialog>
	);
};

export default CreateTokenListingModal;
