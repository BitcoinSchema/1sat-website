import Artifact from "@/components/artifact";
import MarketTabs, { MarketTab } from "@/components/pages/market/tabs";
import { useOrdinals } from "@/context/ordinals";
import { WithRouterProps } from "next/dist/client/with-router";
import { useRouter } from "next/router";
import React, { useEffect, useMemo } from "react";
import { FetchStatus } from "..";

interface PageProps extends WithRouterProps {}

const ListingsPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const { page } = router.query as { page: string | undefined };

  const { listings, getListings, fetchListingsStatus } = useOrdinals();

  useEffect(() => {
    const fire = async () => {
      await getListings(parseInt(page || "1"));
    };
    if (!listings && fetchListingsStatus === FetchStatus.Idle) {
      fire();
    }
  }, [page, listings, getListings, fetchListingsStatus]);

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
                  `/market/listings/?page=${page ? parseInt(page) - 1 : 1}`
                )
              }
            >
              Prev
            </button>
          </div>
          <div className="bg-[#111] rounded flex items-center mb-8 max-w-2xl text-sm p-2 md:p-4 m-4">
            Page {parseInt(page || "1")}
          </div>
          <div className="">
            <button
              className="bg-[#111] rounded mb-8 text-sm p-2 md:p-4 my-4"
              onClick={() =>
                router.push(
                  page
                    ? `/market/listings/?page=${parseInt(page || "1") + 1}`
                    : "/market/listings/?page=2"
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
  }, [router, page]);

  return (
    <div>
      <MarketTabs currentTab={MarketTab.Listings} />
      <h1 className="text-center mt-2 mb-6 text-4xl text-yellow-600 font-mono font-semibold">
        Market Listings
      </h1>
      {fetchListingsStatus === FetchStatus.Success && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings?.map((l) => {
            return (
              <div key={l.origin}>
                <Artifact
                  key={l.origin || `${l.txid}_${l.vout}`}
                  origin={l.origin || `${l.txid}_${l.vout}`}
                  outPoint={l.outpoint}
                  contentType={l.file?.type}
                  num={l.num}
                  classNames={{
                    wrapper: "max-w-72 max-h-72 overflow-hidden mb-2",
                  }}
                  txid={l.txid}
                  price={l.price}
                  height={l.height}
                />
              </div>
            );
          })}
        </div>
      )}
      {pagination}
    </div>
  );
};

export default ListingsPage;
