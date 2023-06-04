import MarketTabs, { MarketTab } from "@/components/pages/market/tabs";
import Tabs, { Tab } from "@/components/tabs";
import { WithRouterProps } from "next/dist/client/with-router";
import React from "react";
import FeaturedCollections from "./featured";

interface PageProps extends WithRouterProps {}

const MarketPage: React.FC<PageProps> = ({}) => {
  return (
    <React.Fragment>
      <Tabs currentTab={Tab.Market} />

      <MarketTabs currentTab={MarketTab.Featured} />
      <div className="p-4">
        <h1 className="mt-2 mb-6 text-4xl text-yellow-600 font-mono font-semibold">
          Featured Collections
        </h1>
        <div className="p-4 rounded bg-[#222] mb-4">
          <FeaturedCollections />
        </div>
      </div>
    </React.Fragment>
  );
};

export default MarketPage;
