import MarketTabs, { MarketTab } from "@/components/pages/market/tabs";
import { API_HOST, Dir, SortBy, useOrdinals } from "@/context/ordinals";
import { WithRouterProps } from "next/dist/client/with-router";
import Router, { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowDown, FiArrowUp } from "react-icons/fi";
import { FetchStatus } from "..";

interface PageProps extends WithRouterProps {}

const BSV20Page: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const [dir, setDir] = useState<Dir>(Dir.DESC);
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.Height);
  const { bsv20s, getBsv20, fetchBsv20Status, fetchStatsStatus, stats } =
    useOrdinals();

  const [lastSortBy, setLastSortBy] = useState<SortBy>(sortBy);
  const [lastDir, setLastDir] = useState<Dir>(dir);

  const currentPage = useMemo(() => {
    return typeof router.query.page === "string"
      ? parseInt(router.query.page)
      : 1;
  }, [router.query.page]);

  const [lastPage, setLastPage] = useState(currentPage);
  const [ticker, setTicker] = useState<string>();

  useEffect(() => {
    const fire = async () => {
      console.log("fire", currentPage, sortBy, dir);
      await getBsv20(currentPage, sortBy, dir);
    };
    if (
      fetchBsv20Status === FetchStatus.Idle ||
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
    lastPage,
    currentPage,
    getBsv20,
    fetchBsv20Status,
    sortBy,
    dir,
    lastSortBy,
    lastDir,
  ]);

  const changeTicker = useCallback(
    (e: any) => {
      setTicker(e.target.value);
    },
    [setTicker]
  );

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
          {currentPage > 1 && (
            <div className="">
              <button
                className="bg-[#111] rounded mb-8 text-sm p-2 md:p-4 my-4"
                onClick={() =>
                  Router.push(
                    `/market/bsv20/?page=${currentPage ? currentPage - 1 : 1}`
                  )
                }
              >
                Prev
              </button>
            </div>
          )}
          <div className="bg-[#111] rounded flex items-center mb-8 max-w-2xl text-sm p-2 md:p-4 m-4">
            Page {currentPage}
          </div>
          <div className="">
            <button
              className="bg-[#111] rounded mb-8 text-sm p-2 md:p-4 my-4"
              onClick={() =>
                Router.push(
                  currentPage
                    ? `/market/bsv20/?page=${currentPage + 1}`
                    : "/market/bsv20/?page=2"
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
  }, [currentPage]);

  const findTicker = useCallback(async () => {
    const resp = await fetch(`${API_HOST}/api/bsv20/${ticker}`);
    if (resp.status === 200) {
      Router.push(`/market/bsv20/${ticker}`);
    } else if (resp.status === 404) {
      alert("Ticker not found");
    }
  }, [ticker]);

  const tickerKeyDown = useCallback(
    (e: any) => {
      if (e.key === "Enter") {
        findTicker();
      }
    },
    [findTicker]
  );

  const availableArrow = useMemo(() => {
    if (sortBy === SortBy.Available) {
      if (dir === Dir.ASC) {
        return <FiArrowDown className="text-white w-4 mr-2" />;
      } else {
        return <FiArrowUp className="text-white w-4 mr-2" />;
      }
    }
    return null;
  }, [sortBy, dir]);

  const sortAvailable = useCallback(() => {
    if (sortBy === SortBy.Available) {
      setDir(dir === Dir.ASC ? Dir.DESC : Dir.ASC);
    } else {
      setSortBy(SortBy.Available);
    }
  }, [sortBy, dir]);

  return (
    <div>
      <MarketTabs currentTab={MarketTab.BSV20} />
      <h1 className="text-center mt-2 mb-6 text-4xl text-yellow-600 font-mono font-semibold">
        BSV-20 (Fungible Tokens)
      </h1>

      <div className="flex items-center mb-6">
        <input
          type="text"
          className="p-2  rounded w-full"
          maxLength={4}
          onChange={changeTicker}
          onKeyDown={tickerKeyDown}
        />
        <button onClick={findTicker} className="p-2 bg-[#111] rounded ml-2">
          Find
        </button>
      </div>
      {fetchBsv20Status === FetchStatus.Success && (
        <div className="grid grid-cols-4">
          <>
            <div className="text-left text-[#555] font-semibold">Ticker</div>
            <div className="text-left text-[#555] font-semibold">
              Limit/Mint
            </div>
            <div className="text-center text-[#555] font-semibold">Supply</div>
            <div
              className="flex items-center justify-end text-[#555] font-semibold cursor-pointer hover:text-blue-500 transition"
              onClick={sortAvailable}
            >
              {availableArrow} Available
            </div>
          </>
          <hr className="bg-[#333] border-0 h-[1px] my-4 col-span-4" />
          {bsv20s?.map((bsv20, index) => {
            return parseInt(bsv20.max || "0") > 0 ? (
              <React.Fragment key={`${bsv20.tick}-${index}`}>
                <div
                  className="p-2 font-semibold cursor-pointer hover:text-blue-500 transition"
                  onClick={() => Router.push(`/market/bsv20/${bsv20.tick}`)}
                >
                  {bsv20.tick}
                </div>

                <div className="text-[#AAA]">
                  {parseInt(bsv20.lim || "0") === 0 ? "∞" : bsv20.lim}
                </div>
                <div className="text-right text-[#AAA]">
                  {bsv20.supply} / {bsv20.max}
                </div>
                <div
                  className={`text-right ${
                    fetchStatsStatus !== FetchStatus.Loading &&
                    stats &&
                    stats.settled + 6 < stats.latest
                      ? "text-red-500"
                      : parseInt(bsv20.max!) - parseInt(bsv20.supply!) > 0
                      ? "text-emerald-400"
                      : "text-[#555]"
                  }`}
                >
                  {parseInt(bsv20.max!) - parseInt(bsv20.supply!)}
                </div>
              </React.Fragment>
            ) : (
              <></>
            );
          })}
        </div>
      )}
      {pagination}
    </div>
  );
};

export default BSV20Page;
