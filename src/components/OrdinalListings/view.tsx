"use client";

import { resultsPerPage } from "@/constants";
import { ordUtxos } from "@/signals/wallet";
import { OrdUtxo } from "@/types/ordinals";
import { computed } from "@preact/signals-react";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { OrdViewMode } from ".";
import GridList from "./grid";
import { checkOutpointFormat, getCollectionIds, getOrdUtxos } from "./helpers";
import List from "./list";

interface ViewProps {
  address: string;
  listings?: OrdUtxo[];
  mode: OrdViewMode
}

const View = ({ address, listings: listingsProp, mode}: ViewProps) => {
  useSignals();
  const ref = useRef(null);
  const isInView = useInView(ref);

  const listings = useSignal<OrdUtxo[]>(listingsProp || []);

  console.log({ address, listingsProp, listings });
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["ordinals", address],
    queryFn: ({ pageParam }) => getOrdUtxos({ address, pageParam }),
    getNextPageParam: (lastPage, pages, lastPageParam) => {
      if (lastPageParam === 0) {
        return lastPageParam + 1;
      }
      if (lastPage.length === resultsPerPage) {
        return lastPageParam + 1;
      }
      return undefined;
    },
    initialPageParam: 0,
  });

  useEffect(() => {
    if (error) {
      console.error("Error fetching ordinals", error);
      toast.error("Error fetching ordinals");
    }
  }, [error]);

  // set the ord utxos
  useEffect(() => {
    if (data) {
      const pageData = data.pages[data.pages.length - 1];
      if (pageData !== undefined) {
        ordUtxos.value = data.pages.reduce((acc, val) => acc.concat(val), []);
        listings.value = ordUtxos.value || [];
      }
    }
  }, [data, listings]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const newPageData = data?.pages[data.pages.length - 1];
    if (isInView && newPageData && !isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);

  const collectionIds = computed(() =>
    listings.value.reduce((i, v) => {
      const cid = v.origin?.data?.map?.subTypeData?.collectionId;
      if (cid && checkOutpointFormat(cid)) {
        i.push(cid);
      }
      return i;
    }, [] as string[])
  );

  const { data: collectionData } = useQuery({
    queryKey: ["collections", collectionIds.value?.length > 0],
    queryFn: () => getCollectionIds(collectionIds.value),
  });

  const collections = useSignal(collectionData || []);
  console.log({ collections: collections.value });

  if (mode === OrdViewMode.Grid) {
    return <GridList listings={listings.value} address={address} />;
  }

  return (
    <List
      address={address}
      listings={listings.value}
      collections={collections}
      refProp={ref}
    />
  );
};

export default View;
