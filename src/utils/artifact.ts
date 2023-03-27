import { OrdUtxo } from "@/context/wallet";
import { API_HOST } from "@/pages/_app";

export const fillContentType = async (artifact: OrdUtxo): Promise<OrdUtxo> => {
  const origin = artifact.origin || `${artifact.txid}_${artifact.vout}`;
  const url = `${API_HOST}/api/files/inscriptions/${origin}`;

  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(url);
      if (response.status !== 404) {
        const blob = await response.blob();

        artifact.type = blob.type;
      }
      resolve(artifact);
    } catch (e) {
      console.error(e);
      // dont fail if we cant find an image
      resolve(artifact);
    }
  });
};
