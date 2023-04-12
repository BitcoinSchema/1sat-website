import Artifact from "@/components/artifact";
import MarketTabs, { MarketTab } from "@/components/pages/market/tabs/tabs";
import { useOrdinals } from "@/context/ordinals";
import { WithRouterProps } from "next/dist/client/with-router";
import React, { useEffect } from "react";
import { FetchStatus } from "..";

interface PageProps extends WithRouterProps {}

const BrowsePage: React.FC<PageProps> = ({}) => {
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
      <MarketTabs currentTab={MarketTab.Browse} />
      <h1>Listings</h1>
      {fetchListingsStatus === FetchStatus.Success && (
        <div>
          {listings?.map((l) => {
            return (
              <div key={l.origin}>
                Listing
                <Artifact outPoint={l.origin} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrowsePage;
