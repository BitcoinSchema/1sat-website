"use client";

import Artifact from "@/components/artifact";
import { NUMBER_OF_ITEMS_PER_PAGE } from "@/constants";
import { FetchItemsQuery } from "@/types/collection";
import { OrdUtxo } from "@/types/ordinals";
import {
	fetchCollectionItems,
	fetchCollectionMarket,
} from "@/utils/fetchCollectionData";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Tab } from "./CollectionNavigation";

type CollectionListProps = {
	initialMarketItems: OrdUtxo[];
	initialCollectionItems: OrdUtxo[];
	query: FetchItemsQuery;
};

export const CollectionList = ({
	initialMarketItems,
	initialCollectionItems,
	query,
}: CollectionListProps) => {
	const searchParams = useSearchParams();
	// if there's no tab param, act as if it's market
	const tab = searchParams.get("tab") ?? Tab.Market;
	const isMarketTab = tab === Tab.Market;

	const [marketOffset, setMarketOffset] = useState(NUMBER_OF_ITEMS_PER_PAGE);
	const [itemsOffset, setItemsOffset] = useState(
		isMarketTab ? 0 : NUMBER_OF_ITEMS_PER_PAGE
	);

	const [marketItems, setMarketItems] =
		useState<OrdUtxo[]>(initialMarketItems);
	const [items, setItems] = useState<OrdUtxo[]>(initialCollectionItems);

	const [hasMoreMarket, setHasMoreMarket] = useState(
		initialMarketItems.length >= NUMBER_OF_ITEMS_PER_PAGE
	);
	const [hasMoreItems, setHasMoreItems] = useState(
		initialCollectionItems.length >= NUMBER_OF_ITEMS_PER_PAGE
	);

	const hasMore = isMarketTab ? hasMoreMarket : hasMoreItems;
	const itemsToDisplay = isMarketTab ? marketItems : items;

	const loadMore = async () => {
		if (isMarketTab) {
			const newItems =
				(await fetchCollectionMarket(query, marketOffset)) ?? [];

			setMarketItems((i) => [...i, ...newItems]);
			setHasMoreMarket(newItems.length >= NUMBER_OF_ITEMS_PER_PAGE);
			setMarketOffset((offset) => offset + NUMBER_OF_ITEMS_PER_PAGE);
		} else {
			const newItems =
				(await fetchCollectionItems(query, itemsOffset)) ?? [];

			setItems((i) => [...i, ...newItems]);
			setHasMoreItems(newItems.length >= NUMBER_OF_ITEMS_PER_PAGE);
			setItemsOffset((offset) => offset + NUMBER_OF_ITEMS_PER_PAGE);
		}
	};

	return itemsToDisplay.length ? (
		<>
			<section className="2xl:max-w-[70vw] max-w-[80vw] mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 md:gap-4">
				{itemsToDisplay.map((item, idx) => {
					return (
						<Artifact
							key={`${item.txid}-${item.vout}-${item.height}-${idx}`}
							to={`/outpoint/${item.outpoint}`}
							artifact={item}
							size={600}
							sizes={"100vw"}
							priority={idx < 10}
							showListingTag={!!item.data?.list?.price}
						/>
					);
				})}
			</section>
			{hasMore && (
				<div className="w-full flex justify-center mt-4">
					<button type="button" className="btn" onClick={loadMore}>
						Load More
					</button>
				</div>
			)}
		</>
	) : (
		<div className="mx-auto my-4 text-center">{`No ${tab}${
			isMarketTab ? " items" : ""
		} for this collection`}</div>
	);
};
