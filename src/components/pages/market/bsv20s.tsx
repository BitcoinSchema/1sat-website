import MarketTabs, { MarketTab } from "@/components/pages/market/tabs";
import Tabs, { Tab } from "@/components/tabs";
import { API_HOST, Dir, SortBy, useOrdinals } from "@/context/ordinals";
import { WithRouterProps } from "next/dist/client/with-router";
import { useSearchParams } from "next/navigation";
import Router from "next/router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiArrowDown, FiArrowUp } from "react-icons/fi";
import { FetchStatus } from "..";

interface PageProps extends WithRouterProps {}

const BSV20Page: React.FC<PageProps> = ({}) => {
  const [dir, setDir] = useState<Dir>(Dir.DESC);
  const [sortBy, setSortBy] = useState<SortBy>(SortBy.Height);
  const { bsv20s, getBsv20, fetchBsv20Status, fetchStatsStatus, stats } =
    useOrdinals();

  const [lastSortBy, setLastSortBy] = useState<SortBy>(sortBy);
  const [lastDir, setLastDir] = useState<Dir>(dir);
  const searchParams = useSearchParams();
  const page = searchParams.get("page");

  const currentPage = useMemo(() => {
    return typeof page === "string" ? parseInt(page) : 1;
  }, [page]);

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
                    `/market/bsv20/?page=${
                      currentPage ? currentPage - 1 : 1
                    }&sortBy=${sortBy}&dir=${dir}`
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
                    ? `/market/bsv20/?page=${
                        currentPage + 1
                      }&sortBy=${sortBy}&dir=${dir}`
                    : `/market/bsv20/?page=2&sortBy=${sortBy}&dir=${dir}&included=true`
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
  }, [dir, sortBy, currentPage]);

  const findTicker = useCallback(async () => {
    const resp = await fetch(`${API_HOST}/api/bsv20/tick/${ticker}`);
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

  const tickerArrow = useMemo(() => {
    if (sortBy === SortBy.Tick) {
      if (dir === Dir.DESC) {
        return <FiArrowDown className="w-4 mr-2" />;
      } else {
        return <FiArrowUp className="w-4 mr-2" />;
      }
    }
    return null;
  }, [sortBy, dir]);

  const heightArrow = useMemo(() => {
    if (sortBy === SortBy.Height) {
      if (dir === Dir.DESC) {
        return <FiArrowDown className="w-4 mr-2" />;
      } else {
        return <FiArrowUp className="w-4 mr-2" />;
      }
    }
    return null;
  }, [sortBy, dir]);

  const limitArrow = useMemo(() => {
    if (sortBy === SortBy.Max) {
      if (dir === Dir.DESC) {
        return <FiArrowDown className="w-4 mr-2" />;
      } else {
        return <FiArrowUp className="w-4 mr-2" />;
      }
    }
    return null;
  }, [sortBy, dir]);

  const pctMintedArrow = useMemo(() => {
    if (sortBy === SortBy.PC) {
      if (dir === Dir.DESC) {
        return <FiArrowDown className="w-4 mr-2" />;
      } else {
        return <FiArrowUp className="w-4 mr-2" />;
      }
    }
    return null;
  }, [sortBy, dir]);

  const sortHeight = useCallback(() => {
    if (sortBy === SortBy.Height) {
      setDir(dir === Dir.ASC ? Dir.DESC : Dir.ASC);
    } else {
      setSortBy(SortBy.Height);
    }
  }, [sortBy, dir]);

  const sortPctMinted = useCallback(() => {
    if (sortBy === SortBy.PC) {
      setDir(dir === Dir.ASC ? Dir.DESC : Dir.ASC);
    } else {
      setSortBy(SortBy.PC);
    }
  }, [sortBy, dir]);

  const sortLimit = useCallback(() => {
    if (sortBy === SortBy.Max) {
      setDir(dir === Dir.ASC ? Dir.DESC : Dir.ASC);
    } else {
      setSortBy(SortBy.Max);
    }
  }, [sortBy, dir]);

  const sortTicker = useCallback(() => {
    if (sortBy === SortBy.Tick) {
      setDir(dir === Dir.ASC ? Dir.DESC : Dir.ASC);
    } else {
      setSortBy(SortBy.Tick);
    }
  }, [sortBy, dir]);

  const pctColor = (pct: number) => {
    if (pct < 25) {
      return "bg-emerald-500";
    } else if (pct < 65) {
      return "bg-orange-400 bg-opacity-75";
    } else if (pct < 99) {
      return "bg-red-400 bg-opacity-75";
    } else {
      return "bg-[#222]";
    }
  };

  // log bsv20s
  useEffect(() => {
    console.log({ bsv20s });
  }, [bsv20s]);

  return (
    <div>
      <Tabs currentTab={Tab.Market} />

      <MarketTabs currentTab={MarketTab.BSV20} />

      <div className="flex items-center mb-6 px-4 md:max-w-lg md:mx-auto">
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
        <div className="flex flex-col md:grid md:grid-cols-12 gap-2">
          <>
            <div
              className="col-span-2 hidden md:flex items-center text-left text-[#555] font-semibold cursor-pointer w-24 hover:text-blue-500 transition"
              onClick={sortTicker}
            >
              {tickerArrow} Ticker
            </div>
            <div
              className="col-span-2 hidden md:flex items-center text-left text-[#555] font-semibold cursor-pointer hover:text-blue-500 transition"
              onClick={sortLimit}
            >
              {limitArrow} Limit/Mint
            </div>
            <div
              className="col-span-5 hidden md:flex items-center text-center text-[#555] font-semibold cursor-pointer hover:text-blue-500 transition"
              onClick={sortPctMinted}
            >
              {pctMintedArrow} Supply
            </div>
            <div
              className="col-span-3 hidden md:flex items-center justify-end text-[#555] font-semibold cursor-pointer hover:text-blue-500 transition"
              onClick={sortHeight}
            >
              {heightArrow} Height
            </div>
          </>
          <hr className="bg-[#333] border-0 h-[1px] my-4 col-span-12" />
          {bsv20s?.map((bsv20, index) => {
            return parseInt(bsv20.max || "0") > 0 ? (
              <React.Fragment key={`tick-${bsv20.tick}-${index}`}>
                <div
                  className="col-span-2 px-2 w-24 font-semibold cursor-pointer hover:text-blue-500 transition"
                  onClick={() => Router.push(`/market/bsv20/${bsv20.tick}`)}
                >
                  {bsv20.tick}
                </div>

                <div className="col-span-2 px-2 text-[#AAA]">
                  <span className="md:hidden">Limit/Mint: </span>
                  {parseInt(bsv20.lim || "0") === 0 ? "∞" : bsv20.lim}
                </div>
                <div className="px-2 col-span-6 md:hidden flex items-center text-right text-[#777] relative w-full">
                  <div className="">
                    {bsv20.supply} / {bsv20.max}
                  </div>
                </div>
                <div className="col-span-6 md:flex hidden text-right text-[#AAA] relative">
                  {bsv20.supply} / {bsv20.max}
                  <div className="hidden md:block w-full bg-[#151515] rounded-full h-1 position absolute bottom-0 right-0">
                    <div
                      className={`${pctColor(
                        parseInt(bsv20.pct_minted || "0")
                      )} h-1 rounded-full`}
                      style={{ width: `${bsv20.pct_minted || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div
                  className={`col-span-2 hidden md:flex justify-end text-right text-[#AAA]`}
                >
                  {bsv20.height}
                </div>
                <div className="col-span-12 block md:hidden w-full bg-[#151515] rounded-full h-1 mb-4">
                  <div
                    className={`${pctColor(
                      parseInt(bsv20.pct_minted || "0") || 0
                    )} h-1 rounded-full`}
                    style={{
                      width: `${parseInt(bsv20.pct_minted || "0") || 0}%`,
                    }}
                  ></div>
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
