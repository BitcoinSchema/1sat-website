import Artifact from "@/components/artifact";
import MarketTabs, { MarketTab } from "@/components/pages/market/tabs";
import Tabs, { Tab } from "@/components/tabs";
import { Dir, useOrdinals } from "@/context/ordinals";
import { WithRouterProps } from "next/dist/client/with-router";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FetchStatus } from "..";

interface PageProps extends WithRouterProps {}

export const enum SortListingsBy {
  Price = "price",
  Recent = "recent",
}

const ListingsPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const [dir, setDir] = useState<Dir>(Dir.DESC);
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState<SortListingsBy>(SortListingsBy.Recent);
  const [lastSortBy, setLastSortBy] = useState<SortListingsBy>(sortBy);
  const [lastDir, setLastDir] = useState<Dir>(dir);

  const { filteredListings, getListings, fetchListingsStatus } = useOrdinals();
  const searchParams = useSearchParams();
  const page = searchParams.get("page");

  const currentPage = useMemo(() => {
    return typeof page === "string" ? parseInt(page) : 1;
  }, [page]);

  const [lastPage, setLastPage] = useState(currentPage);

  useEffect(() => {
    const fire = async () => {
      await getListings(currentPage, sortBy, dir);
    };
    if (
      fetchListingsStatus === FetchStatus.Idle ||
      lastPage !== currentPage ||
      sortBy !== lastSortBy ||
      dir !== lastDir
    ) {
      fire();
      setLastPage(currentPage);
      setLastDir(dir);
      setLastSortBy(sortBy);
    }
  }, [
    currentPage,
    filteredListings,
    getListings,
    fetchListingsStatus,
    sortBy,
    dir,
    lastPage,
    lastSortBy,
    lastDir,
  ]);

  const pagination = useMemo(() => {
    return (
      <div className="text-center h-full flex items-center justify-center">
        <div className="flex items-center justify-between max-w-2xl">
          {/* <div className="">
            <button
              className="bg-[#111] rounded mb-8 text-sm p-2 md:p-4 my-4 mr-4"
              onClick={() =>
                router.push(`${parseInt(inscriptionId as string) - 100}`)
              }
            >
              -100
            </button>
          </div> */}
          <div className="">
            <button
              className="bg-[#111] rounded mb-8 text-sm p-2 md:p-4 my-4"
              onClick={() =>
                router.push(
                  `/market/listings/?page=${
                    currentPage ? currentPage - 1 : 1
                  }&sortBy=${sortBy}&dir=${dir}`
                )
              }
            >
              Prev
            </button>
          </div>
          <div className="bg-[#111] rounded flex items-center mb-8 max-w-2xl text-sm p-2 md:p-4 m-4">
            Page {currentPage}
          </div>
          <div className="">
            <button
              className="bg-[#111] rounded mb-8 text-sm p-2 md:p-4 my-4"
              onClick={() =>
                router.push(
                  currentPage
                    ? `/market/listings/?page=${
                        currentPage + 1
                      }&sortBy=${sortBy}&dir=${dir}`
                    : `/market/listings/?page=2&sortBy=${sortBy}&dir=${dir}`
                )
              }
            >
              Next
            </button>
          </div>
          {/* <div className="">
            <button
              className="bg-[#111] rounded mb-8 text-sm p-2 md:p-4 my-4 ml-4"
              onClick={() =>
                router.push(`/${parseInt(inscriptionId as string) + 100}`)
              }
            >
              +100
            </button>
          </div> */}
        </div>
      </div>
    );
  }, [dir, sortBy, router, currentPage]);

  const sortPrice = useCallback(() => {
    if (sortBy === SortListingsBy.Price) {
      setDir(dir === Dir.ASC ? Dir.DESC : Dir.ASC);
    } else {
      setSortBy(SortListingsBy.Price);
    }
  }, [sortBy, dir]);

  const sortRecent = useCallback(() => {
    if (sortBy === SortListingsBy.Recent) {
      setDir(dir === Dir.ASC ? Dir.DESC : Dir.ASC);
    } else {
      setSortBy(SortListingsBy.Recent);
    }
  }, [sortBy, dir]);

  return (
    <div>
      <Tabs currentTab={Tab.Market} />

      <MarketTabs currentTab={MarketTab.Listings} />
      <h1 className="flex items-center text-center mt-2 mb-6 text-4xl text-yellow-600 font-mono font-semibold justify-between px-2">
        <div>Market Listings</div>
        <div onClick={() => setShowSort(true)} className="cursor-pointer">
          Sort
        </div>
      </h1>
      {fetchListingsStatus === FetchStatus.Success && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2 max-w-7xl">
          {filteredListings?.map((l) => {
            return (
              <div key={l.origin?.outpoint}>
                <Artifact
                  key={l.origin?.outpoint || `${l.txid}_${l.vout}`}
                  origin={l.origin?.outpoint || `${l.txid}_${l.vout}`}
                  outPoint={l.outpoint}
                  contentType={l.origin?.data?.insc?.file?.type}
                  num={l.origin?.num}
                  classNames={{
                    wrapper:
                      "max-w-72 max-h-72 overflow-hidden mb-2 cursor-pointer",
                  }}
                  txid={l.txid}
                  price={l.data?.list?.price || 0}
                  height={l.height}
                  isListing={true}
                  sigma={l.origin?.data?.sigma}
                  clickToZoom={false}
                  onClick={() => {
                    router.push(
                      `/inscription/${encodeURIComponent(l.origin?.num || "")}`
                    );
                  }}
                />
              </div>
            );
          })}
          {showSort && (
            <div
              className="z-10 flex items-center justify-center fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50"
              onClick={() => setShowSort(false)}
            >
              <div
                className="w-full max-w-lg m-auto p-4 bg-[#111] trext-[#aaa] rounded flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4">Sort By</div>

                <div
                  onClick={() => {
                    setShowSort(false);
                    sortRecent();
                  }}
                  className="mb-4 p-2 cursor-pointer rounded text-black font-semibold transition bg-yellow-500 hover:bg-yellow-600"
                >
                  Recent
                </div>
                <div
                  onClick={() => {
                    setShowSort(false);
                    sortPrice();
                  }}
                  className="mb-4 p-2 cursor-pointer rounded text-black font-semibold transition bg-yellow-500 hover:bg-yellow-600"
                >
                  Price
                </div>
                <button
                  className="bg-[#222] p-2 rounded cusros-pointer hover:bg-emerald-600 text-white"
                  onClick={() => setShowSort(false)}
                >
                  CLOSE
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {pagination}
    </div>
  );
};

export default ListingsPage;
