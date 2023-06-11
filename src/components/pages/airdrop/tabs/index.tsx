import React from "react";
import * as S from "./styles";
interface Props {
  currentTab: AirdropTab | undefined;
  showIndicator?: boolean;
  onClickSelected?: (
    e: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => void;
}

export enum AirdropTab {
  Bitcoin = "bitcoin",
  BSV20 = "bsv20",
  Ordinals = "ordinals",
}

const AirdropTabs: React.FC<Props> = ({
  currentTab,
  showIndicator,
  onClickSelected,
}) => {
  return (
    <S.Tabs className="max-w-7xl mx-auto mb-8">
      <S.Tab
        partiallyactive={currentTab === AirdropTab.Bitcoin ? "true" : "false"}
        href={`/airdrop/bitcoin`}
        onClick={(e) =>
          currentTab === AirdropTab.Bitcoin && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Bitcoin SV
      </S.Tab>
      <S.Tab
        partiallyactive={currentTab === AirdropTab.Ordinals ? "true" : "false"}
        href={`/airdrop/ordinals`}
        onClick={(e) =>
          currentTab === AirdropTab.Ordinals && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Ordinals
      </S.Tab>
      <S.Tab
        partiallyactive={currentTab === AirdropTab.BSV20 ? "true" : "false"}
        href={`/airdrop`}
        onClick={(e) =>
          currentTab === AirdropTab.BSV20 && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        BSV-20
      </S.Tab>
      {/* <S.Tab
        partiallyactive={currentTab === AirdropTab.BSV20 ? "true" : "false"}
        href={`/inscribe?tab=video`}
        onClick={(e) =>
          currentTab === AirdropTab.Video && onClickSelected
            ? onClickSelected(e)
            : () => {}
        }
      >
        Video
      </S.Tab> */}
    </S.Tabs>
  );
};

export default AirdropTabs;
