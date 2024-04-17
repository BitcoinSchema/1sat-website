'use client';

import LRC20Listings from "@/components/LRC20Listings";
import OrdinalListings, { OrdViewMode } from "@/components/OrdinalListings";
import { AssetType } from "@/constants";
import { BSV20TXO, OrdUtxo } from "@/types/ordinals";
import TokenMarket from "../TokenMarket";
import MarketTabs from "./tabs";

export interface MarketPageProps {
  imageListings?: OrdUtxo[];
  collections?: OrdUtxo[];
  tokenListingsv2?: BSV20TXO[];
  modelListings?: OrdUtxo[];
  lrc20Listings?: OrdUtxo[];
  lrc20Tokens?: OrdUtxo[];
  selectedAssetType?: AssetType;
  title?: string;
  showTabs?: boolean;
  id?: string;
}

const MarketPage: React.FC<MarketPageProps> = (props) => {
  const { selectedAssetType } = props;
  let showTabs = props.showTabs;
  // tabs default to showing
  if (props.showTabs === undefined) {
    showTabs = true;
  }

  const Listings = ({ id }: { id?: string}) => {
    switch (selectedAssetType) {
      case AssetType.Ordinals:
        return <><OrdinalListings listings={props.imageListings!} mode={OrdViewMode.List} /></>;
      case AssetType.BSV20:
        return <TokenMarket type={AssetType.BSV20} id={props.id} />;
      case AssetType.BSV21:
        return <TokenMarket type={AssetType.BSV21} id={props.id} />;
      case AssetType.LRC20:
        return (
          <LRC20Listings
            listings={props.lrc20Listings!}
            tokens={props.lrc20Tokens!}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {props.title && (
        <div className="text-3xl font-bold mb-4">{props.title}</div>
      )}
      {/* {selectedAssetType === AssetType.Ordinals && <FeaturedCollections />} */}
      {showTabs && (
        <div className="flex">
          <MarketTabs
            selectedTab={selectedAssetType || AssetType.Ordinals}
          />
        </div>
      )}
      <div className="tab-content block bg-base-100 border-base-200 rounded-box p-2 md:p-6">
        <Listings id={props.id} />
      </div>
    </div>
  );
};

export default MarketPage;
