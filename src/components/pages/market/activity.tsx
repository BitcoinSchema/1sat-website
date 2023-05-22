import Artifact from "@/components/artifact";
import MarketTabs, { MarketTab } from "@/components/pages/market/tabs/tabs";
import { useOrdinals } from "@/context/ordinals";
import { WithRouterProps } from "next/dist/client/with-router";
import { useRouter } from "next/router";
import React, { useEffect, useMemo } from "react";
import { FetchStatus } from "..";

interface PageProps extends WithRouterProps {}

const ActivityPage: React.FC<PageProps> = ({}) => {
  const router = useRouter();
  const { page } = router.query as { page: string | undefined };

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
      <MarketTabs currentTab={MarketTab.Activity} />
      <h1 className="text-center mt-2 mb-6 text-4xl text-yellow-600 font-mono font-semibold">
        Recent Activity
      </h1>
      <span className="text-center text-[#555]"></span>
      {fetchActivityStatus === FetchStatus.Success && (
        <div className="flex flex-col">
          {activity?.map((l) => {
            return (
              <div key={l.origin} className="flex">
                {/* <div>Listing? {l.listing ? "True" : "False"}</div> */}
                <Artifact
                  key={l.origin || `${l.txid}_${l.vout}`}
                  outPoint={l.origin || `${l.txid}_${l.vout}`}
                  contentType={l.file?.type}
                  id={l.id}
                  classNames={{
                    wrapper: "overflow-hidden mb-2",
                  }}
                  txid={l.txid}
                  price={l.price}
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
