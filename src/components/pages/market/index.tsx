import MarketTabs, { MarketTab } from "@/components/pages/market/tabs/tabs";
import { WithRouterProps } from "next/dist/client/with-router";

interface PageProps extends WithRouterProps {}

const MarketPage: React.FC<PageProps> = ({}) => {
  return (
    <div>
      <MarketTabs currentTab={MarketTab.Home} />
      <h1>Martket</h1>
      <div></div>
    </div>
  );
};

export default MarketPage;
