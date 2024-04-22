"use client";

import CancelListingModal from "@/components/modal/cancelListing";
import { ordPk, payPk, pendingTxs, utxos } from "@/signals/wallet";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { Listing } from "@/types/bsv20";
import type { OrdUtxo } from "@/types/ordinals";
import type { PendingTransaction } from "@/types/preview";
import { sendOrdinal, type Utxo } from "@/utils/js-1sat-ord";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { PrivateKey, Script } from "bsv-wasm";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

const OwnerContent = ({ artifact }: { artifact: OrdUtxo }) => {
	useSignals();
	const showCancelModal = useSignal(false);
	const router = useRouter();

	const transferOrdinal = useCallback(
		async (
			e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
			to: string
		) => {
			console.log("transferOrdinal");

			const paymentUtxo = (utxos.value || []).sort(
				(a, b) => b.satoshis - a.satoshis
			)[0];

			const scriptAsm = Script.from_bytes(
				Buffer.from(artifact.script, "base64")
			).to_asm_string();
			const artifactUtxo = {
				txid: artifact.txid,
				vout: artifact.vout,
				satoshis: artifact.satoshis,
				script: scriptAsm,
			} as Utxo;

			if (to === ordAddress.value) {
				console.log("Cannot send to self");
				return;
			}

			if (!payPk.value || !ordPk.value) {
				console.log("No private key");
				return;
			}

			if (!fundingAddress.value) {
				console.log("No funding address");
				return;
			}

			const tx = await sendOrdinal(
				paymentUtxo,
				artifactUtxo,
				PrivateKey.from_wif(payPk.value),
				fundingAddress.value,
				0.05,
				PrivateKey.from_wif(ordPk.value),
				to,
				undefined,
				undefined,
				undefined
			);

			pendingTxs.value = [
				{
					rawTx: tx.to_hex(),
					fee: 0,
					txid: tx.get_id_hex(),
				} as PendingTransaction,
			];

			router.push("/preview");

			return;
		},
		[
			artifact.satoshis,
			artifact.script,
			artifact.txid,
			artifact.vout,
			router,
		]
	);

	return (
		<div>
			<div>Owner Controls</div>

			<button
				type="button"
        className="btn"
				onClick={(e) => {
					const to = window.prompt(
						"Enter the address to send the ordinal to"
					);
					if (!to) {
						return;
					}
					transferOrdinal(e, to);
				}}
			>
				Send Ordinal
			</button>
			{/* <button
				type="button"
				className="btn"
				onClick={() => {
					showCancelModal.value = true;
				}}
			>
				Cancel Listing
			</button> */}

			{showCancelModal.value && (
				<CancelListingModal
					onClose={() => {
						showCancelModal.value = false;
					}}
					onCancelled={() => {
						console.log("listing cancelled");
						showCancelModal.value = false;
					}}
					listing={artifact as Listing}
				/>
			)}
		</div>
	);
};

export default OwnerContent;
