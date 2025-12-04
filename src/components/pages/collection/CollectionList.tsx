"use client";

import Artifact from "@/components/artifact";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FetchStatus, NUMBER_OF_ITEMS_PER_PAGE } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import {
	fetchCollectionItems,
	fetchCollectionMarket,
} from "@/utils/fetchCollectionData";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Package, ShoppingBag } from "lucide-react";
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
		[isMarketTab, hasMoreMarket, hasMoreItems]
	);

	const itemsToDisplay = useMemo(
		() => (isMarketTab ? marketItems : items),
		[isMarketTab, marketItems, items]
	);

	// initialize to idle for both tabs
	const [loading, setLoading] = useState<Map<Tab | string, FetchStatus>>(
		new Map([
			[Tab.Market, FetchStatus.Idle],
			[Tab.Items, FetchStatus.Idle],
		])
	);

	const setLoadingStatus = useCallback(
		(tab: string | Tab, status: FetchStatus) => {
			const newLoading = new Map(loading);
			newLoading.set(tab as Tab, status);
			setLoading(newLoading);
		},
		[loading]
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
		<section className="w-full flex flex-col">
			{/* Loading skeleton */}
			{loading.get(tab) === FetchStatus.Loading && itemsToDisplay.length === 0 && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
					{[...Array(10)].map((_, i) => (
						<div key={i} className="space-y-2">
							<Skeleton className="aspect-square w-full rounded-lg" />
							<Skeleton className="h-4 w-3/4" />
							<Skeleton className="h-3 w-1/2" />
						</div>
					))}
				</div>
			)}

			{/* Items grid */}
			{itemsToDisplay.length > 0 && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
					{itemsToDisplay.map((item, idx) => {
						return (
							<Artifact
								key={`${item.txid}-${item.vout}-${item.height}-${idx}`}
								to={`/outpoint/${item.outpoint}`}
								artifact={item}
								size={300}
								sizes={"(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"}
								priority={idx < 10}
								showListingTag={!!item.data?.list?.price}
								classNames={{
									wrapper: "bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors",
									media: "bg-card",
								}}
							/>
						);
					})}
				</div>
			)}

			{/* Loading indicator for pagination */}
			{loading.get(tab) === FetchStatus.Loading && itemsToDisplay.length > 0 && (
				<div className="flex items-center justify-center py-8">
					<Loader2 className="w-6 h-6 animate-spin text-primary" />
				</div>
			)}

			{/* Empty state */}
			{itemsToDisplay.length === 0 &&
				loading.get(tab) === FetchStatus.Success && (
					<div className="flex flex-col items-center justify-center py-16 text-center">
						{isMarketTab ? (
							<ShoppingBag className="w-12 h-12 text-muted-foreground mb-4" />
						) : (
							<Package className="w-12 h-12 text-muted-foreground mb-4" />
						)}
						<h3 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
							No {tab}
							{isMarketTab ? " items" : ""} found
						</h3>
						<p className="text-xs text-muted-foreground mt-2">
							{isMarketTab
								? "No items are currently listed for sale in this collection"
								: "No items exist in this collection yet"}
						</p>
					</div>
				)}

			{/* Load more button */}
			{loading.get(tab) === FetchStatus.Success &&
				itemsToDisplay.length > 0 &&
				hasMore && (
					<div className="flex justify-center pt-8">
						<Button
							variant="outline"
							onClick={loadMore}
							className="rounded-md font-mono text-xs uppercase tracking-wider"
						>
							Load More
						</Button>
					</div>
				)}
		</section>
	);
};
