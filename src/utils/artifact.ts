import { OrdUtxo } from "@/context/wallet";

export const fillContentType = async (artifact: OrdUtxo): Promise<OrdUtxo> => {
  const url = `https://ordinals.gorillapool.io/api/files/inscriptions/${artifact.txid}_${artifact.vout}`;
  const response = await fetch(url);
  const blob = await response.blob();

  artifact.type = blob.type;
  return artifact;
};
