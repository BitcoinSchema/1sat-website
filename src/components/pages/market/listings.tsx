import Artifact from "@/components/artifact";
import MarketTabs, { MarketTab } from "@/components/pages/market/tabs/tabs";
import { useOrdinals } from "@/context/ordinals";
import { WithRouterProps } from "next/dist/client/with-router";
import React, { useEffect } from "react";
import { FetchStatus } from "..";

interface PageProps extends WithRouterProps {}

const ListingsPage: React.FC<PageProps> = ({}) => {
  const { listings, getListings, fetchListingsStatus } = useOrdinals();

  useEffect(() => {
    const fire = async () => {
      await getListings();
    };
    if (!listings && fetchListingsStatus === FetchStatus.Idle) {
      fire();
    }
  }, [listings, getListings, fetchListingsStatus]);

  return (
    <div>
      <MarketTabs currentTab={MarketTab.Listings} />
      <h1 className="mt-2 mb-6 text-4xl text-yellow-600 font-mono font-semibold">
        Market Listings
      </h1>
      {fetchListingsStatus === FetchStatus.Success && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings?.map((l) => {
            return (
              <div key={l.origin}>
                <Artifact
                  key={l.origin || `${l.txid}_${l.vout}`}
                  outPoint={l.origin || `${l.txid}_${l.vout}`}
                  contentType={l.file.type}
                  id={l.id}
                  classNames={{
                    wrapper: "max-w-72 max-h-72 overflow-hidden mb-2",
                  }}
                  txid={l.txid}
                  price={l.price}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ListingsPage;
