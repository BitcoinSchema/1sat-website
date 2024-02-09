"use client";

import { API_HOST, AssetType, resultsPerPage } from "@/constants";
import { ordUtxos } from "@/signals/wallet";
import { ordAddress } from "@/signals/wallet/address";
import { OrdUtxo } from "@/types/ordinals";
import { computed, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "framer-motion";
import { uniq } from "lodash";
import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { FaChevronRight } from "react-icons/fa6";
import { toBitcoin } from "satoshi-bitcoin-ts";
import JDenticon from "../JDenticon";
import Artifact from "../artifact";

interface Props {
  address?: string;
  listings?: OrdUtxo[];
}

const List = ({ address: addressProp, listings: listingsProp }: Props) => {
  useSignals();
  const ref = useRef(null);
  const isInView = useInView(ref);

  const listings = useSignal<OrdUtxo[]>(listingsProp || []);

  const address = computed(() => addressProp || ordAddress.value);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["ordinals", address.value],
    queryFn: ({ pageParam }) =>
      getOrdUtxos({ address: address.value!, pageParam }),
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

  // set the ord utxos
  useEffect(() => {
    if (data ) {
      const pageData = data.pages[data.pages.length - 1];
      if (pageData !== undefined) {
        ordUtxos.value = data.pages.reduce((acc, val) => acc.concat(val), []);
        listings.value = ordUtxos.value || [];
      }
    }
  }, [data, listings, status]);

  useEffect(() => {
    const newPageData = data?.pages[data.pages.length - 1];
    if (isInView && newPageData && !isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);

  const collectionIds = computed(
    () =>
      listings.value.reduce((i, v) => {
        const cid = v.origin?.data?.map?.subTypeData?.collectionId;
        if (cid && checkOutpointFormat(cid)) {
          i.push(cid);
        }
        return i;
      }, [] as string[]),
  );

  const { data: collectionData } = useQuery({
    queryKey: ["collections", collectionIds.value?.length > 0],
    queryFn: () => getCollectionIds(collectionIds.value),
  });

  const collections = useSignal(collectionData || []);
  console.log({ collections: collections.value });
  const listingCollection = useCallback(
    (listing: OrdUtxo) => {
      if (listing?.origin?.data?.map) {
        const collectionId = listing?.origin.data.map.subTypeData?.collectionId;
        if (!collectionId) {
          return null;
        }
        const collection = collections.value.find(
          (c: OrdUtxo) => c.outpoint === collectionId
        )?.origin?.data?.map;
        if (collection) {
          return collection;
        }
      }
    },
    [collections]
  );

  const mintNumber = (listing: OrdUtxo, collection: any) => {
    const listingData = listing?.origin?.data?.map;
    let mintNumber: string = listingData?.subTypeData?.mintNumber;
    let qty = collection?.subTypeData?.quantity;
    if (!qty || !mintNumber) {
      return null;
    }
    return `${mintNumber}/${qty}`;
  };

  const listingName = (listing: OrdUtxo) => {
    if (listing?.origin?.data?.bsv20) {
      return listing?.origin.data.bsv20.tick;
    }
    switch (listing?.origin?.data?.insc?.file.type.split(";")[0]) {
      case "image/gif":
      case "image/jpg":
      case "image/jpeg":
      case "image/webp":
      case "image/png":
        return (
          listing?.origin?.data?.map?.name ||
          listing?.origin?.data?.map?.subTypeData?.name ||
          listing?.origin?.data?.map?.app ||
          "Unknown Name"
        );
      case "text/html":
        // extract the title from the html
        const html = listing?.origin?.data?.insc?.text;
        const title = html?.match(/<title>(.*)<\/title>/)?.[1];
        return title || listing?.origin.num;
      case "text/json":
        return listing?.origin?.data?.insc.text || listing?.origin.num;
      case "text/plain":
        return listing?.origin?.data?.insc.text || listing?.origin.num;
      default:
        return listing?.origin?.num || "Unknown";
    }
  };

  return (
    listings && (
      <tbody className="h-full">
        {listings.value.map((listing, idx) => {
          const size = 100;

          const collection = listingCollection(listing);
          const price = `${toBitcoin(
            listing?.data?.list?.price || "0",
            true
          ).toString()} BSV`;
          return (
            listing && (
              <tr key={`${listing?.txid}-${listing?.vout}-${listing?.height}`}>
                <td width={100} height={120} className="p-0">
                  <Artifact
                    classNames={{
                      wrapper: "bg-transparent",
                      media: "rounded bg-[#111] text-center p-0 h-[100px] mr-2",
                    }}
                    artifact={listing}
                    size={size}
                    sizes={"100vw"}
                    showFooter={false}
                    priority={false}
                    to={`/outpoint/${listing?.outpoint}`}
                  />
                </td>

                <td className="flex flex-col h-[100px] p-0 pl-4">
                  <div className="my-auto max-w-64">
                    <p className="text-lg truncate overflow-hidden text-ellipses">
                      {listingName(listing)}
                    </p>
                    {collection && (
                      <div className="flex items-center gap-4">
                        <Link
                          href={`/collection/${listing?.origin?.data?.map?.subTypeData?.collectionId}`}
                          className="text-blue-400 hover:text-blue-500"
                        >
                          {collection.name} {mintNumber(listing, collection)}
                        </Link>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-neutral-content/25">
                      {listing?.origin?.num}
                    </div>
                    <div className={`block md:hidden`}>{price}</div>
                  </div>
                </td>
                <td className={`p-0 hidden md:table-cell w-10`}>
                  <Link href={`/signer/${listing?.owner}`}>
                    <div
                      className="tooltip"
                      data-tip={
                        listing?.data?.sigma?.length
                          ? listing?.data.sigma[0].address
                          : listing?.owner
                      }
                    >
                      <JDenticon className="w-8" hashOrValue={listing?.owner} />
                    </div>
                  </Link>
                </td>
                <td className="p-0 text-xs md:text-sm hidden md:table-cell">
                  {price}
                </td>
                <td className="p-0 md:table-cell hidden text-center w-8">
                  <Link
                    className="text-sm"
                    href={`/outpoint/${listing?.outpoint}?display=${AssetType.Ordinals}`}
                  >
                    <FaChevronRight className="w-6 h-6" />
                  </Link>
                </td>
              </tr>
            )
          );
        })}
        <tr>
          <td>
            <div ref={ref} className="w-full h-1" />
          </td>
        </tr>
      </tbody>
    )
  );
};

export default List;

const checkOutpointFormat = (outpoint: string) => {
  // ensure txid_vout format
  const split = outpoint.split("_");
  if (split.length !== 2) {
    return false;
  }
  if (split[0].length !== 64) {
    return false;
  }
  if (isNaN(parseInt(split[1]))) {
    return false;
  }
  return true;
};

const getOrdUtxos = async ({
  address,
  pageParam,
}: {
  address: string;
  pageParam: number;
}) => {
  if (!address) return;
  console.log("getOrdUtxos called", address, pageParam);
  const offset = resultsPerPage * pageParam;
  const url = `${API_HOST}/api/txos/address/${address}/unspent?limit=${resultsPerPage}&offset=${offset}&dir=DESC&status=all&bsv20=false`;
  const res = await fetch(url);
  return res.json();
};

const getCollectionIds = async (ids: string[]) => {
  const url = `${API_HOST}/api/txos/outpoints?script=false`;
  const uniqueIds = uniq(ids)
  console.log("hitting", url, "with", uniqueIds);
  const res = await fetch(url, {
    method: "POST",
    body: JSON.stringify(uniqueIds),
  });
  const json = await res.json() as OrdUtxo[]
  return json
};
