import MarketTabs, { MarketTab } from "@/components/pages/market/tabs";
import { WithRouterProps } from "next/dist/client/with-router";
import Link from "next/link";

interface PageProps extends WithRouterProps {}

const MarketPage: React.FC<PageProps> = ({}) => {
  return (
    <div className="p-4">
      <MarketTabs currentTab={MarketTab.Featured} />
      <h1 className="mt-2 mb-6 text-4xl text-yellow-600 font-mono font-semibold">
        Market
      </h1>
      <div className="p-4 rounded bg-[#222] mb-4">
        Curated Market Landing Page SoonTm
      </div>
      <div>
        <Link
          href="/market/listings"
          className="text-blue-400 hover:text-blue-500 transition"
        >
          Market Listings
        </Link>
      </div>
      <div>
        <Link
          href="/market/bsv20"
          className="text-blue-400 hover:text-blue-500 transition"
        >
          BSV-20 Tickers
        </Link>
      </div>
      <div>
        <Link
          href="/market/activity"
          className="text-blue-400 hover:text-blue-500 transition"
        >
          Recent Activity
        </Link>
      </div>
    </div>
  );
};

export default MarketPage;
