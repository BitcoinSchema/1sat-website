import { API_HOST } from "@/constants";
import { OutpointTab } from "@/types/common";
import type { BSV20TXO, OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import OutpointPage from ".";

interface Props {
  outpoint: string;
}

const OutpointToken = async ({ outpoint }: Props) => {
  let artifact: OrdUtxo | undefined;
  let bsv20: BSV20TXO | undefined;
  try {
    const url = `${API_HOST}/api/bsv20/outpoint/${outpoint}`;
    const { promise } = http.customFetch<BSV20TXO>(url);
    bsv20 = await promise;
  } catch (e) {
    console.log(e);
  }

  try {
    const url = `${API_HOST}/api/inscriptions/${outpoint}`;
    const { promise } = http.customFetch<OrdUtxo>(url);
    artifact = await promise;
  } catch (e) {
    console.log(e);
  }

  const content =
    artifact && artifact.origin?.data?.bsv20 ? (
      <div>
        <div>{bsv20?.tick || bsv20?.sym}</div>
        {bsv20?.sym && bsv20.id ? <div className="text-sm">{bsv20.id}</div> : null}
        <div>{bsv20?.op}</div>
        <div>{bsv20?.amt}</div>
      </div>
    ) : (
      <div>Not a token</div>
    );

  return artifact && (
    <OutpointPage
      artifact={artifact}
      outpoint={outpoint}
      content={content}
      activeTab={OutpointTab.Token}
    />
  );
};

export default OutpointToken;
