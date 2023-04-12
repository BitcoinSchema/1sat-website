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
  Browse = "browse",
  Sell = "sell",
  Watch = "watch",
  Featured = "featured",
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
        partiallyactive={currentTab === MarketTab.Browse ? "true" : "false"}
        href={`/market/browse`}
        onClick={(e) =>
          currentTab === MarketTab.Browse && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Buy
      </S.Tab>

      <S.Tab
        partiallyactive={currentTab === MarketTab.Sell ? "true" : "false"}
        href={`/market/sell`}
        onClick={(e) =>
          currentTab === MarketTab.Sell && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Sell
      </S.Tab>

      <S.Tab
        partiallyactive={currentTab === MarketTab.Watch ? "true" : "false"}
        href={`/market/activity`}
        onClick={(e) =>
          currentTab === MarketTab.Watch && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Watch
      </S.Tab>
    </S.Tabs>
  );
};

export default MarketTabs;
