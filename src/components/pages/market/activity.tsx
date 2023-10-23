import Artifact from "@/components/artifact";
import MarketTabs, { MarketTab } from "@/components/pages/market/tabs";
import { Tab } from "@/components/tabs";
import { useOrdinals } from "@/context/ordinals";
import { WithRouterProps } from "next/dist/client/with-router";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useMemo } from "react";
import { FetchStatus } from "..";
import Tabs from "../../tabs";

interface PageProps extends WithRouterProps {}

const ActivityPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = searchParams.get("page");

  const { activity, getActivity, fetchActivityStatus } = useOrdinals();

  useEffect(() => {
    const fire = async () => {
      await getActivity(parseInt(page || "1"));
    };
    if (!activity && fetchActivityStatus === FetchStatus.Idle) {
      fire();
    }
  }, [page, activity, getActivity, fetchActivityStatus]);

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
      <Tabs currentTab={Tab.Market} />
      <MarketTabs currentTab={MarketTab.Activity} />
      <h1 className="text-center mt-2 mb-6 text-4xl text-yellow-600 font-mono font-semibold">
        Recent Activity
      </h1>
      <span className="text-center text-[#555]"></span>
      {fetchActivityStatus === FetchStatus.Success && (
        <div className="p-4 grid w-full mx-auto justify-center sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-7xl">
          {activity?.map((l) => {
            return (
              <div key={l.origin?.outpoint} className="">
                {/* <div>Listing? {l.listing ? "True" : "False"}</div> */}
                <Artifact
                  key={l.origin?.outpoint || `${l.txid}_${l.vout}`}
                  origin={l.origin?.outpoint || `${l.txid}_${l.vout}`}
                  contentType={l.file?.type}
                  num={l.num}
                  classNames={{
                    wrapper: "overflow-hidden mb-2",
                  }}
                  txid={l.txid}
                  price={l.price || 0}
                  height={l.height}
                  isListing={l.listing}
                  outPoint={l.outpoint}
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

export default ActivityPage;
