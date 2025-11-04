import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import OwnerContent from "./ownerContent";

interface Props {
  outpoint: string;
}

const OwnerServer = async ({ outpoint }: Props) => {
  let artifact: OrdUtxo | undefined;

  try {
    const url = `${API_HOST}/api/inscriptions/${outpoint}`;
    const { promise} = http.customFetch<OrdUtxo>(url);
    artifact = await promise;
  } catch (e) {
    console.log(e);
  }

  if (!artifact) {
    return <div>Artifact not found</div>;
  }

  return <OwnerContent artifact={artifact} />;
};

export default OwnerServer;
