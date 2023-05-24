import React from "react";
import * as S from "./styles";
interface Props {
  currentTab: Tab | undefined;
  showIndicator?: boolean;
  onClickSelected?: (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => void;
}

export enum Tab {
  Overview = "overview",
  Wallet = "wallet",
  Ordinals = "ordinals",
  Inscribe = "inscribe",
  Market = "market",
  BSV20 = "bsv20",
}

const Tabs: React.FC<Props> = ({
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
        partiallyactive={currentTab === Tab.Wallet ? "true" : "false"}
        href={`/wallet`}
        onClick={(e) =>
          currentTab === Tab.Wallet && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Wallet
      </S.Tab>

      <S.Tab
        partiallyactive={currentTab === Tab.Inscribe ? "true" : "false"}
        href={`/inscribe`}
        onClick={(e) =>
          currentTab === Tab.Inscribe && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Inscribe
      </S.Tab>

      <S.Tab
        partiallyactive={currentTab === Tab.Ordinals ? "true" : "false"}
        href={`/ordinals`}
        onClick={(e) =>
          currentTab === Tab.Ordinals && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Ordinals
      </S.Tab>
      <S.Tab
        partiallyactive={currentTab === Tab.BSV20 ? "true" : "false"}
        href={`/bsv20`}
        onClick={(e) =>
          currentTab === Tab.BSV20 && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        BSV-20
      </S.Tab>
      <S.Tab
        partiallyactive={currentTab === Tab.Market ? "true" : "false"}
        href={`/market`}
        onClick={(e) =>
          currentTab === Tab.Market && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Market
      </S.Tab>
    </S.Tabs>
  );
};

export default Tabs;
