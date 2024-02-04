import { API_HOST } from "@/constants";
import { OrdUtxo } from "@/types/ordinals";
import * as http from "@/utils/httpClient";
import { getRandomInt } from "@/utils/number";
import SlideShow from "./slideshow";

const SlideshowLoader = async () => {
  const offset = getRandomInt(0, 1000);

  const { promise } = http.customFetch<OrdUtxo[]>(
    `${API_HOST}/api/market?limit=10&offset=${offset}&type=image/png`
  );
  const artifacts = await promise;

  return (
    <SlideShow
      artifacts={artifacts}
      className="max-w-md rounded-lg shadow-2xl min-h-96 mx-auto"
    />
  );
};

export default SlideshowLoader;