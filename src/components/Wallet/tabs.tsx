import { AssetType } from "@/constants";

const Tabs = ({ type, address }: { type: AssetType; address?: string }) => {
  return (
    <div role="tablist" className={`tabs tabs-lg max-w-[300px] tabs-lifted ml-4`}>
      <a
        role="tab"
        href={address ? `/activity/${address}/ordinals` : `/wallet/ordinals`}
        className={`tab  ${type === AssetType.Ordinals ? "tab-active" : ""}`}
      >
        Ordinals
      </a>
      <a
        role="tab"
        href={address ? `/activity/${address}/bsv20` : `/wallet/bsv20`}
        className={`tab  ${type === AssetType.BSV20 ? "tab-active" : ""}`}
      >
        BSV20
      </a>
      <a
        href={address ? `/activity/${address}/bsv20v2` : `/wallet/bsv20v2`}
        role="tab"
        className={`tab ${type === AssetType.BSV20V2 ? "tab-active" : ""}`}
      >
        BSV21
      </a>
    </div>
  );
};

export default Tabs;
