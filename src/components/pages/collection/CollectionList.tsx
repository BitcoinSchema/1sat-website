"use client";

import { useSignals } from "@preact/signals-react/runtime";
import { Loader2, Package, ShoppingBag, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import Artifact from "@/components/artifact";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { FetchStatus, NUMBER_OF_ITEMS_PER_PAGE } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import {
  fetchCollectionItems,
  fetchCollectionMarket,
  type ItemFilters,
  type MarketFilters,
} from "@/utils/fetchCollectionData";
import {
  CollectionFilters,
  hasActiveFilters,
  itemSort,
  marketSort,
  maxPrice,
  minPrice,
  type TraitData,
  traitsParam,
} from "./CollectionFilters";
import { Tab } from "./CollectionNavigation";

// Parse subTypeData JSON and extract traits
const parseTraits = (item: OrdUtxo): { name: string; value: string }[] => {
  try {
    const subTypeData = item.origin?.data?.map?.subTypeData;
    if (!subTypeData) return [];
    const data =
      typeof subTypeData === "string" ? JSON.parse(subTypeData) : subTypeData;
    return Array.isArray(data?.traits) ? data.traits : [];
  } catch {
    return [];
  }
};

// Extract trait facets from items for filter UI
const extractTraitFacets = (items: OrdUtxo[]): TraitData[] => {
  const facets = new Map<string, Map<string, number>>();

  for (const item of items) {
    const traits = parseTraits(item);
    for (const { name, value } of traits) {
      if (!name || !value) continue;
      if (!facets.has(name)) facets.set(name, new Map());
      const valMap = facets.get(name)!;
      valMap.set(value, (valMap.get(value) || 0) + 1);
    }
  }

  return Array.from(facets.entries()).map(([name, valMap]) => ({
    name,
    values: Array.from(valMap.keys()),
    counts: Array.from(valMap.values()),
  }));
};

type CollectionListProps = {
  collectionId: string;
};

export const CollectionList = ({ collectionId }: CollectionListProps) => {
  useSignals();
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

  // Track filter version to trigger reloads
  const [filterVersion, setFilterVersion] = useState(0);

  // Extracted trait facets for filter UI
  const [traitFacets, setTraitFacets] = useState<TraitData[]>([]);

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
      setLoading((prevLoading) => {
        const newLoading = new Map(prevLoading);
        newLoading.set(tab as Tab, status);
        return newLoading;
      });
    },
    [],
  );

  // Get current filter values
  const currentTraits = traitsParam.value;
  const currentItemSort = itemSort.value;
  const currentMarketSort = marketSort.value;
  const currentMinPrice = minPrice.value;
  const currentMaxPrice = maxPrice.value;

  const loadMore = useCallback(
    async (reset = false) => {
      setLoadingStatus(tab, FetchStatus.Loading);

      const offset = reset ? 0 : isMarketTab ? marketOffset : itemsOffset;

      if (isMarketTab) {
        const filters: MarketFilters = {
          traits: currentTraits || undefined,
          sort: currentMarketSort,
          minPrice: currentMinPrice ? Number(currentMinPrice) : undefined,
          maxPrice: currentMaxPrice ? Number(currentMaxPrice) : undefined,
        };
        const newItems =
          (await fetchCollectionMarket(
            collectionId,
            offset,
            NUMBER_OF_ITEMS_PER_PAGE,
            filters,
          )) ?? [];

        if (reset || offset === 0) {
          setMarketItems(newItems);
          setMarketOffset(NUMBER_OF_ITEMS_PER_PAGE);
          // Extract traits from first page (no filters active) for filter UI
          if (!currentTraits) {
            setTraitFacets(extractTraitFacets(newItems));
          }
        } else {
          setMarketItems((i) => {
            const combined = [...i, ...newItems];
            // Update trait facets with more data (only when not filtered)
            if (!currentTraits) {
              setTraitFacets(extractTraitFacets(combined));
            }
            return combined;
          });
          setMarketOffset((o) => o + NUMBER_OF_ITEMS_PER_PAGE);
        }
        setHasMoreMarket(newItems.length >= NUMBER_OF_ITEMS_PER_PAGE);
      } else {
        const filters: ItemFilters = {
          traits: currentTraits || undefined,
          sort: currentItemSort,
        };
        const newItems =
          (await fetchCollectionItems(
            collectionId,
            offset,
            NUMBER_OF_ITEMS_PER_PAGE,
            filters,
          )) ?? [];
        if (reset || offset === 0) {
          setItems(newItems);
          setItemsOffset(NUMBER_OF_ITEMS_PER_PAGE);
          // Extract traits from first page (no filters active) for filter UI
          if (!currentTraits) {
            setTraitFacets(extractTraitFacets(newItems));
          }
        } else {
          setItems((i) => {
            const combined = [...i, ...newItems];
            // Update trait facets with more data (only when not filtered)
            if (!currentTraits) {
              setTraitFacets(extractTraitFacets(combined));
            }
            return combined;
          });
          setItemsOffset((o) => o + NUMBER_OF_ITEMS_PER_PAGE);
        }
        setHasMoreItems(newItems.length >= NUMBER_OF_ITEMS_PER_PAGE);
      }

      setLoadingStatus(tab, FetchStatus.Success);
    },
    [
      setLoadingStatus,
      tab,
      isMarketTab,
      collectionId,
      marketOffset,
      itemsOffset,
      currentTraits,
      currentItemSort,
      currentMarketSort,
      currentMinPrice,
      currentMaxPrice,
    ],
  );

  // Reset and reload when filters change
  const handleFilterChange = useCallback(() => {
    setFilterVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    if (filterVersion > 0) {
      // Reset offsets when filters change
      if (isMarketTab) {
        setMarketOffset(0);
        setMarketItems([]);
      } else {
        setItemsOffset(0);
        setItems([]);
      }
      loadMore(true);
    }
  }, [filterVersion, isMarketTab]);

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
      {/* Filter Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground uppercase tracking-wider">
            {itemsToDisplay.length} {isMarketTab ? "listings" : "items"}
          </span>
          {hasActiveFilters.value && (
            <span className="text-xs text-primary">• Filtered</span>
          )}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`gap-2 font-mono text-xs uppercase tracking-wider ${hasActiveFilters.value ? "border-primary text-primary" : ""
                }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters.value && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[320px] p-4">
            <CollectionFilters
              isMarketTab={isMarketTab}
              traits={traitFacets}
              onFilterChange={handleFilterChange}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Loading skeleton */}
      {loading.get(tab) === FetchStatus.Loading &&
        itemsToDisplay.length === 0 && (
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
                sizes={
                  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                }
                priority={idx < 10}
                showListingTag={!!item.data?.list?.price}
                classNames={{
                  wrapper:
                    "bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors",
                  media: "bg-card",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Loading indicator for pagination */}
      {loading.get(tab) === FetchStatus.Loading &&
        itemsToDisplay.length > 0 && (
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
              onClick={() => loadMore()}
              className="rounded-md font-mono text-xs uppercase tracking-wider"
            >
              Load More
            </Button>
          </div>
        )}
    </section>
  );
};
