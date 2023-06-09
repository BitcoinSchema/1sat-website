import { PendingTransaction } from "@/context/wallet";
import Router, { useRouter } from "next/router";
import React, { useCallback, useMemo } from "react";
import InscribeBsv20 from "./bsv20";
import InscribeCollection from "./collection";
import InscribeHtml from "./html";
import InscribeImage from "./image";
import InscriptionTabs, { InscriptionTab } from "./tabs";
import InscribeText from "./text";

type InscribeProps = {
  className?: string;
};

const Inscribe: React.FC<InscribeProps> = ({ className }) => {
  const { tab } = useRouter().query as {
    tab: InscriptionTab;
  };

  const selectedTab = useMemo(() => {
    if (tab) {
      return tab as InscriptionTab;
    }
    return InscriptionTab.Image;
  }, [tab]);

  const inscribedCallback = useCallback((pendingTx: PendingTransaction) => {
    console.log("Inscribed", pendingTx);
    Router.push("/preview");
  }, []);

  return (
    <div
      className={`${
        className ? className : ""
      } flex flex-col w-full mx-auto p-4`}
    >
      <InscriptionTabs currentTab={selectedTab || InscriptionTab.Image} />
      <div className="w-full">
        {selectedTab === InscriptionTab.Text && (
          <InscribeText inscribedCallback={inscribedCallback} />
        )}
        {selectedTab === InscriptionTab.HTML && (
          <InscribeHtml inscribedCallback={inscribedCallback} />
        )}
        {selectedTab === InscriptionTab.Image && (
          <InscribeImage inscribedCallback={inscribedCallback} />
        )}
        {selectedTab === InscriptionTab.BSV20 && (
          <InscribeBsv20 inscribedCallback={inscribedCallback} />
        )}
        {selectedTab === InscriptionTab.Collection && (
          <InscribeCollection inscribedCallback={inscribedCallback} />
        )}
      </div>
    </div>
  );
};

export default Inscribe;
