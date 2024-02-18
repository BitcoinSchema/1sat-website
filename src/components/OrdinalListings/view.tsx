"use client";

import { resultsPerPage } from "@/constants";
import { ordUtxos } from "@/signals/wallet";
import { OrdUtxo } from "@/types/ordinals";
import { useSignal, useSignals } from "@preact/signals-react/runtime";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { OrdViewMode } from ".";
import { selectedType } from "../Wallet/filter";
import GridList from "./grid";
import { getOrdList } from "./helpers";
import List from "./list";

interface ViewProps {
  address?: string;
  listings?: OrdUtxo[];
  mode: OrdViewMode;
}

const View = ({ address, listings: listingsProp, mode }: ViewProps) => {
  useSignals();
  const ref = useRef(null);
  const isInView = useInView(ref);
  const listings = useSignal<OrdUtxo[]>(listingsProp || []);

  // if address is not set this is just showing listings
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
    queryKey: ["ordinals", address, selectedType.value],
    queryFn: ({ pageParam }) => getOrdList({ address, pageParam, selectedType: selectedType.value }),
    getNextPageParam: (lastPage, pages, lastPageParam) => {
      if (lastPageParam === 0) {
        return lastPageParam + 1;
      }
      if (lastPage?.length === resultsPerPage) {
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
        const u = data.pages.reduce((acc, val) => (acc || []).concat(val || []), []);
        if (u) {
          ordUtxos.value = u;
          listings.value = ordUtxos.value || [];
        }
      }
    }
  }, [data, data?.pages.length, listings]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const newPageData = data?.pages[data.pages.length - 1];
    if (isInView && newPageData && !isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);

  if (mode === OrdViewMode.Grid && address) {
    return <GridList listings={listings.value} address={address} />;
  }

  return <List listings={listings.value} refProp={ref} />;
};

export default View;
