import { AssetType } from "@/constants";
import Link from "next/link";
import { FaPlus } from "react-icons/fa6";

const WalletTabs = ({
  type,
  address,
}: {
  type: AssetType;
  address?: string;
}) => {
  return (
    <div className="navbar min-h-0 py-0 px-4">
      <div className="flex-1">
        <div
          role="tablist"
          className={`tabs tabs-lg max-w-[300px] tabs-lifted`}
        >
          <Link
            role="tab"
            href={
              address ? `/activity/${address}/ordinals` : `/wallet/ordinals`
            }
            className={`tab border-base-200 ${type === AssetType.Ordinals ? "tab-active" : ""}`}
          >
            Ordinals
          </Link>
          <Link
            role="tab"
            href={address ? `/activity/${address}/bsv20` : `/wallet/bsv20`}
            className={`tab border-base-200 ${type === AssetType.BSV20 ? "tab-active" : ""}`}
          >
            BSV20
          </Link>
          <Link
            href={address ? `/activity/${address}/bsv21` : `/wallet/bsv21`}
            role="tab"
            className={`tab border-base-200 ${type === AssetType.BSV21 ? "tab-active" : ""}`}
          >
            BSV21
          </Link>
        </div>
      </div>
      <div className="flex-none">
        <Link className="btn btn-sm btn-square btn-ghost" href={`/inscribe?tab=${type === AssetType.Ordinals ? 'image' : type}`}>
          <FaPlus />
        </Link>
      </div>
    </div>
  );
};

export default WalletTabs;
