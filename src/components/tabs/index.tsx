import React from "react";
import * as S from "./styles";
interface Props {
  currentTab: Tab | undefined;
  showIndicator?: boolean;
}

export enum Tab {
  Overview = "overview",
  Wallet = "wallet",
  Ordinals = "ordinals",
  Inscribe = "inscribe",
}

const Tabs: React.FC<Props> = ({ currentTab, showIndicator }) => {
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
      >
        Wallet
      </S.Tab>

      <S.Tab
        partiallyactive={currentTab === Tab.Inscribe ? "true" : "false"}
        href={`/inscribe`}
      >
        Inscribe
      </S.Tab>

      <S.Tab
        partiallyactive={currentTab === Tab.Ordinals ? "true" : "false"}
        href={`/ordinals`}
      >
        Ordinals
      </S.Tab>
    </S.Tabs>
  );
};

export default Tabs;
