"use client";

import { API_HOST, resultsPerPage } from "@/constants";
import { ordUtxos } from "@/signals/wallet";
import type { OrdUtxo } from "@/types/ordinals";
import { getOutpoints } from "@/utils/address";
import { useLocalStorage } from "@/utils/storage";
import { computed, useSignal } from "@preact/signals-react";
import { useSignals } from "@preact/signals-react/runtime";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useInView } from "framer-motion";
import { useEffect, useRef } from "react";
import { FiLoader } from "react-icons/fi";
import { selectedType } from "../Wallet/filter";
import { ArtifactType, artifactTypeMap } from "../artifact";
import Ordinals from "../ordinals";
import { checkOutpointFormat } from "./helpers";
import { uniq } from "lodash";

interface Props {
  address: string;
  listings?: OrdUtxo[];
  onClick?: (outpoint: string) => Promise<void>;
}

const GridList = ({ address, listings: listingsProp, onClick }: Props) => {
  useSignals();
  const ref = useRef(null);
  const isInView = useInView(ref);
  const listings = useSignal<OrdUtxo[]>(listingsProp || []);

  const [selectedArtifactType, setSelectedArtifactType] =
    useLocalStorage<ArtifactType>("1ssartt", ArtifactType.All);

  useEffect(() => {
    // init from localStorage when available and not already set
    if (!selectedType.value && !!selectedArtifactType) {
      selectedType.value = selectedArtifactType || null;
    }
  }, [selectedArtifactType, selectedType]);

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
    queryFn: ({ pageParam }) =>
      getWalletOrdUtxos({
        address,
        pageParam,
        selectedType: selectedType.value,
      }),
    getNextPageParam: (lastPage, pages, lastPageParam) => {
      if (lastPage?.length === resultsPerPage) {
        return lastPageParam + 1;
      }
      return undefined;
    },
    initialPageParam: 0,
  });
  // useEffects remain the same for data fetching and error handling

  // set the ord utxos
  useEffect(() => {
    if (data) {
      console.log("data", data);
      const pageData = data.pages[data.pages.length - 1];
      if (pageData !== undefined) {
        // ordUtxos.value = data.pages.reduce((acc, val) => acc.concat(val), []);
        const u = data.pages.reduce(
          (acc, val) => (acc || []).concat(val || []),
          []
        );
        if (u) {
          ordUtxos.value = u;
          listings.value = ordUtxos.value || [];
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, listings, data?.pages[data.pages.length - 1]]);

  useEffect(() => {
    const newPageData = data?.pages[data.pages.length - 1];
    if (isInView && newPageData && !isFetchingNextPage && hasNextPage) {
      fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInView]);

  const collectionIds = computed(() =>
    uniq(listings.value.reduce((i, v) => {
      const cid = v.origin?.data?.map?.subTypeData?.collectionId;
      if (cid && checkOutpointFormat(cid)) {
        i.push(cid);
      }
      return i;
    }, [] as string[]))
  );

  const { data: collectionData } = useQuery({
    queryKey: ["collections", collectionIds.value?.length > 0],
    queryFn: () => getOutpoints(collectionIds.value, false),
  });

  const collections = useSignal(collectionData || []);

  return (
    listings && (
      <tbody
        className={`${"my-12"} max-w-7xl mx-auto w-[calc(100vw-4rem)] min-h-[300px]`}
      >
        <tr>
          <td className="">
            <div className="p-0">
              <Ordinals
                artifacts={listings.value}
                onClick={onClick}
              />

              {/* {listings.value.map((listing) => {
                const collection = listingCollection(listing, collections);
                const price = `${toBitcoin(listing?.data?.list?.price || "0", true).toString()} BSV`;
                return (
                  listing && (
                    // <div key={`${listing?.txid}-${listing?.vout}-${listing?.height}`} className="grid-item p-4 shadow rounded-lg">
                    //   <div className="artifact-container mb-4">
                    //     <Artifact
                    //       classNames={{
                    //         wrapper: "bg-transparent",
                    //         media: "rounded bg-[#111] text-center p-0 h-full",
                    //       }}
                    //       artifact={listing}
                    //       size={100}
                    //       sizes={"100vw"}
                    //       showFooter={false}
                    //       priority={false}
                    //       to={`/outpoint/${listing?.outpoint}`}
                    //     />
                    //   </div>
                    //   <div className="flex flex-col">
                    //     <p className="text-lg font-semibold truncate">{listingName(listing)}</p>
                    //     {collection && (
                    //       <Link
                    //         href={`/collection/${listing?.origin?.data?.map?.subTypeData?.collectionId}`}
                    //         className="text-sm text-blue-500 hover:text-blue-600"
                    //       >
                    //         {collection.name} {mintNumber(listing, collection)}
                    //       </Link>
                    //     )}
                    //     <div className="text-sm text-neutral-500 mt-2">{listing?.origin?.num}</div>
                    //     <div className="text-lg text-neutral-700 font-bold mt-1">{price}</div>
                    //   </div>
                    // </div>
                  )
                );
              })} */}
              <div
                ref={ref}
                className="col-span-full flex justify-center py-4"
              >
                {hasNextPage ? (
                  <FiLoader className="animate-spin" />
                ) : null}
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    )
  );
};

export default GridList;

export const getWalletOrdUtxos = async ({
  address,
  pageParam,
  selectedType,
}: {
  address: string;
  pageParam: number;
  selectedType: ArtifactType | null;
}) => {
  if (!address) return;
  // console.log("getOrdUtxos called", address, pageParam, selectedType);
  const offset = resultsPerPage * pageParam;
  let url = `${API_HOST}/api/txos/address/${address}/unspent?limit=${resultsPerPage}&offset=${offset}&dir=DESC&status=all&bsv20=false`;

  if (selectedType && selectedType !== ArtifactType.All) {
    url += `&type=${artifactTypeMap.get(selectedType)}`;
  }
  const res = await fetch(url);
  // filter for the selected type
  const json = res.json() as Promise<OrdUtxo[]>;

  const result = await json;
  const final =
    selectedType !== ArtifactType.All
      ? result.filter((o) => {
        return o.origin?.data?.insc?.file.type?.startsWith(
          artifactTypeMap.get(
            selectedType as ArtifactType
          ) as string
        );
      })
      : result;
  return final;
};

