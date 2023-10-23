import { OrdUtxo } from "@/context/ordinals";
import { Hash } from "bsv-wasm-web";

export const fillContentType = async (artifact: OrdUtxo): Promise<OrdUtxo> => {
  const origin = artifact.origin || `${artifact.txid}_${artifact.vout}`;
  const url = `/content/${origin}`;

  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(url);
      if (response.status !== 404) {
        const blob = await response.blob();
        const buff = await response.arrayBuffer();
        artifact.file = {
          hash: Hash.sha_256(new Uint8Array(buff)).to_hex(),
          size: blob.size,
          type: blob.type,
        };
      }
      resolve(artifact);
    } catch (e) {
      console.error(e);
      // dont fail if we cant find an image
      resolve(artifact);
    }
  });
};
