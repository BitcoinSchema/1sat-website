import { API_HOST, AssetType } from "@/constants";
import * as http from "@/utils/httpClient";
import { MarketData } from "./list";
import { useEffect, useRef } from "react";
import { useInView } from "framer-motion";
import { useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { BSV20TXO } from "@/types/ordinals";
import { mySales } from "./signals";
import { toBitcoin } from "satoshi-bitcoin-ts";
import Link from "next/link";
import { ordAddress } from "@/signals/wallet/address";

interface Props {
	ticker: MarketData;
	type: AssetType.BSV20 | AssetType.BSV21;
}

export function TokenMarketMySales({ ticker, type }: Props) {
	useSignals();

	const salesRef = useRef(null);
	const salesInView = useInView(salesRef);
	const newSalesOffset = useSignal(0);
	const reachedEndOfSales = useSignal(false);
	const allSales = useSignal<BSV20TXO[]>([]);

	useEffect(() => {
		if (!ordAddress.value) {
			return;
		}

		/**
		 * Because the API does not have a way to filter sales and purchases
		 * we have to fetch all the history and filter the sales on the client side
		 */
		async function fire() {
			let urlMarket = `${API_HOST}/api/bsv20/${ordAddress.value}/tick/${ticker.tick}/history?dir=desc&limit=1000&offset=0`;
			if (type === AssetType.BSV21) {
				urlMarket = `${API_HOST}/api/bsv20/${ordAddress.value}/id/${ticker.id}/history?dir=desc&limit=1000&offset=0`;
			}

			const { promise: promiseBsv20v1Market } =
				http.customFetch<BSV20TXO[]>(urlMarket);

			allSales.value = await promiseBsv20v1Market;
		}

		fire();
	}, [ticker]);

	useEffect(() => {
		if (
			!ordAddress.value ||
			!allSales.value ||
			allSales.value.length === 0
		) {
			return;
		}

		let nextPageOfSales: BSV20TXO[] = [];

		const fire = async (id: string) => {
			if (newSalesOffset.value === 0) {
				mySales.value = [];
			}

			newSalesOffset.value += 20;

			nextPageOfSales = [...allSales.value];
			console.log({ nextPageOfSales });

			/**
			 * To get the sales the user made, we look for sales where the owner is not the user
			 * If the owner is the user, it means the user bought the token
			 */
			nextPageOfSales = nextPageOfSales.filter((sale) => {
				return !!sale.sale;
			});

			if (nextPageOfSales.length > 0) {
				// For some reason this would return some items the same id from the first call so we filter them out
				mySales.value = [
					...(mySales.value || []),
					...nextPageOfSales.filter(
						(l) => !mySales.value?.some((l2) => l2.txid === l.txid)
					),
				];
			} else {
				reachedEndOfSales.value = true;
			}
		};

		if (salesInView) {
			console.log({ salesInView });
		}
		if (
			type === AssetType.BSV20 &&
			(salesInView || newSalesOffset.value === 0) &&
			ticker.tick &&
			!reachedEndOfSales.value
		) {
			fire(ticker.tick);
		} else if (
			type === AssetType.BSV21 &&
			(salesInView || newSalesOffset.value === 0) && // fire the first time
			ticker.id &&
			!reachedEndOfSales.value
		) {
			fire(ticker.id);
		}
	}, [salesInView, newSalesOffset, reachedEndOfSales, ticker, type]);

	return (
		<>
			{mySales.value?.map((sale) => {
				return (
					<div
						className="flex w-full justify-between"
						key={`${sale.txid}-${sale.vout}-${sale.height}`}
					>
						<Link
							href={`/outpoint/${sale.txid}`}
							className="flex flex-col py-1"
						>
							<span className="text-secondary-content/75">
								{(
									Number.parseInt(sale.amt) /
									10 ** ticker.dec
								).toLocaleString()}{" "}
								{ticker.tick}
							</span>
							<span className="text-accent text-xs">
								{sale.pricePer} / token
							</span>
						</Link>
						<div className="py-1">
							<button
								type="button"
								disabled
								className="btn btn-xs btn-outline btn-secondary pointer-events-none"
							>
								{Number.parseInt(sale.price) > 1000
									? `${toBitcoin(sale.price)} BSV`
									: `${sale.price} sat`}
							</button>
						</div>
					</div>
				);
			})}
			{mySales.value?.length === 0 && (
				<div className="text-center text-base-content/75">
					No sales found
				</div>
			)}
			<div ref={salesRef} />
		</>
	);
}
