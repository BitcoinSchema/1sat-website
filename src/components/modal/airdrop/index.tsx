"use client";

import type {
	CombinedHolder,
	Holder,
} from "@/components/pages/TokenMarket/list";
import { Meteors } from "@/components/ui/meteors";
import {
	API_HOST,
	AssetType,
	FetchStatus,
	MARKET_API_HOST,
	toastErrorProps,
} from "@/constants";
import { ordPk, payPk, pendingTxs, utxos } from "@/signals/wallet";
import { PrivateKey, Script } from "@bsv/sdk";
import { fundingAddress, ordAddress } from "@/signals/wallet/address";
import type { Ticker } from "@/types/bsv20";
import type { BSV20TXO } from "@/types/ordinals";
import type { PendingTransaction } from "@/types/preview";
import * as http from "@/utils/httpClient";
import { TokenType } from "js-1sat-ord";
import type {
	Distribution,
	Payment,
	TokenUtxo,
	TransferOrdTokensConfig,
	Utxo,
} from "js-1sat-ord";
import { transferOrdTokens } from "js-1sat-ord";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { toBitcoin } from "satoshi-bitcoin-ts";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaQuestion } from "react-icons/fa";
import { find } from "lodash";

interface TransferModalProps {
	onClose: () => void;
	amount?: number;
	address?: string;
	type: AssetType;
	dec: number;
	id: string;
	balance: number;
	sym?: string;
	open: boolean;
}

type Destination = {
	address: string;
	amt?: number | string;
	pct?: number;
	receiveAmt: number;
};

enum Allocation {
	Equal = "equal",
	Weighted = "weighted",
}

type AllocationOption = {
	value: Allocation;
	label: string;
};

const ALLOCATION_OPTIONS: AllocationOption[] = [
	{
		value: Allocation.Equal,
		label: "Equal",
	},
	{
		value: Allocation.Weighted,
		label: "Weighted",
	},
];

const AirdropTokensModal: React.FC<TransferModalProps> = ({
	type,
	balance,
	sym,
	id,
	amount: amt,
	dec,
	address: addr,
	onClose,
	open = false,
}) => {
	useSignals();
	const router = useRouter();
	const airdroppingStatus = useSignal<FetchStatus>(FetchStatus.Idle);
	const amount = useSignal(amt?.toString() || "0");
	const addresses = useSignal<string>(addr || "");
	const excludeAdresses = useSignal<string>("");
	const destinationTickers = useSignal("");
	const destinationBsv21Ids = useSignal("");
	const numOfHolders = useSignal("25");
	const allocation = useSignal<Allocation>(Allocation.Equal);
	const isEqualAllocation = allocation.value === Allocation.Equal;
	const reviewMode = useSignal(false);
	const destinations = useSignal<Destination[]>([]);
	const changeTokenAmount = useSignal(0);
	const indexingFees = useSignal(0);

	const setAmountToBalance = useCallback(() => {
		amount.value = balance.toString();
		console.log(amount.value);
	}, [amount, balance]);

	const handleReview = useCallback(
		async (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			reviewMode.value = true;
		},
		[reviewMode],
	);

	const airdropBsv20 = useCallback(
		async (
			sendAmount: number,
			paymentUtxos: Utxo[],
			inputTokens: TokenUtxo[],
			paymentPk: PrivateKey,
			changeAddress: string,
			ordPk: PrivateKey,
			ordAddress: string,
			ticker: Ticker,
			additionalAddresses: string
			excludeAdresses: string
		): Promise<PendingTransaction> => {
			console.log({
				destinationBsv21Ids: destinationBsv21Ids.value,
				destinationTickers: destinationTickers.value,
				numOfHolders: numOfHolders.value,
				isEqualAllocation,
				sendAmount,
				ticker,
				paymentUtxos,
				inputTokens,
				paymentPk,
				changeAddress,
				ordPk,
				ordAddress,
			});
			// totals for airdrop review
			indexingFees.value = 0;
			changeTokenAmount.value = 0;

			if (
				destinationTickers.value.length === 0 &&
				destinationBsv21Ids.value.length === 0
			) {
				toast.error("No destinations found", toastErrorProps);
				throw new Error("No destinations found");
			}
			let distributions: Distribution[] = [];
			if (isEqualAllocation) {
				distributions = await calculateEqualDistributions(
					sendAmount,
					destinationTickers.value,
					destinationBsv21Ids.value,
					Number.parseInt(numOfHolders.value),
					additionalAddresses,
					excludeAdresses
				);
			} else {
				distributions = await calculateWeightedDistributions(
					sendAmount,
					destinationTickers.value,
					destinationBsv21Ids.value,
					Number.parseInt(numOfHolders.value),
					additionalAddresses,
					excludeAdresses
				);
			}

			// Update the destinations signal
			destinations.value = distributions.map((d) => ({
				address: d.address,
				receiveAmt: Number(d.amt),
			}));

			console.log({ distributions, destinations: destinations.value });

			const indexerAddress = ticker.fundAddress;
			const additionalPayments: Payment[] = [
				{
					to: indexerAddress,
					amount: 1000 * (distributions.length + 1),
				},
			];

			const transferConfig: TransferOrdTokensConfig = {
				inputTokens,
				paymentPk,
				ordPk,
				distributions,
				protocol: ticker.tick ? TokenType.BSV20 : TokenType.BSV21,
				tokenID: (ticker.tick || ticker.id) as string,
				utxos: paymentUtxos,
				additionalPayments,
				changeAddress,
				tokenChangeAddress: ordAddress,
			};

			const { tx, spentOutpoints, payChange, tokenChange } =
				await transferOrdTokens(transferConfig);

			changeTokenAmount.value = Number.parseInt(tokenChange?.amt || "0");
			indexingFees.value = tx.outputs[tx.outputs.length - 2].satoshis || 0;
			return {
				rawTx: tx.toHex(),
				size: tx.toBinary().length,
				fee:
					paymentUtxos[0].satoshis -
					Number(tx.outputs.reduce((sum, o) => sum + (o.satoshis || 0), 0)),
				numInputs: tx.inputs.length,
				numOutputs: tx.outputs.length,
				txid: tx.id("hex"),
				inputTxid: paymentUtxos[0].txid,
				marketFee: 0,
			};
		},
		[
			destinationBsv21Ids.value,
			destinationTickers.value,
			numOfHolders.value,
			isEqualAllocation,
			indexingFees,
			changeTokenAmount,
			destinations,
		],
	);

	const submit = useCallback(
		async (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();

			if (reviewMode.value) {
				router.push("/preview");
				return;
			}

			const isDestinationMissing =
				!destinationTickers.value &&
				!destinationBsv21Ids.value &&
				!(isEqualAllocation && addresses.value?.length);

			if (!amount.value || isDestinationMissing) {
				return;
			}

			if (Number.parseFloat(amount.value) > balance) {
				toast.error("Not enough Bitcoin!", toastErrorProps);
				return;
			}

			airdroppingStatus.value = FetchStatus.Loading;

			console.log(amount.value, addresses.value);
			const amt = Math.floor(Number.parseFloat(amount.value) * 10 ** dec);
			if (amt <= 0) {
				toast.error("Amount must be greater than 0", toastErrorProps);
				airdroppingStatus.value = FetchStatus.Error;
				return;
			}

			try {
				const { promise: promiseTickerDetails } = http.customFetch<Ticker>(
					`${API_HOST}/api/bsv20/${type === AssetType.BSV20 ? "tick" : "id"}/${id}`,
				);
				const ticker = await promiseTickerDetails;

				const bsv20TxoUrl = `${API_HOST}/api/bsv20/${ordAddress.value}/${type === AssetType.BSV20 ? "tick" : "id"}/${id}?listing=false`;
				const { promise } = http.customFetch<BSV20TXO[]>(bsv20TxoUrl);

				const tokenUtxos = (await promise) || [];

				const inputTokens = tokenUtxos.map((txo) => {
					console.log("InputTokens", { txo });
					// Convert ASM to a base64 encoded script
					return {
						txid: txo.txid,
						vout: txo.vout,
						amt: txo.amt.toString(),
						id: txo.tick || txo.id,
						script: txo.script,
						satoshis: 1,
					} as TokenUtxo;
				});

				if (!payPk.value) {
					throw new Error("Missing payment private key");
				}
				if (!ordPk.value) {
					throw new Error("Missing ordinal private key");
				}

				if (!fundingAddress.value) {
					throw new Error("Missing funding address");
				}

				if (!ordAddress.value) {
					throw new Error("Missing ordinal address");
				}

				const paymentPk = PrivateKey.fromWif(payPk.value);
				// const payScript = Buffer.from(new P2PKH().lock(fundingAddress.value).toHex(), 'hex').toString('base64')
				// console.log({payScript})
				const paymentUtxos = (utxos.value || []).map((txo) => {
					console.log("Payments", { txo });
					const script = Buffer.from(
						Script.fromASM(txo.script).toHex(),
						"hex",
					).toString("base64");
					return {
						txid: txo.txid,
						vout: txo.vout,
						satoshis: txo.satoshis,
						script,
					} as Utxo;
				});

				const transferTx = await airdropBsv20(
					amt,
					paymentUtxos,
					inputTokens,
					paymentPk,
					fundingAddress.value,
					PrivateKey.fromWif(ordPk.value),
					ordAddress.value,
					ticker,
				);
				airdroppingStatus.value = FetchStatus.Success;

				// Get only the PendingTransaction fields from the ReviewPendingTransaction which extends it with extra stuff we dont need right now
				pendingTxs.value = [transferTx];

				if (!reviewMode.value) {
					// If not in review mode, call handleReview instead
					await handleReview(e);
					return;
				}
			} catch (e) {
				console.error(e);
				toast.error("Failed to create airdrop", toastErrorProps);
				airdroppingStatus.value = FetchStatus.Error;
			}
		},
		[
			reviewMode.value,
			destinationTickers.value,
			destinationBsv21Ids.value,
			isEqualAllocation,
			addresses.value,
			amount.value,
			balance,
			airdroppingStatus,
			dec,
			router,
			type,
			id,
			ordAddress.value,
			airdropBsv20,
			utxos.value,
			payPk.value,
			fundingAddress.value,
			ordPk.value,
			handleReview,
		],
	);

	const loadTemplate = useCallback(async () => {
		// ${MARKET_API_HOST}/airdrop/3
		const url = `${MARKET_API_HOST}/airdrop/3`;
		const { promise } = http.customFetch<string[]>(url);
		const template = await promise;
		addresses.value = template.join(",");
	}, [addresses]);

	// placeholder should show the number of decimals as zeroes
	const amtPlaceholder = useMemo(() => {
		return dec > 0 ? `0.${"0".repeat(dec)}` : "0";
	}, [dec]);

	const [clickedInside, setClickedInside] = useState(false);

	const handleModalClick = () => {
		if (!clickedInside) {
			onClose();
		}
		setClickedInside(false);
	};

	const handleModalContentMouseDown = () => {
		setClickedInside(true);
	};

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<dialog
			id="airdrop_modal"
			className={`modal backdrop-blur ${open ? "modal-open" : ""}`}
			onClick={handleModalClick}
		>
			<div
				className="modal-box max-h-[90vh] m-auto w-full max-w-xl m-auto p-4 bg-[#111] text-[#aaa] rounded flex flex-col border border-yellow-200/5"
				onMouseDown={handleModalContentMouseDown}
			>
				<div className="modal-content overflow-y-auto relative w-full min-h-64 md:h-full">
					<div className="flex justify-between">
						<div className="text-lg font-semibold">
							{reviewMode.value ? "Review Airdrop" : `Airdrop ${sym || id}`}
						</div>
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
						<div
							className="text-xs cursor-pointer text-[#aaa]"
							onClick={setAmountToBalance}
						>
							Balance: {balance} {type === AssetType.BSV21 ? sym : id}
						</div>
					</div>
					<form onSubmit={submit}>
						{!reviewMode.value && (
							<div>
								<div className="flex flex-col w-full">
									<label className="text-sm font-semibold text-[#aaa] mb-2">
										Amount
									</label>
									<input
										type="number"
										placeholder={amtPlaceholder}
										max={balance}
										className="z-20 input input-bordered w-full placeholder:text-[#333]"
										value={amount.value === "0" ? "" : amount.value}
										onChange={(e) => {
											if (
												e.target.value === "" ||
												Number.parseFloat(e.target.value) <= balance
											) {
												amount.value = e.target.value;
											}
										}}
									/>
								</div>
								<div className="flex flex-col w-full mt-4">
									<label className="text-sm font-semibold text-[#aaa] mb-2 flex items-center">
										<span className="text-nowrap">
											{allocation.value} allocation
										</span>{" "}
										<div className="text-[#555] pl-2">
											{allocation.value === Allocation.Equal
												? "distribute tokens equally to all addresses."
												: "based on % of total supply held by each address."}
										</div>
									</label>

									<select
										className="z-20 input input-bordered w-full"
										value={allocation.value}
										onChange={(e) => {
											allocation.value = e.target.value as Allocation;
										}}
									>
										{ALLOCATION_OPTIONS.map(
											(opt: {
												value: Allocation;
												label: string;
											}) => (
												<option key={opt.value} value={opt.value}>
													{opt.label}
												</option>
											),
										)}
									</select>
								</div>
								<div className="flex flex-col mt-4">
									<label className="text-sm font-semibold text-[#aaa] mb-2">
										BSV20 Destination Tickers (comma separated list)
									</label>
									<input
										type="text"
										placeholder="RUG, PEPE, EGG, LOVE, SHGR"
										className="z-20 input input-bordered w-full placeholder:text-[#333]"
										value={destinationTickers.value}
										onChange={(e) => {
											destinationTickers.value = e.target.value;
										}}
									/>
								</div>

								<div className="flex flex-col mt-4">
									<label className="text-sm font-semibold text-[#aaa] mb-2">
										BSV21 Destination Token IDs (comma separated list)
									</label>
									<input
										type="text"
										placeholder="e6d40ba206340aa94ed40fe1a8adcd722c08c9438b2c1dd16b4527d561e848a2_0"
										className="z-20 input input-bordered w-full placeholder:text-[#333]"
										value={destinationBsv21Ids.value}
										onChange={(e) => {
											destinationBsv21Ids.value = e.target.value;
										}}
									/>
								</div>

								{(destinationTickers.value.length > 0 ||
									destinationBsv21Ids.value.length > 0) && (
									<div className="flex flex-col w-full mt-4">
										<label className="text-sm font-semibold text-[#aaa] mb-2 flex items-center text-right justify-end">
											<div
												className="tooltip tooltip-left"
												data-tip="Holders per ticker, largest first."
											>
												<FaQuestion className="text-[#aaa] cursor-pointer mr-2" />
											</div>
											Number of holders
										</label>
										<input
											type="number"
											placeholder="25"
											className="z-20 input input-bordered w-full placeholder:text-[#333]"
											value={
												numOfHolders.value === "0" ? "" : numOfHolders.value
											}
											max={"1000"}
											onChange={(e) => {
												numOfHolders.value = e.target.value;
											}}
										/>
									</div>
								)}

								<div className="divider" />
								{isEqualAllocation && (<>
									<div className="flex flex-col mt-4">
										<label className="text-sm font-semibold text-[#aaa] mb-2">
											Addresses (comma separated list){" "}
											{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
											<div
												className="cursor-pointer text-blue-400 hover:text-blue-500"
												onClick={loadTemplate}
											>
												All Registered Users
											</div>
										</label>
										<input
											type="text"
											placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
											className="z-20 input input-bordered w-full placeholder:text-[#333]"
											value={addresses.value}
											onChange={(e) => {
												addresses.value = e.target.value;
											}}
										/>
									</div>
									<div className="flex flex-col mt-4">
										<label className="text-sm font-semibold text-[#aaa] mb-2">
											Exclude Addresses (comma separated list)
										</label>
										<input
											type="text"
											placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
											className="z-20 input input-bordered w-full placeholder:text-[#333]"
											value={addresses.value}
											onChange={(e) => {
												excludeAdresses.value = e.target.value;
											}}
										/>
									</div>
									</>
								)}
							</div>
						)}

						{reviewMode.value && (
							<div className="flex flex-col">
								<div className="flex justify-between">
									<div className="text-sm font-semibold text-[#aaa] mb-2">
										Destination ({destinations.value.length})
									</div>
									<div className="text-sm font-semibold text-[#aaa] mb-2">
										Amount
									</div>
								</div>
								<div className="border-b border-[#555] pb-2">
								{destinations.value.map((dest, index) => (
									<div
										key={`destination-${dest.address}`}
										className="flex justify-between mb-2 text-xs"
									>
										<span>{dest.address}</span>
										<span className="whitespace-nowrap">
											{(dest.receiveAmt / 10 ** dec).toFixed(dec)} {sym || id}
										</span>
									</div>
								))}</div>
								<div className="mt-2 flex justify-between text-sm">
									<div className="font-semibold text-[#aaa]">
										Indexing Fees
									</div>
									<div>{toBitcoin(indexingFees.value || 0)} BSV</div>
								</div>
								{changeTokenAmount.value > 0 && (
									<div className="mt-2 flex justify-between text-sm">
										<div className="font-semibold text-[#aaa] mb-2">
											Change Tokens
										</div>
										<div>
											{changeTokenAmount.value / 10 ** dec} {sym || id}
										</div>
									</div>
								)}
							</div>
						)}

						<div className="modal-action">
							<button
								type="button"
								onClick={() => {
									reviewMode.value = false;
								}}
								className="bg-[#222] p-2 rounded cursor-pointer hover:bg-yellow-600 text-white"
							>
								Back
							</button>
							<button
								type="submit"
								disabled={airdroppingStatus.value === FetchStatus.Loading}
								className="bg-[#222] p-2 rounded cursor-pointer hover:bg-emerald-600 text-white disabled:bg-[#555] disabled:cursor-not-allowed"
							>
								{reviewMode.value
									? airdroppingStatus.value === FetchStatus.Loading
										? "Raining"
										: "Confirm"
									: "Review"}
							</button>
						</div>
					</form>
					<Meteors number={20} />
				</div>
			</div>
		</dialog>
	);
};

export default AirdropTokensModal;

async function fetchTokenDetails(tokenId: string): Promise<Ticker> {
	const hasUnderscore = tokenId.includes("_");
	const url = `${API_HOST}/api/bsv20/${hasUnderscore ? "id" : "tick"}/${tokenId}`;
	const response = await fetch(url);
	return (await response.json()) as Ticker;
}

async function fetchHolders(
	tokenId: string,
	numHolders: number,
): Promise<Holder[]> {
	const hasUnderscore = tokenId.includes("_");
	const url = `${API_HOST}/api/bsv20/${hasUnderscore ? "id" : "tick"}/${tokenId}/holders?limit=${numHolders}`;
	const response = await fetch(url);
	return (await response.json()) as Holder[];
}

const calculateEqualDistributions = async (
	sendAmount: number,
	bsv20Tickers: string,
	bsv21Ids: string,
	numHolders: number,
	additionalAddresses: string,
	excludeAdresses: string
): Promise<Distribution[]> => {
	const allTokens = [...bsv20Tickers.split(","), ...bsv21Ids.split(","), ...additionalAddresses.split(",")].map(
		(t) => t.trim(),
	).filter((t) => t.length > 0 && !excludeAdresses.includes(t));
	const tokenDetails = await Promise.all(allTokens.map(fetchTokenDetails));

	let totalHolders = 0;
	const holderSets = await Promise.all(
		tokenDetails.map(async (details) => {
			const url = `${API_HOST}/api/bsv20/${details.id ? "id" : "tick"}/${details.id || details.tick}/holders?limit=${numHolders}`;
			const response = await fetch(url);
			const holders = (await response.json()) as Holder[];
			totalHolders += holders.length;
			return holders;
		}),
	);

	const amountPerHolder = Math.floor(sendAmount / totalHolders);
	const distributions: Distribution[] = [];

	for (const holders of holderSets) {
		for (const holder of holders) {
			distributions.push({
				address: holder.address,
				amt: amountPerHolder.toString(),
			});
		}
	}

	// Distribute any remaining amount to the first holders
	const remaining = sendAmount - amountPerHolder * totalHolders;
	for (let i = 0; i < remaining; i++) {
		distributions[i].amt = (
			Number.parseInt(distributions[i].amt) + 1
		).toString();
	}

	return distributions;
};

const calculateWeightedDistributions = async (
	sendAmount: number,
	bsv20Tickers: string,
	bsv21Ids: string,
	numHolders: number,
	additionalAddresses: string,
	excludeAdresses: string
): Promise<Distribution[]> => {
	const allTokens = [...bsv20Tickers.split(","), ...bsv21Ids.split(","), ...additionalAddresses.split(",")].map(
		(t) => t.trim(),
	).filter((t) => t.length > 0 && !excludeAdresses.includes(t));
	
	const allTokenDetails = await Promise.all(allTokens.map(fetchTokenDetails));

	const allHolders: CombinedHolder[] = [];
	let totalWeightedHoldings = 0;

	for (const details of allTokenDetails) {
		const holders = await fetchHolders(
			details.id || (details.tick as string),
			numHolders,
		);
		const maxSupply = BigInt(details.supply || details.amt);
		const tokenTick = (details.tick || details.id) as string;

		for (const holder of holders) {
			const holderAmt = BigInt(holder.amt);
			const weightedAmt = Number(holderAmt) / Number(maxSupply);
			totalWeightedHoldings += weightedAmt;

			const existingHolder = allHolders.find(
				(h) => h.address === holder.address,
			);
			if (existingHolder) {
				existingHolder.totalWeightedAmt += weightedAmt;
				existingHolder.tokens[tokenTick] = {
					amt: Number(holderAmt),
					weightedAmt,
				};
			} else {
				allHolders.push({
					address: holder.address,
					totalWeightedAmt: weightedAmt,
					tokens: { [tokenTick]: { amt: Number(holderAmt), weightedAmt } },
				});
			}
		}
	}

	allHolders.sort((a, b) => b.totalWeightedAmt - a.totalWeightedAmt);

	const distributions: Distribution[] = [];
	let totalAllocated = 0;

	for (const holder of allHolders) {
		const weightedAmt = Math.floor(
			(sendAmount * holder.totalWeightedAmt) / totalWeightedHoldings,
		);
		if (weightedAmt > 0) {
			distributions.push({
				address: holder.address,
				amt: weightedAmt.toString(),
			});
			totalAllocated += weightedAmt;
		}
	}

	// Distribute any remaining amount to the top holders
	const remaining = sendAmount - totalAllocated;
	for (let i = 0; i < remaining; i++) {
		distributions[i].amt = (
			Number.parseInt(distributions[i].amt) + 1
		).toString();
	}

	return distributions;
};
