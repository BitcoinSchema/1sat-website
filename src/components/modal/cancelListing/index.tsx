"use client";

import { indexerBuyFee, SATS_PER_KB, toastErrorProps, toastProps } from "@/constants";
import { bsv20Utxos, ordPk, payPk, utxos } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { Listing } from "@/types/bsv20";
import { getUtxos } from "@/utils/address";
import { notifyIndexer } from "@/utils/indexer";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useCallback } from "react";
import toast from "react-hot-toast";
import {
	cancelOrdListings,
	type CancelOrdListingsConfig,
	cancelOrdTokenListings,
	type CancelOrdTokenListingsConfig,
	oneSatBroadcaster,
	TokenType,
	type Utxo,
} from "js-1sat-ord";
import { PrivateKey } from "@bsv/sdk";
import type { OrdUtxo } from "@/types/ordinals";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle } from "lucide-react";

interface CancelListingModalProps {
	onClose: () => void;
	onCancelled: (newOutpoiint: string) => void;
	listing: Listing;
	indexerAddress?: string;
	className?: string;
}

const CancelListingModal: React.FC<CancelListingModalProps> = ({
	onClose,
	onCancelled,
	listing,
	indexerAddress,
	className,
}) => {
	useSignals();
	const cancelling = useSignal(false);

	const cancelBsv20Listing = useCallback(
		async (e: React.MouseEvent) => {
      "use client";

			if (!fundingAddress.value) {
				console.log("funding address not set");
				return;
			}
			cancelling.value = true;
			await getUtxos(fundingAddress.value);

			e.preventDefault();
			console.log("cancel bsv20 listing");
			if (
				!utxos.value ||
				!payPk.value ||
				!ordPk.value ||
				!ordAddress.value ||
				!indexerAddress
			) {
				cancelling.value = false;
				return;
			}

			const id = (listing.tick || listing.id) as string;

			const config: CancelOrdTokenListingsConfig = {
				utxos: utxos.value,
				paymentPk: PrivateKey.fromWif(payPk.value),
				ordPk: PrivateKey.fromWif(ordPk.value),
				listingUtxos: [
					{
						amt: listing.amt,
						id,
						satoshis: 1,
						txid: listing.txid,
						vout: listing.vout,
						script: listing.script,
					},
				],
				additionalPayments: [{ to: indexerAddress, amount: indexerBuyFee }],
				protocol: (listing as Listing).tick ? TokenType.BSV20 : TokenType.BSV21,
				tokenID: id,
				satsPerKb: SATS_PER_KB,
			};

			const { tx, spentOutpoints, tokenChange, payChange } =
				await cancelOrdTokenListings(config);
        console.log({tx: tx.toHex()});
        // const broadcaster = new OneSatBroadcaster(new FetchHttpClient(fetch));
        const response = await tx.broadcast(oneSatBroadcaster());
      console.log({response});
			if (response.status === "success") {
				notifyIndexer(response.txid);
				bsv20Utxos.value =
					bsv20Utxos.value?.filter(
						(u: OrdUtxo) => spentOutpoints.indexOf(`${u.txid}_${u.vout}`) === -1,
					) || [];
				const changeOrdUtxos =
					tokenChange?.map(
						(tc) =>
							({
								satoshis: 1,
								vout: tc.vout,
								script: tc.script,
								txid: tc.txid,
								outpoint: `${tc.txid}_${tc.vout}`,
								accSats: 0,
								height: 0,
								idx: 0,
								sale: false,
							}) as OrdUtxo,
					) || [];
				bsv20Utxos.value = bsv20Utxos.value?.concat(changeOrdUtxos) || [];
				utxos.value =
					(utxos.value?.filter(
						(u: Utxo) => spentOutpoints.indexOf(`${u.txid}_${u.vout}`) === -1,
					) || []).concat(payChange || []);

				console.log("broadcasted tx", { txid: response.txid });
				toast.success("Transaction broadcasted.", toastProps);
				// setPendingTxs(pendingTxs.value?.filter((t) => t.txid !== txid) || []);
				const newOutpoint = `${response.txid}_0`;
				onCancelled(newOutpoint);
			} else if (response.status === "error") {
				console.error(e);
				toast.error(`Error broadcasting transaction. ${response.description}`, toastErrorProps);
			}

			cancelling.value = false;
		},
		[
			fundingAddress.value,
			cancelling,
			utxos.value,
			payPk.value,
			ordPk.value,
			ordAddress.value,
			indexerAddress,
			listing,
			bsv20Utxos.value,
			onCancelled,
		],
	);

	const cancelListing = useCallback(
		async (e: React.MouseEvent) => {
			if (!fundingAddress.value) {
				console.log("funding address not set");
				return;
			}
			cancelling.value = true;

			await getUtxos(fundingAddress.value);

			e.preventDefault();
			console.log("cancel listing");
			if (!utxos.value || !payPk.value || !ordPk.value || !ordAddress.value) {
				cancelling.value = false;
				return;
			}

			const listingUtxos: Utxo[] = [
				{
					satoshis: listing.satoshis,
					txid: listing.txid,
					vout: listing.vout,
					script: listing.script,
				},
			];

			const config: CancelOrdListingsConfig = {
				utxos: utxos.value,
				paymentPk: PrivateKey.fromWif(payPk.value),
				ordPk: PrivateKey.fromWif(ordPk.value),
				listingUtxos,
				satsPerKb: SATS_PER_KB,
			};

			const { tx, spentOutpoints, payChange } = await cancelOrdListings(config);

			const { txid, status } = await tx.broadcast(oneSatBroadcaster());
			if (status === "success") {
				console.log("Broadcasted", { txid });
				notifyIndexer(txid);
				toast.success("Listing canceled.", toastProps);
				const newOutpoint = `${txid}_0`;

				utxos.value = ((utxos.value || []).filter(
					(u) => !spentOutpoints.includes(`${u.txid}_${u.vout}`),
				)).concat(payChange || []);
				onCancelled(newOutpoint);
			} else if (status === "error") {
				toast.error("Error broadcasting transaction.", toastErrorProps);
				return;
			}
			cancelling.value = false;
		},
		[
			fundingAddress.value,
			cancelling,
			utxos.value,
			payPk.value,
			ordPk.value,
			ordAddress.value,
			listing,
			onCancelled,
		],
	);

	return (
		<Dialog open onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="bg-zinc-950 border-zinc-800 rounded-none max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-3 font-mono text-lg uppercase tracking-widest text-zinc-200">
						<XCircle className="w-5 h-5 text-red-500" />
						Cancel Listing
					</DialogTitle>
					<DialogDescription className="font-mono text-sm text-zinc-400">
						Are you sure you want to cancel the listing for{" "}
						<span className="text-zinc-200">{listing.tick || listing.sym || "this ordinal"}</span>?
					</DialogDescription>
				</DialogHeader>

				<DialogFooter className="flex gap-2 pt-4 border-t border-zinc-800">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
					>
						Close
					</Button>
					{listing && (
						<Button
							type="button"
							variant="destructive"
							disabled={cancelling.value}
							onClick={async (e) => {
								if (listing.tick || listing.id) {
									console.log("Cancel BSV20", { listing });
									await cancelBsv20Listing(e);
								} else if (
									!listing.data?.bsv20 &&
									!listing.origin?.data?.bsv20
								) {
									console.log("Cancel Non BSV20 Listing", { listing });
									await cancelListing(e);
								} else {
									console.log("invalid listing", listing);
									toast.error(
										`Something went wrong ${listing.outpoint}`,
										toastErrorProps,
									);
								}
							}}
						>
							{cancelling.value && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
							Cancel Listing
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default CancelListingModal;
