import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { getRandomInt } from "@/utils/number";
import SlideShow from "./slideshow";
import FlowGrid from "./flowgrid";

const FlowLoader = async ({ artifact }: { artifact?: OrdUtxo }) => {
  const offset = getRandomInt(0, 1000);

  const { promise } = http.customFetch<OrdUtxo[]>(
    `${API_HOST}/api/market?limit=20&offset=${offset}&type=image/png`
  );
  const artifacts = await promise;
  if (!artifacts) {
    return null;
  }

  if (artifact) {
    artifacts.unshift(artifact);
  }

  return (
    <FlowGrid
      artifacts={artifacts}
      className="rounded-lg shadow-2xl min-h-96 mx-auto px-4"
    />
  );
};

export default FlowLoader;
