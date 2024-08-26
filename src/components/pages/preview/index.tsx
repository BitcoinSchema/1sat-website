"use client";

import { API_HOST, FetchStatus, toastProps } from "@/constants";
import { ordUtxos, pendingTxs, usdRate, utxos } from "@/signals/wallet";
import { setPendingTxs } from "@/signals/wallet/client";
import type { PendingTransaction } from "@/types/preview";
import { formatBytes } from "@/utils/bytes";
import * as http from "@/utils/httpClient";
import { Transaction } from "@bsv/sdk";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { oneSatBroadcaster } from "js-1sat-ord";
import { head } from "lodash";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast, { LoaderIcon } from "react-hot-toast";
import { FaCopy } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { toBitcoin } from "satoshi-token";
import { useCopyToClipboard } from "usehooks-ts";

const PreviewPage = () => {
	useSignals();
	const [value, copy] = useCopyToClipboard();
	const router = useRouter();
	const txs = useSignal<PendingTransaction[] | null>(pendingTxs.value);
	const pendingTx = useSignal<PendingTransaction | null>(
		head(txs.value) || null,
	);
  const [loading, setLoading] = useState(true);

	useEffect(() => {
    if(pendingTxs.value?.length) {
      txs.value = pendingTxs.value;
      pendingTx.value = head(txs.value) || null;
      setLoading(false);
    }
	}, [pendingTx, pendingTxs.value, txs]);

	const feeUsd = useMemo(() => {
		if (!pendingTx.value?.fee) {
			return null;
		}
		const fee = pendingTx.value.fee;
		// const feeUsd = fee / 100000000 / 100000000;
		const feeUsd = fee / usdRate.value;
		return feeUsd.toFixed(2);
	}, [pendingTx.value?.fee, usdRate.value]);

	const [broadcastStatus, setBroadcastStatus] = useState<FetchStatus>(
		FetchStatus.Idle,
	);

	const broadcast = useCallback(async () => {
		const tx = pendingTx.value;
		if (!tx) {
			return;
		}
		setBroadcastStatus(FetchStatus.Loading);
		const transaction = Transaction.fromHex(tx.rawTx);
		try {
      const { txid } = await transaction.broadcast(oneSatBroadcaster());
      console.log("Broadcasted", {txid})
			setBroadcastStatus(FetchStatus.Success);

			toast.success("Transaction broadcasted.", toastProps);

			const returnTo = pendingTx.value?.returnTo;
			setPendingTxs(pendingTxs.value?.filter((t) => t.txid !== txid) || []);

			utxos.value = (utxos.value || []).filter(
				(u) => !tx.spentOutpoints.includes(`${u.txid}_${u.vout}`),
			);
			ordUtxos.value = (ordUtxos.value || []).filter(
				(u) => !tx.spentOutpoints.includes(`${u.txid}_${u.vout}`),
			);
			if (returnTo) {
				router.push(returnTo);
			} else {
				router.back();
			}
		} catch {
			setBroadcastStatus(FetchStatus.Error);
		}
	}, [ordUtxos.value, pendingTx.value, pendingTxs.value, router, utxos.value]);

	const change = useMemo(() => {
    if (pendingTx.value?.payChange) {
      console.log({change: pendingTx.value.payChange.satoshis})
      return pendingTx.value.payChange.satoshis
    }
    if (!pendingTx.value?.rawTx) {
			return 0;
		}
    const tx = Transaction.fromHex(pendingTx.value.rawTx)
    const changeOut = tx.outputs.find((o) => o.change)
    console.log({changeOut, pendingTx: pendingTx.value})

		return changeOut?.satoshis || 0;
	}, [pendingTx.value]);

	const usdPrice = useMemo(() => {
		if (!pendingTx.value?.rawTx || !usdRate.value) {
			return null;
		}

		const tx = Transaction.fromHex(pendingTx.value.rawTx);

		let totalOut = 0;
		for (const out of tx.outputs) {
			totalOut += out.satoshis || 0;
		}
		const cost = totalOut - change
		return (cost / usdRate.value).toFixed(2);
	}, [change, pendingTx.value, usdRate.value]);

	return (
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
			<div className="text-center text-[#aaa] mt-2">Broadcast to finalize.</div>
			<div className="w-full max-w-lg mx-auto whitespace-pre-wrap break-all font-mono rounded bg-[#111] text-xs mt-4 mb-8 relative flex">
				<div className="p-2 md:p-6 h-full w-full text-white bg-transparent bottom-0 left-0 bg-gradient-to-t from-black from-60% to-transparent block">
          {loading && <div className="text-center h-full flex items-center justify-center"><Loader2Icon className="animate-spin w-4 h-4 m-auto" /></div>}

					<div className={`${loading ? 'opacity-0': 'opacity-100'} px-2 transition-opacity duration-500`}>
						<div className="flex justify-between">
							<div>{pendingTx.value?.numInputs} Inputs</div>
							<div>{pendingTx.value?.numOutputs} Outputs</div>
						</div>
						<div className="flex justify-between">
							<div>Size</div>
							<div>{pendingTx.value?.rawTx.length ? formatBytes(pendingTx.value?.rawTx.length / 2) : ""}</div>
						</div>
						{(pendingTx.value?.price || 0) > 0 && (
							<div className="flex justify-between">
								<div>Market Price</div>
								<div>{toBitcoin(pendingTx.value?.price || 0)} BSV</div>
							</div>
						)}

						<div className="divider">Network Fees</div>
          
						<div className="flex justify-between">
							<div>Network Fee</div>
							<div>{pendingTx.value?.fee.toLocaleString()} Satoshis</div>
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
										{Object.keys(pendingTx.value?.metadata).map((k) => {
											const v =
												pendingTx.value?.metadata?.[k];
											return (
												<div key={k} className="flex justify-between">
													<div className="mr-2 text-[#555]">{k}</div>
													<div className="ml-2">{v}</div>
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
											: `${toBitcoin(pendingTx.value.marketFee)} BSV`}
									</div>
								</div>
							</>
						) : null}
						{pendingTx.value?.iterations && pendingTx.value?.iterations > 1 && (
							<>
								<div className="divider">Indexing</div>
								<div className="flex justify-between">
									<div>Operations</div> <div>{pendingTx.value.iterations}</div>
								</div>
								<div className="flex justify-between">
									<div>Indexing Fee</div>{" "}
									<div>
										{toBitcoin(pendingTx.value.iterations * 1000)}
										BSV
									</div>
								</div>
							</>
						)}
           
					</div>
					<div className={`${loading ? 'opacity-0': 'opacity-100'} transition-opacity duration-750 divider`} />
					<div className={`${loading ? 'opacity-0': 'opacity-100'} transition-opacity duration-750 mx-auto text-center text-teal-700 mb-2`}>
						{pendingTx.value?.txid}
					</div>

					<div className={`${loading ? 'opacity-0': 'opacity-100'} flex gap-2 items-center justify-between mb-8 transition-opacity duration-1000`}>
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
					<div className={`${loading ? 'opacity-0': 'opacity-100'} transition-opacity duration-3000 items-center justify-center gap-2`}>
						<button
							type="button"
							className="btn btn-warning w-full cursor-pointer disabled:cursor-default"
							onClick={broadcast}
							disabled={loading || usdPrice === null || broadcastStatus === FetchStatus.Loading}
						>
							{broadcastStatus === FetchStatus.Loading
								? "Broadcasting..."
								: `Broadcast ${usdPrice}`}
						</button>
					</div>
				</div>
			</div>
		</>
	);
};

export default PreviewPage;
