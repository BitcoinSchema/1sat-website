import Artifact from "@/components/artifact";
import { API_HOST } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import { displayName } from "@/utils/artifact";
import * as http from "@/utils/httpClient";
import { Noto_Serif } from "next/font/google";
import Timeline from "../../Timeline";

const notoSerif = Noto_Serif({
  style: "italic",
  weight: ["400", "700"],
  subsets: ["latin"],
});

interface Props {
  listing: OrdUtxo;
  history: OrdUtxo[];
  spends: OrdUtxo[];
}

const OutpointPage = async ({ listing, history, spends }: Props) => {
  // I1 - Ordinal
  // I2 - Funding
  // O1 - Ordinal destination
  // O2 - Payment to lister
  // O3 - Market Fee
  // O4 - Change

  const { promise } = http.customFetch<OrdUtxo>(
    `${API_HOST}/api/txos/${listing.outpoint}?script=true`
  );

  const { script } = await promise;
  listing.script = script;

  // if (
  //   (price === 0 ? minimumMarketFee + price : price * 1.04) >=
  //   sumBy(fundingUtxos, "satoshis") + P2PKHInputSize * fundingUtxos.length
  // ) {
  //   toast.error("Not enough Bitcoin!", toastErrorProps);

  // }

  console.log({ spends });
  return (
    <div className="mx-auto flex flex-col p-2 md:p-0">
      <h2 className={`text-2xl mb-4  ${notoSerif.className}`}>{displayName(listing, false)}</h2>
      <div className="flex flex-col md:flex-row gap-4">
        <Artifact
          artifact={listing}
          size={600}
          sizes={"100vw"}
          glow={true}
          classNames={{ wrapper: "w-full md:w-1/2" }}
          showListingTag={true}
        />
        <div className="divider"></div>
        <div className="w-full md:w-1/2 mx-auto">
          <div role="tablist" className={`tabs tabs-bordered mb-4`}>
            <a role="tab" className="tab tab-active">
              Timeline
            </a>
            <a role="tab" className="tab">
              Inscription
            </a>
            <a role="tab" className="tab">
              Token
            </a>
          </div>
          <Timeline history={history} spends={spends} listing={listing} />
        </div>
      </div>
    </div>
  );
};

export default OutpointPage;
