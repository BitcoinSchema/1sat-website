import MarketTabs, { MarketTab } from "@/components/pages/market/tabs/tabs";
import { useOrdinals } from "@/context/ordinals";
import { WithRouterProps } from "next/dist/client/with-router";
import Router, { useRouter } from "next/router";
import React, { useEffect, useMemo, useState } from "react";
import { FetchStatus } from "..";

interface PageProps extends WithRouterProps {}

const BSV20Page: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const { bsv20s, getBsv20, fetchBsv20Status } = useOrdinals();

  const currentPage = useMemo(() => {
    return typeof router.query.page === "string"
      ? parseInt(router.query.page)
      : 1;
  }, [router.query.page]);

  const [lastPage, setLastPage] = useState(currentPage);

  useEffect(() => {
    console.log("currentPage", currentPage);
    const fire = async () => {
      console.log("get page", currentPage);
      await getBsv20(currentPage);
    };
    if (fetchBsv20Status === FetchStatus.Idle || lastPage !== currentPage) {
      fire();
      setLastPage(currentPage);
    }
  }, [lastPage, currentPage, getBsv20, fetchBsv20Status]);

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

  return (
    <div>
      <MarketTabs currentTab={MarketTab.BSV20} />
      <h1 className="text-center mt-2 mb-6 text-4xl text-yellow-600 font-mono font-semibold">
        BSV-20 (Fungible Tokens)
      </h1>
      {fetchBsv20Status === FetchStatus.Success && (
        <div className="grid grid-cols-4 gap-4">
          <>
            <div className="text-left">Ticker</div>
            <div className="text-left">Limit/Mint</div>
            <div className="text-center">Supply</div>
            <div className="text-right">Available</div>
          </>
          {bsv20s?.map((bsv20, index) => {
            return (
              <React.Fragment key={`${bsv20.tick}-${index}`}>
                <div>{bsv20.tick}</div>
                <div>{parseInt(bsv20.lim || "0") === 0 ? "∞" : bsv20.lim}</div>
                <div className="text-right">
                  {bsv20.supply} / {bsv20.max}
                </div>
                <div className="text-right">
                  {parseInt(bsv20.max!) - parseInt(bsv20.supply!)}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
      {pagination}
    </div>
  );
};

export default BSV20Page;
