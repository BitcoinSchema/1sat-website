"use client";

import Artifact from "@/components/artifact";
import { FetchStatus, NUMBER_OF_ITEMS_PER_PAGE } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import {
	fetchCollectionItems, 
	fetchCollectionMarket,
} from "@/utils/fetchCollectionData";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaSpinner } from "react-icons/fa6";
import { Tab } from "./CollectionNavigation";

type CollectionListProps = {
	collectionId: string;
};

export const CollectionList = ({ collectionId }: CollectionListProps) => {
	const searchParams = useSearchParams();
	// if there's no tab param, act as if it's market
	const tab = searchParams.get("tab") ?? Tab.Market;
	const isMarketTab = tab === Tab.Market;

	const [marketOffset, setMarketOffset] = useState(0);
	const [itemsOffset, setItemsOffset] = useState(0);

	const [marketItems, setMarketItems] = useState<OrdUtxo[]>([]);
	const [items, setItems] = useState<OrdUtxo[]>([]);

	const [hasMoreMarket, setHasMoreMarket] = useState(true);
	const [hasMoreItems, setHasMoreItems] = useState(true);

	const hasMore = useMemo(
		() => (isMarketTab ? hasMoreMarket : hasMoreItems),
		[isMarketTab, hasMoreMarket, hasMoreItems],
	);

	const itemsToDisplay = useMemo(
		() => (isMarketTab ? marketItems : items),
		[isMarketTab, marketItems, items],
	);

	// initialize to idle for both tabs
	const [loading, setLoading] = useState<Map<Tab | string, FetchStatus>>(
		new Map([
			[Tab.Market, FetchStatus.Idle],
			[Tab.Items, FetchStatus.Idle],
		]),
	);

	const setLoadingStatus = useCallback(
		(tab: string | Tab, status: FetchStatus) => {
			const newLoading = new Map(loading);
			newLoading.set(tab as Tab, status);
			setLoading(newLoading);
		},
		[loading],
	);

	const loadMore = useCallback(async () => {
		setLoadingStatus(tab, FetchStatus.Loading);

		if (isMarketTab) {
			const newItems =
				(await fetchCollectionMarket(collectionId, marketOffset)) ?? [];

			if (marketOffset === 0) {
				setMarketItems(newItems);
			} else {
				setMarketItems((i) => [...i, ...newItems]);
			}
			setHasMoreMarket(newItems.length >= NUMBER_OF_ITEMS_PER_PAGE);
			setMarketOffset((offset) => offset + NUMBER_OF_ITEMS_PER_PAGE);
		} else {
			const newItems =
				(await fetchCollectionItems(collectionId, itemsOffset)) ?? [];
			// console.log({ newItems });
			if (itemsOffset === 0) {
				setItems(newItems);
			} else {
				setItems((i) => [...i, ...newItems]);
			}
			setHasMoreItems(newItems.length >= NUMBER_OF_ITEMS_PER_PAGE);
			setItemsOffset((offset) => offset + NUMBER_OF_ITEMS_PER_PAGE);
		}

		setLoadingStatus(tab, FetchStatus.Success);
	}, [
		setLoadingStatus,
		tab,
		isMarketTab,
		collectionId,
		marketOffset,
		itemsOffset,
	]);

	useEffect(() => {
		// initial load
		const fire = async () => {
			await loadMore();
		};
		if (
			itemsOffset === 0 &&
			!isMarketTab &&
			loading.get(Tab.Items) === FetchStatus.Idle
		) {
			fire();
		}
		if (
			marketOffset === 0 &&
			isMarketTab &&
			loading.get(Tab.Market) === FetchStatus.Idle
		) {
			fire();
		}
	}, [loadMore, isMarketTab, marketOffset, itemsOffset, loading]);

	return (
		<section className="w-full flex flex-col items-center justify-center">
			{itemsToDisplay.length > 0 && (
				<div className="w-full mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 md:gap-4">
					{itemsToDisplay.map((item, idx) => {
						return (
							<Artifact
								key={`${item.txid}-${item.vout}-${item.height}-${idx}`}
								to={`/outpoint/${item.outpoint}`}
								artifact={item}	
								size={300}
								sizes={"100vw"}
								priority={idx < 10}
								showListingTag={!!item.data?.list?.price}
							/>
						);
					})}
				</div>
			)}
			{loading.get(tab) !== FetchStatus.Success && (
				<div className="mx-auto my-4">
					<FaSpinner className="animate-spin" />
				</div>
			)}
			{itemsToDisplay.length === 0 &&
				loading.get(tab) === FetchStatus.Success && (
					<div className="mx-auto my-4">{`No ${tab}${
						isMarketTab ? " items" : ""
					} for this collection`}</div>
				)}
			{loading.get(tab) === FetchStatus.Success &&
				itemsToDisplay.length > 0 &&
				hasMore && (
					<div className="mx-auto w-fit flex justify-center mt-4">
						<button type="button" className="btn" onClick={loadMore}>
							Load More
						</button>
					</div>
				)}
		</section>
	);
};
