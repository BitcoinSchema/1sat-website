import TokenListingSkeleton from "@/components/skeletons/listing/Token";
import { AssetType } from "@/constants";
import { Suspense } from "react";
import List from "./list";

interface TokenMarketProps {
  type: AssetType.BSV20 | AssetType.BSV20V2;
}

const TokenMarket: React.FC<TokenMarketProps> = async ({ type }) => {
  return (
      <div className="w-full">
        <table className="table font-mono">
          <thead>
            <tr>
              <th className="min-w-16">Ticker</th>
              <th className="">Price</th>
              <th className="text-right w-full">Market Cap</th>
              <th className="text-right min-w-48">Holders</th>
            </tr>
          </thead>
          <Suspense fallback={<TokenListingSkeleton />}>
            <List type={type} />
          </Suspense>
        </table>
      </div>
  );
};

export default TokenMarket;
