import Link from "next/link";
import React from "react";
import * as S from "./styles";
interface Props {
  currentTab: WalletTab | undefined;
  showIndicator?: boolean;
  onClickSelected?: (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => void;
}

export enum WalletTab {
  Bitcoin = "bitcoin",
  BSV20 = "bsv20",
  Ordinals = "ordinals",
}

const WalletTabs: React.FC<Props> = ({
  currentTab,
  showIndicator,
  onClickSelected,
}) => {
  return (
    <S.Tabs className="max-w-7xl mx-auto mb-8">
      <Link href={`/wallet`}>
        <S.Tab
          partiallyactive={currentTab === WalletTab.Bitcoin ? "true" : "false"}
          onClick={(e: any) =>
            currentTab === WalletTab.Bitcoin && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          Bitcoin SV
        </S.Tab>
      </Link>
      <Link href={`/ordinals`}>
        <S.Tab
          partiallyactive={currentTab === WalletTab.Ordinals ? "true" : "false"}
          onClick={(e: any) =>
            currentTab === WalletTab.Ordinals && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          Ordinals
        </S.Tab>
      </Link>
      <Link href={`/bsv20`}>
        <S.Tab
          partiallyactive={currentTab === WalletTab.BSV20 ? "true" : "false"}
          onClick={(e: any) =>
            currentTab === WalletTab.BSV20 && onClickSelected
              ? onClickSelected(e)
              : () => {}
          }
        >
          BSV-20
        </S.Tab>
      </Link>
      {/* <S.Tab
        partiallyactive={currentTab === WalletTab.BSV20 ? "true" : "false"}
        href={`/inscribe?tab=video`}
        onClick={(e) =>
          currentTab === WalletTab.Video && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Video
      </S.Tab> */}
    </S.Tabs>
  );
};

export default WalletTabs;
