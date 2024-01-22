import { API_HOST } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import OutpointPage from ".";
import { OutpointTab } from "./tabs";

interface Props {
  outpoint: string;
}

const OutpointToken = async ({ outpoint }: Props) => {
  const url = `${API_HOST}/api/inscriptions/${outpoint}`;
  const { promise } = http.customFetch<OrdUtxo>(url);
  const artifact = await promise;
      return (
    <OutpointPage artifact={artifact} outpoint={outpoint} content={<div><h1>Token</h1></div>} activeTab={OutpointTab.Token} />
  );

};

export default OutpointToken;