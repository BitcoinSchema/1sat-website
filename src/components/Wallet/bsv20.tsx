import { Suspense } from "react";
import TokenListingSkeleton from "../skeletons/listing/Token";
import Bsv20List from "./bsv20List";
import { WalletTab } from "./tabs";
import { AssetType } from "@/constants";
interface WalletBsv20Props {
  type: WalletTab.BSV20 | WalletTab.BSV21;
  address?: string;
}

export type NumResults = {
  num: any;
  autofill: any;
};

const WalletBsv20 = async ({ type, address }: WalletBsv20Props) => {
  return (
    <div className="flex flex-col justify-start w-screen md:min-h-[80vh] max-w-[64rem]">
      <div className="w-full">
        <Suspense
          fallback={
            <table width={"100%"} className="w-full">
              <tr className="px-4 flex gap-4 items-center w-full py-2">
                <div className="w-24 skeleton h-8" />
                <div className="w-24 skeleton h-8" />
                <div className="w-24 skeleton h-8" />
              </tr>
              <TokenListingSkeleton type={type === WalletTab.BSV20 ? AssetType.BSV20 : AssetType.BSV21} />
            </table>
          }
        >
          <Bsv20List type={type} address={address} />
        </Suspense>
      </div>
    </div>
  );
};

export default WalletBsv20;
