import React from "react";
import { IoMdWallet } from "react-icons/io";
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
  Inscribe = "inscribe",
  Market = "market",
}

const Tabs: React.FC<Props> = ({
  currentTab,
  showIndicator,
  onClickSelected,
}) => {
  return (
    <S.Tabs className="max-w-7xl mx-auto mt-8 flex justify-center">
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
        <IoMdWallet className="w-4 h-4" />
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
