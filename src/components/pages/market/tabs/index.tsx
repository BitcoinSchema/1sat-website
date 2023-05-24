import React from "react";
import { IoMdArrowRoundBack } from "react-icons/io";
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
  Featured = "featured",
}

const MarketTabs: React.FC<Props> = ({
  currentTab,
  showIndicator,
  onClickSelected,
}) => {
  return (
    <S.Tabs className="max-w-7xl mx-auto my-8 flex justify-center">
      <S.Tab partiallyactive={"false"} href={`/`}>
        <IoMdArrowRoundBack className="w-4 h-4" />
      </S.Tab>

      <S.Tab
        partiallyactive={currentTab === MarketTab.Featured ? "true" : "false"}
        href={`/market`}
        onClick={(e) =>
          currentTab === MarketTab.Featured && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Featured
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
    </S.Tabs>
  );
};

export default MarketTabs;
