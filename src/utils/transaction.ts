import { API_HOST } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import { customFetch } from "@/utils/httpClient";

export const fetchOrdinal = async (outpoint: string) => {
  const { promise } = customFetch<OrdUtxo>(
    `${API_HOST}/api/inscriptions/${outpoint}?script=true`
  );
  return await promise;
};

export const SAT_FEE_PER_BYTE = 0.065;
