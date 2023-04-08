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
  Activity = "activity",
  Home = "home",
}

const MarketTabs: React.FC<Props> = ({
  currentTab,
  showIndicator,
  onClickSelected,
}) => {
  return (
    <S.Tabs className="max-w-7xl mx-auto my-8">
      {/* <S.Tab
        partiallyactive={currentTab === Tab.Overview ? "true" : "false"}
        href={`/`}
      >
        <IoMdSettings className="w-4 h-4" />
      </S.Tab> */}

      <S.Tab
        partiallyactive={currentTab === MarketTab.Home ? "true" : "false"}
        href={`/market`}
        onClick={(e) =>
          currentTab === MarketTab.Home && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Home
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
    </S.Tabs>
  );
};

export default MarketTabs;
