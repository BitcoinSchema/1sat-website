import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Bsv20List from "./bsv20List";
import { WalletTab } from "./tabs";

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
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <Bsv20List type={type} address={address} />
    </Suspense>
  );
};

export default WalletBsv20;
