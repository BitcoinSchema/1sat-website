import MarketTabs, { MarketTab } from "@/components/pages/market/tabs/tabs";
import { WithRouterProps } from "next/dist/client/with-router";
import { useState } from "react";

interface PageProps extends WithRouterProps {}

const MarketPage: React.FC<PageProps> = ({}) => {
  const [collections, setCollections] = useState([{ name: "Turdicorns" }]);

  return (
    <div>
      <MarketTabs currentTab={MarketTab.Featured} />

      <div>
        {collections?.map((c: any) => {
          return (
            <div key={c.collection}>
              <div className="text-center">{c.name}</div>
              <div>
                {c.items?.map((i: any) => {
                  return <div key={i.name}>{i.name}</div>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MarketPage;
