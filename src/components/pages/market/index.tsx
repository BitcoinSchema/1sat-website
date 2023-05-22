import MarketTabs, { MarketTab } from "@/components/pages/market/tabs/tabs";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";

interface PageProps extends WithRouterProps {}

const MarketPage: React.FC<PageProps> = ({}) => {
  return (
    <div>
      <MarketTabs currentTab={MarketTab.Home} />
      <h1 className="mt-2 mb-6 text-4xl text-yellow-600 font-mono font-semibold">
        Market
      </h1>
      <div>
        <Link href="/market/listings">Market Listings</Link>
      </div>
      <div>
        <Link href="/market/bsv20">BSV-20 Tickers</Link>
      </div>
      <div>
        <Link href="/market/activity">Recent Activity</Link>
      </div>
    </div>
  );
};

export default MarketPage;
