import Link from "next/link";
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

      <Link href={`/market`}>
        <S.Tab
          $partiallyactive={
            currentTab === MarketTab.Collections ? "true" : "false"
          }
          onClick={(e: any) =>
            currentTab === MarketTab.Collections && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          Collections
        </S.Tab>
      </Link>
      <Link href={`/market/listings`}>
        <S.Tab
          $partiallyactive={
            currentTab === MarketTab.Listings ? "true" : "false"
          }
          onClick={(e: any) =>
            currentTab === MarketTab.Listings && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          Listings
        </S.Tab>
      </Link>
      <Link href={`/market/bsv20`}>
        <S.Tab
          $partiallyactive={currentTab === MarketTab.BSV20 ? "true" : "false"}
          onClick={(e: any) =>
            currentTab === MarketTab.BSV20 && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          BSV-20
        </S.Tab>
      </Link>
      <Link href={`/market/activity`}>
        <S.Tab
          $partiallyactive={
            currentTab === MarketTab.Activity ? "true" : "false"
          }
          onClick={(e: any) =>
            currentTab === MarketTab.Activity && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          Activity
        </S.Tab>
      </Link>
      <Link href={`/market/new`}>
        <S.Tab
          $partiallyactive={currentTab === MarketTab.New ? "true" : "false"}
          onClick={(e: any) =>
            currentTab === MarketTab.New && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          New Listing
        </S.Tab>
      </Link>
    </S.Tabs>
  );
};

export default MarketTabs;
