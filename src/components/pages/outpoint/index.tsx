import Artifact from "@/components/artifact";
import { API_HOST } from "@/constants";
import { Listing } from "@/types/bsv20";
import { OrdUtxo } from "@/types/ordinals";
import { displayName } from "@/utils/artifact";
import * as http from "@/utils/httpClient";
import { Noto_Serif } from "next/font/google";
import OutpointTabs, { OutpointTab } from "./tabs";

const notoSerif = Noto_Serif({
  style: "italic",
  weight: ["400", "700"],
  subsets: ["latin"],
});

interface Props {
  artifact: OrdUtxo;
  listing?: Listing;
  history?: OrdUtxo[];
  spends?: OrdUtxo[];
  outpoint: string;
  content: JSX.Element;
  activeTab: OutpointTab;
}

const OutpointPage = async ({
  artifact,
  listing,
  history,
  spends,
  outpoint,
  content,
  activeTab,
}: Props) => {
  // I1 - Ordinal
  // I2 - Funding
  // O1 - Ordinal destination
  // O2 - Payment to lister
  // O3 - Market Fee
  // O4 - Change
  if (artifact && artifact.data?.list && !artifact.script) {
    const { promise } = http.customFetch<OrdUtxo>(
      `${API_HOST}/api/txos/${artifact.outpoint}?script=true`
    );

    const { script } = await promise;
    artifact.script = script;
  }

  // if (
  //   (price === 0 ? minimumMarketFee + price : price * 1.04) >=
  //   sumBy(fundingUtxos, "satoshis") + P2PKHInputSize * fundingUtxos.length
  // ) {
  //   toast.error("Not enough Bitcoin!", toastErrorProps);
  // }

  return (
    <div className="mx-auto flex flex-col p-2 md:p-0">
      <h2 className={`text-2xl mb-4  ${notoSerif.className}`}>
        {displayName(artifact, false)}
      </h2>
      <div className="flex flex-col md:flex-row gap-4">
        <Artifact
          artifact={artifact}
          size={600}
          sizes={"100vw"}
          glow={true}
          classNames={{ wrapper: "w-full md:w-1/2" }}
          showListingTag={true}
        />
        <div className="divider"></div>
        <div className="w-full md:w-1/2 mx-auto">
          <OutpointTabs activeTab={activeTab} outpoint={outpoint} />
          {content}
        </div>
      </div>
    </div>
  );
};

export default OutpointPage;
