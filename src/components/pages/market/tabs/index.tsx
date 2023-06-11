import React from "react";
import * as S from "./styles";

interface Props {
  currentTab: MarketTab | undefined;
  showIndicator?: boolean;
  onClickSelected?: (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => void;
}

export enum MarketTab {
  Listings = "listings",
  BSV20 = "bsv20",
  Activity = "activity",
  Collections = "collections",
  New = "new",
}

const MarketTabs: React.FC<Props> = ({
  currentTab,
  showIndicator,
  onClickSelected,
}) => {
  return (
    <S.Tabs className="max-w-7xl mx-auto mb-8 flex justify-center">
      {/* <S.Tab partiallyactive={"false"} href={`/wallet`}>
        <IoMdWallet className="w-4 h-4" />
      </S.Tab> */}

      <S.Tab
        partiallyactive={
          currentTab === MarketTab.Collections ? "true" : "false"
        }
        href={`/market`}
        onClick={(e) =>
          currentTab === MarketTab.Collections && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Collections
      </S.Tab>
      <S.Tab
        partiallyactive={currentTab === MarketTab.Listings ? "true" : "false"}
        href={`/market/listings`}
        onClick={(e) =>
          currentTab === MarketTab.Listings && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Listings
      </S.Tab>
      <S.Tab
        partiallyactive={currentTab === MarketTab.BSV20 ? "true" : "false"}
        href={`/market/bsv20`}
        onClick={(e) =>
          currentTab === MarketTab.BSV20 && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        BSV-20
      </S.Tab>

      <S.Tab
        partiallyactive={currentTab === MarketTab.Activity ? "true" : "false"}
        href={`/market/activity`}
        onClick={(e) =>
          currentTab === MarketTab.Activity && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Activity
      </S.Tab>
      {/* <S.Tab
        partiallyactive={currentTab === MarketTab.New ? "true" : "false"}
        href={`/market/new`}
        onClick={(e) =>
          currentTab === MarketTab.New && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        New Listing
      </S.Tab> */}
    </S.Tabs>
  );
};

export default MarketTabs;
