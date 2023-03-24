import { OrdUtxo } from "@/context/wallet";

export const fillContentType = async (artifact: OrdUtxo): Promise<OrdUtxo> => {
  const url = `https://ordinals.gorillapool.io/api/files/inscriptions/${artifact.txid}_${artifact.vout}`;

  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      artifact.type = blob.type;
      resolve(artifact);
    } catch (e) {
      console.error(e);
      // dont fail if we cant find an image
      resolve(artifact);
    }
  });
};
