"use client";

import { API_HOST, FetchStatus, toastProps } from "@/constants";
import { pendingTxs, usdRate } from "@/signals/wallet";
import { fundingAddress } from "@/signals/wallet/address";
import { PendingTransaction } from "@/types/preview";
import { formatBytes } from "@/utils/bytes";
import * as http from "@/utils/httpClient";
import { computed, effect } from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { P2PKHAddress, Transaction } from "bsv-wasm-web";
import { head } from "lodash";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaCopy } from "react-icons/fa";
import { toBitcoin } from "satoshi-bitcoin-ts";
import { useCopyToClipboard } from "usehooks-ts";

const PreviewPage = () => {
	useSignals();
	const [value, copy] = useCopyToClipboard();
	const router = useRouter();
	const txs = useSignal<PendingTransaction[] | null>(pendingTxs.value);
	const pendingTx = useSignal<PendingTransaction | null>(
		head(txs.value) || null
	);

	effect(() => {
		txs.value = pendingTxs.value;
		pendingTx.value = head(txs.value) || null;
	});

	const feeUsd = computed(() => {
		if (!pendingTx.value?.fee) {
			return null;
		}
		const fee = pendingTx.value.fee;
		// const feeUsd = fee / 100000000 / 100000000;
		const feeUsd = fee / usdRate.value;
		return feeUsd.toFixed(2);
	});

	const [broadcastStatus, setBroadcastStatus] = useState<FetchStatus>(
		FetchStatus.Idle
	);
	
	const broadcast = useCallback(async () => {
		const tx = pendingTx.value;
		if (!tx) {
			return;
		}
		setBroadcastStatus(FetchStatus.Loading);
		const rawtx = Buffer.from(tx.rawTx, "hex").toString("base64");
		try {
			const { promise } = http.customFetch<string>(`${API_HOST}/api/tx`, {
				method: "POST",
				body: JSON.stringify({
					rawtx,
				}),
			});
			await promise;
			setBroadcastStatus(FetchStatus.Success);

			toast.success("Transaction broadcasted.", toastProps);

			const returnTo = pendingTx.value?.returnTo;
			pendingTxs.value =
				pendingTxs.value?.filter((t) => t.txid !== tx.txid) || [];

			if (returnTo) {
				router.push(returnTo);
			} else {
				router.back();
			}
		} catch {
			setBroadcastStatus(FetchStatus.Error);
		}
	}, [pendingTx.value, router, setBroadcastStatus]);

	const change = computed(() => {
		if (!pendingTx.value?.numOutputs) {
			return 0n;
		}
		const tx = Transaction.from_hex(pendingTx.value?.rawTx);
		// find the output going back to the fundingAddress
		// iterate pendingTx.value?.numOutputs times
		let totalChange = 0n;
		for (let i = 0; i < pendingTx.value?.numOutputs; i++) {
			const out = tx.get_output(i);
			const pubKeyHash = out
				?.get_script_pub_key()
				.to_asm_string()
				.split(" ")[2]!;

			if (pubKeyHash.length !== 40) {
				continue;
			}

			const address = P2PKHAddress.from_pubkey_hash(
				Buffer.from(pubKeyHash, "hex")
			).to_string();
			if (address === fundingAddress.value) {
				totalChange += out?.get_satoshis()!;
			}
		}
		return totalChange;
	});

	const usdPrice = computed(() => {
		if (!pendingTx.value?.rawTx || !usdRate.value) {
			return null;
		}

		const tx = Transaction.from_hex(pendingTx.value.rawTx);
		const numOutputs = pendingTx.value.numOutputs;
		let totalOut = 0n;
		for (let i = 0; i < numOutputs; i++) {
			const out = tx.get_output(i)!;
			totalOut += out.get_satoshis()!;
		}
		const cost = Number(totalOut - change.value);
		return (cost / usdRate.value).toFixed(2);
	});

	// useEffect(() => {
	// 	console.log({ usdPrice: usdPrice.value, change: change.value });
	// }, [usdPrice.value, change.value]);

	const content = computed(() => (
		<>
			<h1 className="text-center text-2xl">
				{`${
					pendingTx.value?.numOutputs === 1
						? "Refund"
						: pendingTx.value?.numOutputs === 2 &&
						  pendingTx.value?.numInputs === 2
						? "Transfer"
						: "Inscription"
				}
Preview`}
			</h1>
			<div className="text-center text-[#aaa] mt-2">
				Broadcast to finalize.
			</div>
			<div className="w-full max-w-lg mx-auto whitespace-pre-wrap break-all font-mono rounded bg-[#111] text-xs mt-4 mb-8 relative">
				<div className="p-2 md:p-6 h-full w-full text-white bg-transparent bottom-0 left-0 bg-gradient-to-t from-black from-60% to-transparent block">
					<div className="px-2">
						<div className="flex justify-between">
							<div>{pendingTx.value?.numInputs} Inputs</div>
							<div>{pendingTx.value?.numOutputs} Outputs</div>
						</div>
						<div className="flex justify-between">
							<div>Size</div>
							<div>
								{formatBytes(
									pendingTx.value?.rawTx.length! / 2
								)}
							</div>
						</div>
						{(pendingTx.value?.price || 0) > 0 && (
							<div className="flex justify-between">
								<div>Market Price</div>
								<div>
									{toBitcoin(pendingTx.value?.price || 0)} BSV
								</div>
							</div>
						)}

						<div className="divider">Network Fees</div>
						<div className="flex justify-between">
							<div>Network Fee</div>
							<div>
								{pendingTx.value?.fee.toLocaleString()} Satoshis
							</div>
						</div>
						<div className="flex justify-between">
							<div>Network Fee USD</div>
							<div>${feeUsd}</div>
						</div>
						{pendingTx.value?.fee && (
							<div className="flex justify-between">
								<div>Fee Rate</div>
								<div>
									{(
										pendingTx.value.fee /
										(pendingTx.value.rawTx?.length / 2)
									).toFixed(5)}{" "}
									sat/B
								</div>
							</div>
						)}
						{pendingTx.value?.metadata && (
							<>
								<div className="divider">MetaData</div>
								<div className="flex justify-between">
									<div>Metadata</div>
									<div>
										{Object.keys(
											pendingTx.value?.metadata
										).map((k) => {
											const v =
												pendingTx.value?.metadata &&
												pendingTx.value.metadata[k];
											return (
												<div
													key={k}
													className="flex justify-between"
												>
													<div className="mr-2 text-[#555]">
														{k}
													</div>
													<div className="ml-2">
														{v}
													</div>
												</div>
											);
										})}
									</div>
								</div>
							</>
						)}
						{pendingTx.value?.marketFee ? (
							<>
								<div className="divider">Market</div>
								<div className="flex justify-between">
									<div>Market Fee (4%)</div>
									<div>
										{pendingTx.value.marketFee <= 50000
											? `${pendingTx.value.marketFee.toLocaleString()} Satoshis`
											: `${toBitcoin(
													pendingTx.value.marketFee
											  )} BSV`}
									</div>
								</div>
							</>
						) : null}
						{pendingTx.value?.iterations &&
							pendingTx.value?.iterations > 1 && (
								<>
									<div className="divider">Indexing</div>
									<div className="flex justify-between">
										<div>Operations</div>{" "}
										<div>{pendingTx.value.iterations}</div>
									</div>
									<div className="flex justify-between">
										<div>Indexing Fee</div>{" "}
										<div>
											{toBitcoin(
												pendingTx.value.iterations *
													1000
											)}
											BSV
										</div>
									</div>
								</>
							)}
					</div>
					<div className="divider" />
					<div className="mx-auto text-center text-teal-700 mb-2">
						{pendingTx.value?.txid}
					</div>

					<div className="flex gap-2 items-center justify-between mb-8">
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
						<div
							className="cursor-pointer w-full rounded bg-[#222] border flex items-center justify-center text-center text-[9px] md:text-[11px] text-[#aaa] border-[#333] py-2 relative"
							onClick={async () => {
								if (pendingTx.value?.txid) {
									toast.success("Copied txid", toastProps);
									await copy(pendingTx.value.txid);
								}
							}}
						>
							TxID <FaCopy className="absolute right-0 mr-2" />
						</div>
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
						<div
							className="cursor-pointer w-full rounded bg-[#222] border flex items-center justify-center text-center text-[9px] md:text-[11px] text-[#aaa] border-[#333] py-2 relative"
							onClick={async () => {
								if (pendingTx.value?.rawTx) {
									toast.success("Copied Raw TX", toastProps);
									await copy(pendingTx.value.rawTx);
								}
							}}
						>
							Raw TX <FaCopy className="absolute right-0 mr-2" />
						</div>
					</div>
					<div className="items-center justify-center gap-2">
						<button
							type="button"
							className="btn btn-warning w-full"
							onClick={broadcast}
							disabled={broadcastStatus === FetchStatus.Loading}
						>
							{broadcastStatus === FetchStatus.Loading
								? "Broadcasting..."
								: `Broadcast ${usdPrice}`}
						</button>
					</div>
				</div>
			</div>
		</>
	));

	return content;
};

export default PreviewPage;
