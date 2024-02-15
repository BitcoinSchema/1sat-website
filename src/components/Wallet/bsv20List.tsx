"use client";

import { API_HOST, AssetType, resultsPerPage } from "@/constants";
import { bsv20Balances } from "@/signals/wallet";
import { ordAddress } from "@/signals/wallet/address";
import { BSV20Balance } from "@/types/bsv20";
import { BSV20TXO, OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { computed, effect, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useInView } from "framer-motion";
import { find, uniq } from "lodash";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef } from "react";
import { FaHashtag } from "react-icons/fa";
import { FaChevronRight, FaParachuteBox } from "react-icons/fa6";
import AirdropTokensModal from "../modal/airdrop";
import TransferBsv20Modal from "../modal/transferBsv20";
import { MarketData } from "../pages/TokenMarket/list";
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
      const unindexed = bsv20s.value?.map((u) => u.origin?.data?.bsv20?.tick as string) || [];
      const fromBalances = bsv20Balances.value?.map((b) => b.tick as string) || []
      const finalArray = unindexed.concat(fromBalances) || []
      console.log({finalArray})
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
			const results = await result.json() as MarketData[];

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
				`${API_HOST}/api/txos/address/${address}/unspent?limit=1000&offset=0&dir=ASC&status=all&bsv20=true`,
			);
			const u = await promise;
			// filter out tickers that already exist in holdings, and group by ticker
			const tickerList = u.map((u) => u.data?.bsv20?.tick);
			console.log({ tickerList });
			bsv20s.value = u.filter((u) =>
				holdings.value?.every((h) => h.tick !== u.data?.bsv20?.tick),
			);
			console.log({ u });
			bsv20s.value = u;

			if (address !== ordAddress.value) {
				// not viewing own address
				// fetch balances
				const { promise: promiseBalances } = http.customFetch<BSV20Balance[]>(
					`${API_HOST}/api/bsv20/${address}/balance`,
				);
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
			bsv20s.value?.reduce(
				(acc, utxo) => {
					if (utxo.data?.bsv20?.tick) {
						if (acc[utxo.data.bsv20.tick]) {
							acc[utxo.data.bsv20.tick] += parseInt(utxo.data.bsv20.amt);
						} else {
							acc[utxo.data.bsv20.tick] = parseInt(utxo.data.bsv20.amt);
						}
					}
					return acc;
				},
				{} as { [key: string]: number },
			) || {},
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
	}, [addressProp, holdings, isInView, newOffset, reachedEndOfListings, type]);

	const balances = computed(() => {
		return (addressProp ? addressBalances.value : bsv20Balances.value)?.filter(
			(b) => (type === AssetType.BSV20 ? !!b.tick : !b.tick),
		);
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
									bsv20.tick ? `bsv20/${bsv20.tick}` : `bsv21/${bsv20.id}`
								}`,
							)
						}
					>
						{bsv20.tick || bsv20.id.slice(-8)}
					</div>
					<div>{bsv20.op}</div>
					<div>{bsv20.amt}</div>
					<div>{bsv20.price ? bsv20.price : "-"}</div>
					<div>
						<Link href={`/outpoint/${bsv20.txid}_${bsv20.vout}/token`}>
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
			<div className="grid grid-cols-3 gap-3 bg-[#222] p-4 w-full rounded mb-4">
				<div className="text-[#777] font-semibold">Ticker</div>
				<div className="text-[#777] font-semibold text-right">Balance</div>
				<div className="w-8" />
				{confirmedBalances?.value?.map(({ tick, all, sym, id, dec }, idx) => {
					// TODO: Get actual coin supply (hopefully return this on the balances endpoint?)
          const deets = find(tickerDetails.value, (t) => t.tick === tick);
					const supply = deets?.supply || deets?.amt;
					return (
						<React.Fragment key={`bal-confirmed-${tick}`}>
							<div
								className="cursor-pointer hover:text-blue-400 transition flex items-center"
								onClick={() =>
									router.push(`/market/${id ? "bsv21/" + id : "bsv20/" + tick}`)
								}
							>
								{tick || sym} <div className="text-[#555] items-center ml-2 md:flex hidden"><FaHashtag className="w-3 h-3 mr-1" />{deets?.num || ""}</div>
							</div>
							<div
								className="text-emerald-400 text-right font-mono"
								onClick={() => (showSendModal.value = tick || id)}
							>
								{(all.confirmed / 10 ** dec).toLocaleString()}
							</div>
							<div className="text-right">
								{(!addressProp || addressProp === ordAddress.value) &&
								all.confirmed / 10 ** dec > 10000 ? (
									<>
										<button
											type="button"
											className="btn btn-sm w-fit"
											onClick={() => {
												showAirdrop.value = tick || id;
											}}
										>
											<FaParachuteBox className="w-8" />
										</button>
										{
											<AirdropTokensModal
												onClose={() => {
													showAirdrop.value = undefined;
												}}
												type={AssetType.BSV20}
												dec={dec}
												id={(tick || id)!}
												open={
													(!!tick && showAirdrop.value === tick) ||
													(!!id && showAirdrop.value === id)
												}
												balance={all.confirmed}
											/>
										}
									</>
								) : (
									<></>
								)}
							</div>
							{showSendModal.value === (tick || id) && (
								<TransferBsv20Modal
									onClose={() => (showSendModal.value = undefined)}
									type={type}
									id={(tick || id)!}
									dec={dec}
									balance={all.confirmed / 10 ** dec}
									sym={sym}
								/>
							)}
						</React.Fragment>
					);
				})}
			</div>
		);
	});

	const pendingContent = computed(() => {
		return (
			<div className="grid grid-cols-2 gap-3 bg-[#222] p-4 rounded mb-4">
				<div className="text-[#777] font-semibold">Ticker</div>
				<div className="text-[#777] font-semibold">Balance</div>
				{pendingBalances?.value?.map(({ tick, all, sym, id, dec }, idx) => (
					<React.Fragment key={`bal-pending-${tick}`}>
						<div
							className="cursor-pointer hover:text-blue-400 transition"
							onClick={() =>
								router.push(`/market/${id ? "bsv21/" + id : "bsv20/" + tick}`)
							}
						>
							{tick || sym}
						</div>
						<div className="text-emerald-400">{all.pending / 10 ** dec}</div>
					</React.Fragment>
				))}
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
									router.push(`/market/${id ? "bsv21/" + id : "bsv20/" + tick}`)
								}
							>
								{tick || sym}
							</div>
							<div className="text-emerald-400">
								{listed.confirmed / 10 ** dec}
							</div>
						</React.Fragment>
					),
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
					<div className="text-[#777] font-semibold">No unindexed tokens</div>
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
			<div className="mb-4">
				<div role="tablist" className="tabs md:tabs-lg tabs-bordered">
					<input
						type="radio"
						name="balanceTabs"
						role="tab"
						className="tab ml-1"
						aria-label="Confirmed"
						checked={balanceTab.value === BalanceTab.Confirmed}
						onChange={() => (balanceTab.value = BalanceTab.Confirmed)}
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

					<input
						type="radio"
						name="balanceTabs"
						role="tab"
						className="tab mr-1"
						aria-label="Unindexed"
						checked={balanceTab.value === BalanceTab.Unindexed}
						onChange={() => (balanceTab.value = BalanceTab.Unindexed)}
					/>
					<div
						role="tabpanel"
						className="tab-content bg-base-100 border-base-200 rounded-box border-0 mt-4"
					>
						{unindexedContent.value}
					</div>
				</div>
			</div>
		);
	});

	return (
		<div className="overflow-x-auto max-w-screen">
			<div className={`${"mb-12"} mx-auto w-full max-w-5xl`}>
				<WalletTabs type={type} address={addressProp} />
				<div className="tab-content bg-base-100 border-base-200 rounded-box p-2 md:p-6 flex flex-col md:flex-row">
					<div className="mb-4">{contentTabs.value}</div>
					<div className="md:mx-6">
						<h1 className="mb-4 flex items-center justify-between">
							<div className="text-2xl">{type.toUpperCase()} Outputs</div>
							<div className="text-sm text-[#555]" />
						</h1>
						<div className="my-2 w-full text-sm grid grid-cols-6 p-4 gap-x-4 gap-y-2 min-w-md bg-[#111]">
							<div className="font-semibold text-accent text-base">Height</div>
							<div className="font-semibold text-[#777] text-base">Ticker</div>
							<div className="font-semibold text-[#777] text-base">Op</div>
							<div className="font-semibold text-[#777] text-base">Amount</div>
							<div className="font-semibold text-[#777] text-base">Price</div>
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
