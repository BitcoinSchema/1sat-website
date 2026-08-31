"use client";

import type { WalletOutput } from "@1sat/actions";
import { useQuery } from "@tanstack/react-query";
import { ordfsClient } from "@/lib/stack";
import { getDisplayOutpoint } from "@/lib/wallet/wallet-output-utils";

export function useOrdinalMetadata(
	ordinals: WalletOutput[],
	identityKey: string | null,
	enabled: boolean,
) {
	const metadataRequests = ordinals.map(
		(ordinal) => `${getDisplayOutpoint(ordinal)}:-2`,
	);
	const metadataQuery = useQuery({
		queryKey: ["ordinal-metadata", identityKey, metadataRequests],
		queryFn: () => ordfsClient.bulkMetadata(metadataRequests),
		enabled: enabled && metadataRequests.length > 0,
		staleTime: 5 * 60_000,
	});

	return { metadataRequests, metadataQuery };
}
