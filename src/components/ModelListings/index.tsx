"use client";

import { ReturnTypes, toBitcoin } from "satoshi-token";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { OrdUtxo } from "@/types/ordinals";

interface ModelListingsProps {
	listings: OrdUtxo[];
}

const listingName = (listing: OrdUtxo) => {
	if (listing.origin?.data?.bsv20) {
		return listing.origin.data.bsv20.tick;
	}
};

const listingAmount = (listing: OrdUtxo) => {
	if (listing.origin?.data?.bsv20) {
		return listing.origin.data.bsv20.amt;
	}
};

const satsPerModel = (listing: OrdUtxo) => {
	if (listing.origin?.data?.bsv20) {
		const price = listing.data?.list?.price || 0;
		const amt = parseInt(listing.origin.data.bsv20.amt || "0", 10);
		return Math.floor(price / amt);
	}
	return 0;
};

const ModelListings: React.FC<ModelListingsProps> = ({ listings }) => {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Ticker</TableHead>
					<TableHead>Amount</TableHead>
					<TableHead>Sats / Model</TableHead>
					<TableHead>Total Price</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{listings.map((listing) => {
					return (
						<TableRow key={`${listing.txid}-${listing.vout}-${listing.height}`}>
							<TableCell className="truncate text-ellipsis font-medium">
								{listingName(listing)}
							</TableCell>
							<TableCell>{listingAmount(listing)}</TableCell>
							<TableCell>{satsPerModel(listing)}</TableCell>
							<TableCell className="break-normal">
								{toBitcoin(
									listing.data?.list?.price || "0",
									ReturnTypes.String,
								)}{" "}
								BSV
							</TableCell>
						</TableRow>
					);
				})}
			</TableBody>
		</Table>
	);
};

export default ModelListings;
