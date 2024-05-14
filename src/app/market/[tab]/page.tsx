import JDenticon from "@/components/JDenticon";
import MarketPage from "@/components/pages/market";
import Vivi from "@/components/vivi";
import { AssetType, MARKET_API_HOST } from "@/constants";
import type { LeaderboardEntry } from "@/types/ordinals";
import { getCapitalizedAssetType } from "@/utils/assetType";
import * as http from "@/utils/httpClient";
import { Noto_Serif } from "next/font/google";
import { FaCrown } from "react-icons/fa6";

const timeframe = 86400;
const notoSerif = Noto_Serif({
  style: "italic",
  weight: ["400", "700"],
  subsets: ["latin"],
});

const Market = async ({ params }: { params: { tab: AssetType } }) => {
  const urlLeaderboard = `${MARKET_API_HOST}/leaderboard?timeframe=${timeframe}`;
  const { promise: promiseLeaderboard } = http.customFetch<LeaderboardEntry[]>(urlLeaderboard);
  const leaderboardData = await promiseLeaderboard;

  let content = null;

  switch (params.tab) {
    case AssetType.Ordinals:
      content = <MarketPage selectedAssetType={AssetType.Ordinals} />;
      break;
    case AssetType.BSV20:
      content = <MarketPage selectedAssetType={AssetType.BSV20} />;
      break;
    case AssetType.BSV21:
      content = <MarketPage selectedAssetType={AssetType.BSV21} />;
      break;
    default:
      content = null;
  }

  return (
    <div className="drawer 3xl:drawer-open">
      <input id="left-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        <div className="drawer drawer-end 4xl:drawer-open">
          <input id="right-drawer" type="checkbox" className="drawer-toggle" />
          <div className="drawer-content">
            {content}
          </div>
          <div className="drawer-side">
            <label htmlFor="right-drawer" className="drawer-overlay" />
            <div className="p-4 w-md h-full border-l border-yellow-200/25 text-base-content overflow-hidden">
              <div className="flex flex-col items-center justify-center w-full h-full">
                <Vivi />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="drawer-side">
        <label htmlFor="left-drawer" className="drawer-overlay" />
        <div className="p-4 w-md h-full border-r border-yellow-200/25 text-base-content overflow-hidden">
          <h2 className={`flex justify-between text-2xl font-bold mb-4 ${notoSerif.className}`}>
            <div className="flex items-center">
              <FaCrown className="mr-2" /> Kings
            </div>
            <select
              value={timeframe}
              // onChange={(e) => setTimeframe(e.target.value)}
              className="select select-sm select-bordered w-fit"
            >
              <option value="24h">24 Hours</option>
              <option value="7d">7 Days</option>
              <option value="30d">30 Days</option>
            </select>
          </h2>

          <ul className="flex flex-col">
            {leaderboardData.map((entry, index) => (
              <li key={entry.address} className="flex flex-row items-center mb-4">
                <div className="relative">
                  <div className="mr-2 text-xl w-fit z-10 font-bold text-white absolute ml-3.5 mt-1.5 drop-shadow">{index + 1}</div>
                  <JDenticon hashOrValue={entry.address} className="w-10 h-10 mr-2 opacity-25" />
                </div>
                <div className="flex flex-col items-start flex-1">
                  <div className="text-xs font-bold font-mono">{entry.address}</div>
                  <div className="text-xs text-[#aaa] font-mono">
                    Total Spent: {entry.totalSpent} BSV
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Market;

export async function generateMetadata({
  params,
}: {
  params: { tab: AssetType };
}) {
  const assetType = getCapitalizedAssetType(params.tab);

  return {
    title: `${assetType} Market Listings - 1SatOrdinals`,
    description: `Explore market listings for ${assetType} on 1SatOrdinals.`,
    openGraph: {
      title: `${assetType} Market Listings - 1SatOrdinals`,
      description: `Explore market listings for ${assetType} on 1SatOrdinals.`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${assetType} Market Listings - 1SatOrdinals`,
      description: `Explore market listings for ${assetType} on 1SatOrdinals.`,
    },
  };
}

