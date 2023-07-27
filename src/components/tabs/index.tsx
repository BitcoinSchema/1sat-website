import Link from "next/link";
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
  Airdrop = "airdrop",
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
        $partiallyactive={currentTab === Tab.Overview ? "true" : "false"}
        href={`/`}
      >
        <IoMdSettings className="w-4 h-4" />
      </S.Tab> */}

      <Link href={`/wallet`}>
        <S.Tab
          $partiallyactive={currentTab === Tab.Wallet ? "true" : "false"}
          onClick={(e: any) =>
            currentTab === Tab.Wallet && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          <IoMdWallet className="w-4 h-4" />
        </S.Tab>
      </Link>

      <Link href={`/inscribe`}>
        <S.Tab
          $partiallyactive={currentTab === Tab.Inscribe ? "true" : "false"}
          onClick={(e: any) =>
            currentTab === Tab.Inscribe && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          Inscribe
        </S.Tab>
      </Link>

      {/* <S.Tab
        $partiallyactive={currentTab === Tab.Airdrop ? "true" : "false"}
        href={`/airdrop`}
        onClick={(e) =>
          currentTab === Tab.Inscribe && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Airdrop
      </S.Tab> */}
      <Link href={`/market`}>
        <S.Tab
          $partiallyactive={currentTab === Tab.Market ? "true" : "false"}
          onClick={(e: any) =>
            currentTab === Tab.Market && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          Market
        </S.Tab>
      </Link>
    </S.Tabs>
  );
};

export default Tabs;
