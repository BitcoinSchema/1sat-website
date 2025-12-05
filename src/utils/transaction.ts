import { API_HOST, SATS_PER_BYTE } from "@/constants";
import type { OrdUtxo } from "@/types/ordinals";
import { customFetch } from "@/utils/httpClient";

export const fetchOrdinal = async (outpoint: string) => {
	const { promise } = customFetch<OrdUtxo>(
		`${API_HOST}/api/inscriptions/${outpoint}?script=true`,
	);
	return await promise;
};

// Re-export for backward compatibility
/** @deprecated Use SATS_PER_BYTE from @/constants instead */
export const SAT_FEE_PER_BYTE = SATS_PER_BYTE;
