"use client";

import Artifact from "@/components/artifact";
import { NUMBER_OF_ITEMS_PER_PAGE } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import {
  fetchCollectionItems,
  fetchCollectionMarket,
} from "@/utils/fetchCollectionData";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
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

  const hasMore = isMarketTab ? hasMoreMarket : hasMoreItems;
  const itemsToDisplay = isMarketTab ? marketItems : items;

  const loadMore = useCallback(async () => {
    if (isMarketTab) {
      const newItems =
        (await fetchCollectionMarket(collectionId, marketOffset)) ?? [];

      setMarketItems((i) => [...i, ...newItems]);
      setHasMoreMarket(newItems.length >= NUMBER_OF_ITEMS_PER_PAGE);
      setMarketOffset((offset) => offset + NUMBER_OF_ITEMS_PER_PAGE);
    } else {
      const newItems =
        (await fetchCollectionItems(collectionId, itemsOffset)) ?? [];
      console.log({ newItems });
      setItems((i) => [...i, ...newItems]);
      setHasMoreItems(newItems.length >= NUMBER_OF_ITEMS_PER_PAGE);
      setItemsOffset((offset) => offset + NUMBER_OF_ITEMS_PER_PAGE);
    }
  }, [collectionId, isMarketTab, itemsOffset, marketOffset]);

  useEffect(() => {
    // initial load
    const fire = async () => {
      await loadMore();
    };
    if (itemsOffset === 0 && !isMarketTab) {
      fire();
    }
    if (marketOffset === 0 && isMarketTab) {
      fire();
    }
  }, [loadMore, isMarketTab, marketOffset, itemsOffset]);

  return itemsToDisplay.length ? (
    <>
      <section className="w-full mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 md:gap-4">
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
    <div className="mx-auto my-4 text-center w-full">{`No ${tab}${isMarketTab ? " items" : ""
      } for this collection`}</div>
  );
};
