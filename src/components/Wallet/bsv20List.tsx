"use client";

import { API_HOST, AssetType, resultsPerPage } from "@/constants";
import { bsv20Balances } from "@/signals/wallet";
import { ordAddress } from "@/signals/wallet/address";
import type { BSV20Balance } from "@/types/bsv20";
import type { BSV20TXO, OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { computed, effect, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useInView } from "framer-motion";
import { find, uniq } from "lodash";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef } from "react";
import { IoSend } from "react-icons/io5";

import { FaChevronRight, FaHashtag, FaParachuteBox } from "react-icons/fa6";
import AirdropTokensModal from "../modal/airdrop";
import TransferBsv20Modal from "../modal/transferBsv20";
import { IconWithFallback } from "../pages/TokenMarket/heading";
import type { MarketData } from "../pages/TokenMarket/list";
import WalletTabs from "./tabs";

enum BalanceTab {
	Confirmed = 0,
	Pending = 1,
	Listed = 2,
	Unindexed = 3,
}

const Bsv20List = ({
	type,
	address: addressProp,
}: {
	type: AssetType.BSV20 | AssetType.BSV21;
	address?: string;
}) => {
	useSignals();

	const ref = useRef(null);
	const isInView = useInView(ref);
	const newOffset = useSignal(0);
	const reachedEndOfListings = useSignal(false);
	const balanceTab = useSignal(BalanceTab.Confirmed);
	const router = useRouter();
	const holdings = useSignal<BSV20TXO[] | null>(null);
	const addressBalances = useSignal<BSV20Balance[] | null>(null);
	const showAirdrop = useSignal<string | undefined>(undefined);

	const showSendModal = useSignal<string | undefined>(undefined);

	// get unspent ordAddress
	const bsv20s = useSignal<OrdUtxo[] | null>(null);
	const tickerDetails = useSignal<MarketData[] | null>(null);

	effect(() => {
		const fire = async () => {
			const url = "https://1sat-api-production.up.railway.app/ticker/num";
			const unindexed =
				bsv20s.value?.map(
					(u) => u.origin?.data?.bsv20?.tick as string
				) || [];
			const fromBalances =
				bsv20Balances.value?.map((b) => b.tick as string) || [];
			const finalArray = (unindexed.concat(fromBalances) || []).filter(
				(id) => !!id
			);
			console.log({ finalArray });
			const ids = uniq(finalArray);
			if (!ids.length) return;

			tickerDetails.value = [];
			const result = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ ids }),
			});
			const results = (await result.json()) as MarketData[];

			console.log("POST TEST", { results });
			tickerDetails.value = results;
		};

		if (bsv20s.value !== null && tickerDetails.value === null) {
			fire();
		}
	});
	effect(() => {
		const address = addressProp || ordAddress.value;
		// get unindexed tickers
		const fire = async () => {
			bsv20s.value = [];
			const { promise } = http.customFetch<OrdUtxo[]>(
				`${API_HOST}/api/txos/address/${address}/unspent?limit=1000&offset=0&dir=ASC&status=all&bsv20=true`
			);
			const u = await promise;
			// filter out tickers that already exist in holdings, and group by ticker
			const tickerList = u.map((u) => u.data?.bsv20?.tick);
			console.log({ tickerList });
			bsv20s.value = u.filter((u) =>
				holdings.value?.every((h) => h.tick !== u.data?.bsv20?.tick)
			);
			console.log({ u });
			bsv20s.value = u;

			if (address !== ordAddress.value) {
				// not viewing own address
				// fetch balances
				const { promise: promiseBalances } = http.customFetch<
					BSV20Balance[]
				>(`${API_HOST}/api/bsv20/${address}/balance`);
				const b = await promiseBalances;
				addressBalances.value = b.sort((a, b) => {
					return b.all.confirmed + b.all.pending >
						a.all.confirmed + a.all.pending
						? 1
						: -1;
				});
			}
		};
		if (!bsv20s.value && address) {
			fire();
		}
	});

	const unindexBalances = computed(
		() =>
			bsv20s.value?.reduce((acc, utxo) => {
				if (utxo.data?.bsv20?.tick) {
					if (acc[utxo.data.bsv20.tick]) {
						acc[utxo.data.bsv20.tick] += parseInt(
							utxo.data.bsv20.amt
						);
					} else {
						acc[utxo.data.bsv20.tick] = parseInt(
							utxo.data.bsv20.amt
						);
					}
				}
				return acc;
			}, {} as { [key: string]: number }) || {}
	);

	useEffect(() => {
		const address = addressProp || ordAddress.value;
		const fire = async () => {
			if (type === AssetType.BSV20) {
				const urlTokens = `${API_HOST}/api/bsv20/${address}/unspent?limit=${resultsPerPage}&offset=${newOffset.value}&dir=desc&type=v1`;
				console.log("Fetching", urlTokens);
				const { promise: promiseBsv20 } =
					http.customFetch<BSV20TXO[]>(urlTokens);
				const newResults = await promiseBsv20;
				if (newResults.length > 0) {
					holdings.value = (holdings.value || []).concat(newResults);
					console.log("newLength", holdings.value.length);
				} else {
					reachedEndOfListings.value = true;
				}
			} else {
				const urlV2Tokens = `${API_HOST}/api/bsv20/${address}/unspent?limit=${resultsPerPage}&offset=${newOffset.value}&dir=desc&type=v2`;
				const { promise: promiseBsv21 } =
					http.customFetch<BSV20TXO[]>(urlV2Tokens);
				const newResults = await promiseBsv21;
				if (newResults.length > 0) {
					holdings.value = (holdings.value || []).concat(newResults);
					console.log("newLength", holdings.value.length);
				} else {
					reachedEndOfListings.value = true;
				}
			}
			newOffset.value += resultsPerPage;
		};
		if (address && isInView && !reachedEndOfListings.value) {
			fire();
		}
	}, [
		addressProp,
		holdings,
		isInView,
		newOffset,
		reachedEndOfListings,
		type,
	]);

	const balances = computed(() => {
		return (
			addressProp ? addressBalances.value : bsv20Balances.value
		)?.filter((b) => (type === AssetType.BSV20 ? !!b.tick : !b.tick));
	});

	const activity = computed(() => {
		return holdings.value
			?.filter((b) => (type === AssetType.BSV20 ? !!b.tick : !b.tick))
			?.map((bsv20, index) => (
				<React.Fragment key={`act-${bsv20.tick}-${index}`}>
					<div className="text-xs text-info">
						<Link
							href={`https://whatsonchain.com/tx/${bsv20.txid}`}
							target="_blank"
						>
							{bsv20.height}
						</Link>
					</div>
					<div
						className="flex items-center cursor-pointer hover:text-blue-400 transition"
						onClick={() =>
							router.push(
								`/market/${
									bsv20.tick
										? `bsv20/${bsv20.tick}`
										: `bsv21/${bsv20.id}`
								}`
							)
						}
					>
						{bsv20.tick || bsv20.id.slice(-8)}
					</div>
					<div>{bsv20.op}</div>
					<div>{bsv20.amt}</div>
					<div>{bsv20.price ? bsv20.price : "-"}</div>
					<div>
						<Link
							href={`/outpoint/${bsv20.txid}_${bsv20.vout}/token`}
						>
							<FaChevronRight />
						</Link>
					</div>
				</React.Fragment>
			));
	});

	const listingBalances = computed(() => {
		return balances.value?.filter((b) => {
			return b.listed.confirmed + b.listed.pending > 0;
		});
	});

	const pendingBalances = computed(() => {
		return balances.value?.filter((b) => {
			return b.all.pending > 0;
		});
	});

	const confirmedBalances = computed(() => {
		return balances.value?.filter((b) => {
			return b.all.confirmed > 0;
		});
	});

	const confirmedContent = computed(() => {
		return (
			<div className="bg-[#101010] rounded-lg w-full mb-4 px-2">
				{confirmedBalances?.value?.map(
					({ tick, all, sym, id, dec, listed, icon }, idx) => {
						// TODO: Get actual coin supply (hopefully return this on the balances endpoint?)
						const deets = find(
							tickerDetails.value,
							(t) => t.tick === tick
						);
						const supply = deets?.supply || deets?.amt;
						const balance =
							(all.confirmed - listed.confirmed) / 10 ** dec;

						// get number of decimals
						const numDecimals =
							balance.toString().split(".")[1]?.length || 0;

						const balanceText =
							balance > 1000000000
								? `${(balance / 1000000000).toFixed(2)}B`
								: balance > 1000000
								? `${(balance / 1000000).toFixed(2)}M`
								: numDecimals > 0
								? balance.toFixed(2)
								: balance.toString();
						const tooltip =
							balance.toString() !== balanceText.trim()
								? balance.toLocaleString()
								: "";

						const showAirdropIcon =
							(!addressProp ||
								addressProp === ordAddress.value) &&
							all.confirmed / 10 ** dec > 10000;

						return (
							<React.Fragment key={`bal-confirmed-${tick}`}>
								<div className="grid grid-cols-2 gap-3 auto-cols-auto items-center max-w-md p-2">
									<div className="flex items-center">
										{AssetType.BSV21 === type && (
											<IconWithFallback
												icon={icon || null}
												alt={sym || ""}
												className="w-12 h-12 mr-2"
											/>
										)}
										<div>
											<div
												className="cursor-pointer hover:text-blue-400 transition text-xl"
												onClick={() =>
													router.push(
														`/market/${
															id
																? "bsv21/" + id
																: "bsv20/" +
																  tick
														}`
													)
												}
											>
												{tick || sym}
											</div>
											<div className="text-[#555]">
												{type === AssetType.BSV20 && (
													<FaHashtag className="w-4 h-4 mr-1 inline-block" />
												)}
												{deets?.num ||
													`${id?.slice(
														0,
														8
													)}...${id?.slice(-8)}` ||
													""}
											</div>
										</div>
									</div>
									<div className="text-right">
										<div
											className="text-emerald-400 font-mono tooltip tooltip-bottom"
											data-tip={tooltip || null}
										>
											{balanceText}
										</div>
										<div className="flex justify-end mt-2">
											{showAirdropIcon && (
												<div
													className={`text-right ${
														showAirdropIcon
															? "mr-2"
															: ""
													}`}
												>
													<button
														type="button"
														className="btn btn-xs w-fit hover:border hover:border-yellow-200/25"
														onClick={() => {
															showAirdrop.value =
																tick || id;
														}}
													>
														<FaParachuteBox className="w-3" />
													</button>
													{
														<AirdropTokensModal
															onClose={() => {
																showAirdrop.value =
																	undefined;
															}}
															type={
																id
																	? AssetType.BSV21
																	: AssetType.BSV20
															}
															dec={dec}
															id={(tick || id)!}
															sym={sym}
															open={
																(!!tick &&
																	showAirdrop.value ===
																		tick) ||
																(!!id &&
																	showAirdrop.value ===
																		id)
															}
															balance={
																all.confirmed
															}
														/>
													}
												</div>
											)}
											<div className={`text-right `}>
												{(!addressProp ||
													addressProp ===
														ordAddress.value) &&
												all.confirmed / 10 ** dec >
													0 ? (
													<>
														<button
															type="button"
															className="btn btn-xs w-fit"
															onClick={() => {
																showSendModal.value =
																	tick || id;
															}}
														>
															<IoSend className="w-3" />
														</button>
														{showSendModal.value ===
															(tick || id) && (
															<TransferBsv20Modal
																onClose={() =>
																	(showSendModal.value =
																		undefined)
																}
																type={type}
																id={
																	(tick ||
																		id)!
																}
																dec={dec}
																balance={
																	balance
																}
																sym={sym}
															/>
														)}
													</>
												) : (
													<></>
												)}
											</div>
										</div>
									</div>
								</div>
								<div className="divider my-0" />
							</React.Fragment>
						);
					}
				)}
			</div>
		);
	});

	const pendingContent = computed(() => {
		return (
			<div className="grid grid-cols-2 gap-3 bg-[#222] p-4 rounded mb-4">
				<div className="text-[#777] font-semibold">Ticker</div>
				<div className="text-[#777] font-semibold">Balance</div>
				{pendingBalances?.value?.map(
					({ tick, all, sym, id, dec }, idx) => (
						<React.Fragment key={`bal-pending-${tick}`}>
							<div
								className="cursor-pointer hover:text-blue-400 transition"
								onClick={() =>
									router.push(
										`/market/${
											id ? "bsv21/" + id : "bsv20/" + tick
										}`
									)
								}
							>
								{tick || sym}
							</div>
							<div className="text-emerald-400">
								{all.pending / 10 ** dec}
							</div>
						</React.Fragment>
					)
				)}
			</div>
		);
	});

	const listedContent = computed(() => {
		return (
			<div className="grid grid-cols-2 gap-3 bg-[#222] p-4 rounded mb-4">
				<div className="text-[#777] font-semibold">Ticker</div>
				<div className="text-[#777] font-semibold">Balance</div>
				{listingBalances?.value?.map(
					({ tick, all, sym, id, listed, dec }, idx) => (
						<React.Fragment key={`bal-listed-${tick}`}>
							<div
								className="cursor-pointer hover:text-blue-400 transition"
								onClick={() =>
									router.push(
										`/market/${
											id ? "bsv21/" + id : "bsv20/" + tick
										}`
									)
								}
							>
								{tick || sym}
							</div>
							<div className="text-emerald-400">
								{listed.confirmed / 10 ** dec}
							</div>
						</React.Fragment>
					)
				)}
			</div>
		);
	});

	const unindexedContent = computed(() => {
		return (
			<div className="grid grid-cols-2 gap-3 bg-[#222] p-4 rounded mb-4">
				<div className="text-[#777] font-semibold">Ticker</div>
				<div className="text-[#777] font-semibold">Balance</div>
				{bsv20s && bsv20s.value?.length === 0 && (
					<div className="text-[#777] font-semibold">
						No unindexed tokens
					</div>
				)}
				{Object.entries(unindexBalances.value)
					.filter((t) => {
						// return type === AssetType.BSV20 ? tick : id;
						return true;
					})
					.map(([tick, amount], idx) => (
						<React.Fragment key={`bal-unindexed-${tick}`}>
							<Link
								href={`/market/${type}/${tick}`}
								className="cursor-pointer hover:text-blue-400 transition"
							>
								{tick}
							</Link>
							<div
								className="text-emerald-400 tooltip"
								data-tip={`[ ! ] This balance does not consider decimals.`}
							>
								{amount}
							</div>
						</React.Fragment>
					))}
			</div>
		);
	});

	const contentTabs = computed(() => {
		return (
			<div className="mb-4 p-2 md:p-0">
				<div role="tablist" className="tabs md:tabs-lg tabs-bordered">
					<input
						type="radio"
						name="balanceTabs"
						role="tab"
						className="tab ml-1"
						aria-label="Confirmed"
						checked={balanceTab.value === BalanceTab.Confirmed}
						onChange={() =>
							(balanceTab.value = BalanceTab.Confirmed)
						}
					/>
					<div
						role="tabpanel"
						className="tab-content bg-base-100 border-base-200 rounded-box border-0 mt-4"
					>
						{confirmedContent.value}
					</div>

					<input
						type="radio"
						name="balanceTabs"
						role="tab"
						className="tab"
						aria-label="Pending"
						checked={balanceTab.value === BalanceTab.Pending}
						onChange={() => (balanceTab.value = BalanceTab.Pending)}
					/>
					<div
						role="tabpanel"
						className="tab-content bg-base-100 border-base-200 rounded-box border-0 mt-4"
					>
						{pendingContent.value}
					</div>

					<input
						type="radio"
						name="balanceTabs"
						role="tab"
						className="tab"
						aria-label="Listed"
						checked={balanceTab.value === BalanceTab.Listed}
						onChange={() => (balanceTab.value = BalanceTab.Listed)}
					/>
					<div
						role="tabpanel"
						className="tab-content bg-base-100 border-base-200 rounded-box border-0 mt-4"
					>
						{listedContent.value}
					</div>

					{type === AssetType.BSV20 && (
						<>
							<input
								type="radio"
								name="balanceTabs"
								role="tab"
								className="tab mr-1"
								aria-label="Unindexed"
								checked={
									balanceTab.value === BalanceTab.Unindexed
								}
								onChange={() =>
									(balanceTab.value = BalanceTab.Unindexed)
								}
							/>
							<div
								role="tabpanel"
								className="tab-content bg-base-100 border-base-200 rounded-box border-0 mt-4"
							>
								{unindexedContent.value}
							</div>
						</>
					)}
				</div>
			</div>
		);
	});

	return (
		<div className="overflow-x-auto max-w-screen">
			<div className={`${"mb-12"} mx-auto w-full max-w-5xl`}>
				<WalletTabs type={type} address={addressProp} />
				<div className="tab-content bg-base-100 border-base-200 rounded-box md:p-6 flex flex-col md:flex-row">
					<div className="mb-4">{contentTabs.value}</div>
					<div className="md:mx-6">
						<h1 className="mb-4 flex items-center justify-between">
							<div className="text-2xl">
								{type.toUpperCase()} Outputs
							</div>
							<div className="text-sm text-[#555]" />
						</h1>
						<div className="my-2 w-full text-sm grid grid-cols-6 p-4 gap-x-4 gap-y-2 min-w-md bg-[#111]">
							<div className="font-semibold text-accent text-base">
								Height
							</div>
							<div className="font-semibold text-[#777] text-base">
								Ticker
							</div>
							<div className="font-semibold text-[#777] text-base">
								Op
							</div>
							<div className="font-semibold text-[#777] text-base">
								Amount
							</div>
							<div className="font-semibold text-[#777] text-base">
								Price
							</div>
							<div className="" />
							{activity}
							<div ref={ref} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Bsv20List;

// export const getBsv20Utxos = async (ordUtxos: Signal<OrdUtxo[] | null>) => {
//   bsv20Utxos.value = [];
//   const { promise } = http.customFetch<OrdUtxo[]>(
//     `${API_HOST}/api/txos/address/${ordAddress.value}/unspent?limit=${resultsPerPage}&offset=0&dir=DESC&status=all&bsv20=true`
//   );
//   const u = await promise;
//   bsv20Utxos.value = u;
// };
