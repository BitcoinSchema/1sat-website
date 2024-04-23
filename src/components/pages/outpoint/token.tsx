import { API_HOST } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import OutpointPage from ".";
import { OutpointTab } from "./tabs";

interface Props {
  outpoint: string;
}

const OutpointToken = async ({ outpoint }: Props) => {
  let artifact: OrdUtxo | undefined;
  let bsv20: OrdUtxo | undefined;
  try {
    const url = `${API_HOST}/api/bsv20/outpoint/${outpoint}`;
    const { promise } = http.customFetch<OrdUtxo>(url);
    artifact = await promise;
  } catch (e) {
    console.log(e);
  }

  try {
    const url = `${API_HOST}/api/inscriptions/${outpoint}`;
    const { promise } = http.customFetch<OrdUtxo>(url);
    bsv20 = await promise;
  } catch (e) {
    console.log(e);
  }

  const content =
    artifact && artifact.data?.bsv20 ? (
      <div>
        <div>Token</div>
      </div>
    ) : (
      <div>Not a token</div>
    );

  return (
    <OutpointPage
      artifact={artifact || bsv20!}
      outpoint={outpoint}
      content={content}
      activeTab={OutpointTab.Token}
    />
  );
  return;
};

export default OutpointToken;
